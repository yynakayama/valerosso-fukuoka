// server.js - サーバーのメインファイル
const express = require('express'); // Expressフレームワークのインポート
const cors = require('cors');       // CORSミドルウェアのインポート
const session = require('express-session'); // セッション管理
const bcrypt = require('bcryptjs'); // パスワードハッシュ化
const path = require('path');      // パス操作
const csrf = require('csurf');     // CSRF保護
const cookieParser = require('cookie-parser'); // Cookieの解析
const MySQLStore = require('express-mysql-session')(session);
require('dotenv').config();         // 環境変数の読み込み

// データベースモデルのインポート
const { User, News } = require('./models');

// Expressアプリケーションの初期化
const app = express();
const PORT = process.env.PORT || 3000; // 環境変数からポート番号を取得、なければ3000を使用

// ミドルウェアの設定
app.use(cors());                // クロスオリジンリクエストを許可
app.use(express.json());        // JSONリクエストボディの解析
app.use(express.urlencoded({ extended: false })); // フォームデータの解析
app.use(cookieParser());        // Cookieの解析
app.use(express.static('public')); // 静的ファイルの提供（HTMLやCSS、画像など）

// EJSをビューエンジンとして設定
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// セッションの設定
app.use(session({
  secret: process.env.SESSION_SECRET || 'valerosso-fukuoka-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // 本番環境ではHTTPSを使用
    maxAge: 24 * 60 * 60 * 1000 // 24時間
  }
}));

// CSRF保護の設定（管理画面で使用）
const csrfProtection = csrf({ cookie: true });

// 認証ミドルウェア - 管理者ページへのアクセスを制限
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/admin/login');
  }
  next();
};

// 未認証ミドルウェア - ログイン済みの場合はadminパネルへリダイレクト
const requireNoAuth = (req, res, next) => {
  if (req.session.userId) {
    return res.redirect('/admin/panel');
  }
  next();
};

// 管理者情報をレスポンスに含める
app.use(async (req, res, next) => {
  if (req.session.userId) {
    try {
      const user = await User.findByPk(req.session.userId);
      if (user) {
        res.locals.currentUser = {
          id: user.id,
          username: user.username,
          role: user.role
        };
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  }
  next();
});

// テスト用APIエンドポイント - サーバーが正常に動作しているか確認するため
app.get('/api/test', (req, res) => {
  res.json({ message: 'APIが正常に動作しています' });
});

// ニュース一覧を取得するAPIエンドポイント（修正版）
app.get('/api/news', async (req, res) => {
  try {
    // データベースからニュース一覧を取得（日付順にソート）
    const news = await News.findAll({
      order: [['created_at', 'DESC']], // 新しい記事を先頭に
      attributes: [
        'id', 
        'title', 
        'content', 
        'instagram_embed_code', // ★追加
        'created_at'
      ], 
      include: [{
        model: User,
        as: 'author',
        attributes: ['username', 'full_name']
      }]
    });
    
    res.json(news);
  } catch (error) {
    console.error('News fetch error:', error);
    res.status(500).json({ message: 'ニュースの取得に失敗しました' });
  }
});

// 特定のニュース記事を取得するAPIエンドポイント（修正版）
app.get('/api/news/:id', async (req, res) => {
  try {
    const newsId = parseInt(req.params.id);
    
    // データベースから特定の記事を取得
    const newsItem = await News.findByPk(newsId, {
      attributes: [
        'id', 
        'title', 
        'content', 
        'instagram_embed_code', // ★追加
        'created_at'
      ], 
      include: [{
        model: User,
        as: 'author',
        attributes: ['username', 'full_name']
      }]
    });
    
    if (!newsItem) {
      return res.status(404).json({ message: '記事が見つかりません' });
    }
    
    res.json(newsItem);
  } catch (error) {
    console.error('News fetch error:', error);
    res.status(500).json({ message: '記事の取得に失敗しました' });
  }
});

// 新規ニュース投稿APIエンドポイント
app.post('/api/news', async (req, res) => {
  try {
    const { title, content } = req.body;
    
    // データベースに新しいニュース記事を作成
    const newItem = await News.create({
      title,
      content,
      author_id: req.session?.userId || 1 // ログイン中のユーザーIDまたはデフォルト
    });
    
    // 作成された記事を返す（ステータスコード201：Created）
    res.status(201).json(newItem);
  } catch (error) {
    console.error('News creation error:', error);
    res.status(500).json({ message: 'ニュース記事の作成に失敗しました' });
  }
});

// ニュース記事を削除するAPIエンドポイント
app.delete('/api/news/:id', async (req, res) => {
  try {
    const newsId = parseInt(req.params.id);
    
    // データベースから記事を削除
    const deletedCount = await News.destroy({
      where: { id: newsId }
    });
    
    // 削除された記事がない場合は404エラーを返す
    if (deletedCount === 0) {
      return res.status(404).json({ message: '削除する記事が見つかりません' });
    }
    
    // 正常に削除された場合の応答
    res.json({ message: '記事が正常に削除されました' });
  } catch (error) {
    console.error('News deletion error:', error);
    res.status(500).json({ message: 'ニュース記事の削除に失敗しました' });
  }
});

// 管理者ログインページ
app.get('/admin/login', requireNoAuth, csrfProtection, (req, res) => {
  res.render('admin/login', { 
    error: null,
    csrfToken: req.csrfToken()
  });
});

// ログイン処理
app.post('/admin/login', requireNoAuth, csrfProtection, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // データベースからユーザーを検索
    const user = await User.findOne({ where: { username } });
    
    if (!user) {
      return res.render('admin/login', { 
        error: 'ユーザー名またはパスワードが間違っています',
        csrfToken: req.csrfToken()
      });
    }
    
    // パスワードの検証
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.render('admin/login', { 
        error: 'ユーザー名またはパスワードが間違っています',
        csrfToken: req.csrfToken()
      });
    }
    
    // セッションにユーザーIDを保存
    req.session.userId = user.id;
    
    // 管理者パネルにリダイレクト
    res.redirect('/admin/panel');
  } catch (error) {
    console.error('Login error:', error);
    res.render('admin/login', { 
      error: 'ログイン処理中にエラーが発生しました',
      csrfToken: req.csrfToken()
    });
  }
});

// 管理者パネル
app.get('/admin/panel', requireAuth, csrfProtection, async (req, res) => {
  try {
    // データベースから最新のニュースを取得（最大10件）
    const latestNews = await News.findAll({
      order: [['created_at', 'DESC']],
      limit: 10,
      include: [{
        model: User,
        as: 'author',
        attributes: ['username', 'full_name']
      }]
    });
    
    res.render('admin/panel', { 
      news: latestNews,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.error('Admin panel error:', error);
    res.status(500).send('管理者パネルの読み込み中にエラーが発生しました');
  }
});

// ニュース一覧ページ
app.get('/admin/news', requireAuth, csrfProtection, async (req, res) => {
  try {
    // データベースからニュースを日付順に取得
    const sortedNews = await News.findAll({
      order: [['created_at', 'DESC']],
      include: [{
        model: User,
        as: 'author',
        attributes: ['username', 'full_name']
      }]
    });
    
    res.render('admin/news-list', { 
      news: sortedNews,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.error('News list error:', error);
    res.status(500).send('ニュース一覧の読み込み中にエラーが発生しました');
  }
});

// 新規ニュース作成フォーム
app.get('/admin/news/create', requireAuth, csrfProtection, (req, res) => {
  res.render('admin/news-form', { 
    news: null,
    formAction: '/admin/news/create',
    formTitle: 'お知らせ記事の新規作成',
    csrfToken: req.csrfToken()
  });
});

// ニュース作成処理
app.post('/admin/news/create', requireAuth, csrfProtection, async (req, res) => {
  try {
    const { title, content, instagram_embed_code } = req.body;
    
    // データベースに新しいニュース記事を作成
    await News.create({
      title,
      content,
      instagram_embed_code: instagram_embed_code || null,
      author_id: req.session.userId
    });
    
    res.redirect('/admin/news');
  } catch (error) {
    console.error('News creation error:', error);
    res.status(500).send('ニュース記事の作成中にエラーが発生しました');
  }
});

// ニュース編集フォーム
app.get('/admin/news/edit/:id', requireAuth, csrfProtection, async (req, res) => {
  try {
    const newsId = parseInt(req.params.id);
    
    // データベースから記事を取得
    const news = await News.findByPk(newsId);
    
    if (!news) {
      return res.status(404).send('ニュース記事が見つかりません');
    }
    
    res.render('admin/news-form', { 
      news,
      formAction: `/admin/news/edit/${news.id}`,
      formTitle: 'お知らせ記事の編集',
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.error('News edit form error:', error);
    res.status(500).send('ニュース編集フォームの読み込み中にエラーが発生しました');
  }
});

// ニュース更新処理
app.post('/admin/news/edit/:id', requireAuth, csrfProtection, async (req, res) => {
  try {
    const newsId = parseInt(req.params.id);
    const { title, content, instagram_embed_code } = req.body;
    
    // データベースの記事を更新
    const [updatedCount] = await News.update({
      title,
      content,
      instagram_embed_code: instagram_embed_code || null
    }, {
      where: { id: newsId }
    });
    
    if (updatedCount === 0) {
      return res.status(404).send('ニュース記事が見つかりません');
    }
    
    res.redirect('/admin/news');
  } catch (error) {
    console.error('News update error:', error);
    res.status(500).send('ニュース記事の更新中にエラーが発生しました');
  }
});

// ニュース削除処理
app.post('/admin/news/delete/:id', requireAuth, csrfProtection, async (req, res) => {
  try {
    const newsId = parseInt(req.params.id);
    
    // データベースから記事を削除
    const deletedCount = await News.destroy({
      where: { id: newsId }
    });
    
    if (deletedCount === 0) {
      return res.status(404).send('削除する記事が見つかりません');
    }
    
    res.redirect('/admin/news');
  } catch (error) {
    console.error('News deletion error:', error);
    res.status(500).send('ニュース記事の削除中にエラーが発生しました');
  }
});

// ログアウト処理
app.get('/admin/logout', (req, res) => {
  // セッションを破棄
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).send('ログアウト処理中にエラーが発生しました');
    }
    res.redirect('/admin/login');
  });
});

// 管理者権限チェックミドルウェア
const requireAdmin = (req, res, next) => {
  if (!req.session.userId || !res.locals.currentUser || res.locals.currentUser.role !== 'admin') {
    return res.status(403).send('このページにアクセスする権限がありません');
  }
  next();
};

// ユーザー一覧ページ
app.get('/admin/users', requireAuth, requireAdmin, csrfProtection, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'full_name', 'role'],
      order: [['username', 'ASC']]
    });
    
    res.render('admin/users', { 
      users,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.error('Users list error:', error);
    res.status(500).send('ユーザー一覧の読み込み中にエラーが発生しました');
  }
});

// 新規ユーザー作成フォーム
app.get('/admin/users/create', requireAuth, requireAdmin, csrfProtection, (req, res) => {
  res.render('admin/user-form', { 
    user: null,
    formAction: '/admin/users/create',
    formTitle: '新規ユーザーの作成',
    csrfToken: req.csrfToken()
  });
});

// ユーザー作成処理
app.post('/admin/users/create', requireAuth, requireAdmin, csrfProtection, async (req, res) => {
  try {
    const { username, password, full_name, role } = req.body;
    
    // ユーザー名の重複チェック
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.render('admin/user-form', {
        user: null,
        formAction: '/admin/users/create',
        formTitle: '新規ユーザーの作成',
        error: 'このユーザー名は既に使用されています',
        csrfToken: req.csrfToken()
      });
    }
    
    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // ユーザーの作成
    await User.create({
      username,
      password: hashedPassword,
      full_name,
      role
    });
    
    res.redirect('/admin/users');
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).send('ユーザーの作成中にエラーが発生しました');
  }
});

// ユーザー編集フォーム
app.get('/admin/users/edit/:id', requireAuth, requireAdmin, csrfProtection, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // 自分自身の編集は許可しない
    if (userId === req.session.userId) {
      return res.status(403).send('自分自身のアカウントはこの画面から編集できません');
    }
    
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'full_name', 'role']
    });
    
    if (!user) {
      return res.status(404).send('ユーザーが見つかりません');
    }
    
    res.render('admin/user-form', { 
      user,
      formAction: `/admin/users/edit/${user.id}`,
      formTitle: 'ユーザーの編集',
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.error('User edit form error:', error);
    res.status(500).send('ユーザー編集フォームの読み込み中にエラーが発生しました');
  }
});

// ユーザー更新処理
app.post('/admin/users/edit/:id', requireAuth, requireAdmin, csrfProtection, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { username, password, full_name, role } = req.body;
    
    // 自分自身の編集は許可しない
    if (userId === req.session.userId) {
      return res.status(403).send('自分自身のアカウントはこの画面から編集できません');
    }
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).send('ユーザーが見つかりません');
    }
    
    // ユーザー名の重複チェック（自分以外）
    if (username !== user.username) {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.render('admin/user-form', {
          user,
          formAction: `/admin/users/edit/${user.id}`,
          formTitle: 'ユーザーの編集',
          error: 'このユーザー名は既に使用されています',
          csrfToken: req.csrfToken()
        });
      }
    }
    
    // 更新データの準備
    const updateData = {
      username,
      full_name,
      role
    };
    
    // パスワードが入力されている場合のみ更新
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    // ユーザーの更新
    await user.update(updateData);
    
    res.redirect('/admin/users');
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).send('ユーザーの更新中にエラーが発生しました');
  }
});

// ユーザー削除処理
app.post('/admin/users/delete/:id', requireAuth, requireAdmin, csrfProtection, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // 自分自身の削除は許可しない
    if (userId === req.session.userId) {
      return res.status(403).send('自分自身のアカウントは削除できません');
    }
    
    const deletedCount = await User.destroy({
      where: { id: userId }
    });
    
    if (deletedCount === 0) {
      return res.status(404).send('削除するユーザーが見つかりません');
    }
    
    res.redirect('/admin/users');
  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).send('ユーザーの削除中にエラーが発生しました');
  }
});

// その他のページは静的ファイルとして提供
app.get('*', (req, res) => {
  // path部分を抽出してHTMLファイルを探す
  const requestPath = req.path.substring(1) || 'index';
  const htmlPath = path.join(__dirname, 'public', `${requestPath}.html`);
  
  // ファイルが存在するか確認
  res.sendFile(htmlPath, err => {
    if (err) {
      // ファイルが見つからない場合は404ページを表示
      res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
    }
  });
});

// サーバーの起動
app.listen(PORT, () => {
  console.log(`サーバーがポート${PORT}で起動しました`);
});

module.exports = app; // テスト用にエクスポート
// server.js - サーバーのメインファイル
const express = require('express'); // Expressフレームワークのインポート
const cors = require('cors');       // CORSミドルウェアのインポート
const session = require('express-session'); // セッション管理
const bcrypt = require('bcryptjs'); // パスワードハッシュ化
const path = require('path');      // パス操作
const csrf = require('csurf');     // CSRF保護
const cookieParser = require('cookie-parser'); // Cookieの解析
const MySQLStore = require('express-mysql-session')(session);
const { User } = require('./models');
require('dotenv').config();         // 環境変数の読み込み

// データベースモデルのインポート（コメントアウトを解除する予定）
// const db = require('./models');
// const User = db.User;
// const News = db.News;

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

// 仮のユーザーデータ（後でデータベースに置き換え予定）
const users = [];

// 仮のニュースデータ（後でデータベースに置き換え予定）
let newsItems = [
  {
    id: 1,
    title: '夏季トレーニングキャンプの日程発表',
    content: '今年の夏季トレーニングキャンプは8月10日から15日まで福岡市内で行われます。詳細は後日お知らせします。',
    date: '2025-04-15',
    instagram_embed_code: null,
    author_id: 1
  },
  {
    id: 2,
    title: '新入部員募集のお知らせ',
    content: '2025年度の新入部員を募集しています。体験練習も随時受け付けていますので、興味のある方はお問い合わせください。',
    date: '2025-04-16',
    instagram_embed_code: null,
    author_id: 1
  }
];

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

// ニュース一覧を取得するAPIエンドポイント
app.get('/api/news', (req, res) => {
  // Instagram埋め込みコードを含めないようにフィルタリング
  const publicNewsItems = newsItems.map(item => ({
    id: item.id,
    title: item.title,
    content: item.content,
    date: item.date
  }));
  res.json(publicNewsItems);
});

// 特定のニュース記事を取得するAPIエンドポイント
app.get('/api/news/:id', (req, res) => {
  // URLパラメータから記事IDを取得し、整数に変換
  const newsItem = newsItems.find(item => item.id === parseInt(req.params.id));
  
  // 記事が見つからない場合は404エラーを返す
  if (!newsItem) return res.status(404).json({ message: '記事が見つかりません' });
  
  // 記事が見つかった場合はJSONとして返す（内部フィールドを除く）
  const { id, title, content, date } = newsItem;
  res.json({ id, title, content, date });
});

// 新規ニュース投稿APIエンドポイント（仮実装）
app.post('/api/news', (req, res) => {
  const { title, content } = req.body;
  
  // 新しいニュース記事オブジェクトを作成
  const newItem = {
    id: newsItems.length + 1,
    title,
    content,
    date: new Date().toISOString().split('T')[0], // 現在の日付をYYYY-MM-DD形式で設定
    instagram_embed_code: null,
    author_id: 1 // 仮の作成者ID
  };
  
  // 配列に追加
  newsItems.push(newItem);
  
  // 作成された記事を返す（ステータスコード201：Created）
  res.status(201).json(newItem);
});

// ニュース記事を削除するAPIエンドポイント（仮実装）
app.delete('/api/news/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  // 削除前の配列の長さを記録
  const initialLength = newsItems.length;
  
  // 指定されたIDの記事を除外して新しい配列を作成
  newsItems = newsItems.filter(item => item.id !== id);
  
  // 配列の長さが変わらなかった場合、記事が見つからなかったことを意味する
  if (newsItems.length === initialLength) {
    return res.status(404).json({ message: '削除する記事が見つかりません' });
  }
  
  // 正常に削除された場合の応答
  res.json({ message: '記事が正常に削除されました' });
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
app.get('/admin/panel', requireAuth, csrfProtection, (req, res) => {
  // 最新のニュースを取得（最大10件）
  const latestNews = [...newsItems]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);
  
  res.render('admin/panel', { 
    news: latestNews,
    csrfToken: req.csrfToken()
  });
});

// ニュース一覧ページ
app.get('/admin/news', requireAuth, csrfProtection, (req, res) => {
  // ニュースを日付順にソート
  const sortedNews = [...newsItems].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  res.render('admin/news-list', { 
    news: sortedNews,
    csrfToken: req.csrfToken()
  });
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
app.post('/admin/news/create', requireAuth, csrfProtection, (req, res) => {
  try {
    const { title, content, instagram_embed_code } = req.body;
    
    // 新しいニュース記事を作成
    const newItem = {
      id: newsItems.length + 1,
      title,
      content,
      instagram_embed_code: instagram_embed_code || null,
      date: new Date().toISOString().split('T')[0],
      author_id: req.session.userId
    };
    
    // 配列に追加
    newsItems.push(newItem);
    
    res.redirect('/admin/news');
  } catch (error) {
    console.error('News creation error:', error);
    res.status(500).send('ニュース記事の作成中にエラーが発生しました');
  }
});

// ニュース編集フォーム
app.get('/admin/news/edit/:id', requireAuth, csrfProtection, (req, res) => {
  try {
    const newsId = parseInt(req.params.id);
    const news = newsItems.find(item => item.id === newsId);
    
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
app.post('/admin/news/edit/:id', requireAuth, csrfProtection, (req, res) => {
  try {
    const newsId = parseInt(req.params.id);
    const { title, content, instagram_embed_code } = req.body;
    
    // 該当のニュース記事を検索
    const newsIndex = newsItems.findIndex(item => item.id === newsId);
    
    if (newsIndex === -1) {
      return res.status(404).send('ニュース記事が見つかりません');
    }
    
    // ニュース記事を更新
    newsItems[newsIndex] = {
      ...newsItems[newsIndex],
      title,
      content,
      instagram_embed_code: instagram_embed_code || null,
      date: newsItems[newsIndex].date // 日付は変更しない
    };
    
    res.redirect('/admin/news');
  } catch (error) {
    console.error('News update error:', error);
    res.status(500).send('ニュース記事の更新中にエラーが発生しました');
  }
});

// ニュース削除処理
app.post('/admin/news/delete/:id', requireAuth, csrfProtection, (req, res) => {
  try {
    const newsId = parseInt(req.params.id);
    
    // 削除前の配列の長さを記録
    const initialLength = newsItems.length;
    
    // 指定されたIDの記事を除外して新しい配列を作成
    newsItems = newsItems.filter(item => item.id !== newsId);
    
    // 配列の長さが変わらなかった場合、記事が見つからなかったことを意味する
    if (newsItems.length === initialLength) {
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

// MySQL接続テストコードはいったん削除（または以下のようにコメントアウト）
/*
// 必要なパッケージがインストールされたら以下のコメントを解除
const mysql = require('mysql2/promise');

// データベース接続プール
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'valerosso_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// MySQL接続テスト
async function testConnection() {
  try {
    const [result] = await pool.query('SELECT 1 + 1 AS solution');
    console.log('MySQL接続テスト成功:', result[0].solution);
  } catch (err) {
    console.error('MySQL接続テスト失敗:', err);
  }
}

testConnection();
*/

module.exports = app; // テスト用にエクスポート
// routes/admin.js - 管理画面関連のルート定義
const express = require('express');
const bcrypt = require('bcryptjs'); // パスワードハッシュ化ライブラリ
const csrf = require('csurf');     // CSRF保護ライブラリ
const router = express.Router();

// データベースモデルのインポート
const { User, News } = require('../models');

// ミドルウェアのインポート
const { requireAuth, requireNoAuth, requireAdmin } = require('../middleware/auth');

// CSRF保護の設定（管理画面で使用）
const csrfProtection = csrf({ cookie: true });

// 管理者ログインページ
router.get('/login', requireNoAuth, csrfProtection, (req, res) => {
  res.render('admin/login', { 
    error: null,
    csrfToken: req.csrfToken()
  });
});

// ログイン処理
router.post('/login', requireNoAuth, csrfProtection, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 入力値の検証
    if (!username || !password) {
      return res.render('admin/login', { 
        error: 'ユーザー名とパスワードを入力してください',
        csrfToken: req.csrfToken()
      });
    }
    
    // データベースからユーザーを検索
    const user = await User.findOne({ where: { username: username.trim() } });
    
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
    
    console.log(`User ${user.username} logged in successfully`);
    
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

// 管理者パネル（ダッシュボード）
router.get('/panel', requireAuth, csrfProtection, async (req, res) => {
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
    
    // 統計情報の取得
    const totalNews = await News.count();
    const totalUsers = await User.count();
    
    res.render('admin/panel', { 
      news: latestNews,
      stats: {
        totalNews,
        totalUsers
      },
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.error('Admin panel error:', error);
    res.status(500).send('管理者パネルの読み込み中にエラーが発生しました');
  }
});

// ニュース一覧ページ
router.get('/news', requireAuth, csrfProtection, async (req, res) => {
  try {
    // ページネーション用のパラメータ
    const page = parseInt(req.query.page) || 1;
    const limit = 20; // 1ページあたりの記事数
    const offset = (page - 1) * limit;
    
    // データベースからニュースを日付順に取得
    const { count, rows: sortedNews } = await News.findAndCountAll({
      order: [['created_at', 'DESC']],
      limit,
      offset,
      include: [{
        model: User,
        as: 'author',
        attributes: ['username', 'full_name']
      }]
    });
    
    // ページネーション情報の計算
    const totalPages = Math.ceil(count / limit);
    
    res.render('admin/news-list', { 
      news: sortedNews,
      pagination: {
        currentPage: page,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.error('News list error:', error);
    res.status(500).send('ニュース一覧の読み込み中にエラーが発生しました');
  }
});

// 新規ニュース作成フォーム
router.get('/news/create', requireAuth, csrfProtection, (req, res) => {
  res.render('admin/news-form', { 
    news: null,
    formAction: '/admin/news/create',
    formTitle: 'お知らせ記事の新規作成',
    csrfToken: req.csrfToken()
  });
});

// ニュース作成処理
router.post('/news/create', requireAuth, csrfProtection, async (req, res) => {
  try {
    const { title, content, instagram_embed_code } = req.body;
    
    // 入力値の検証
    if (!title || !content) {
      return res.render('admin/news-form', {
        news: null,
        formAction: '/admin/news/create',
        formTitle: 'お知らせ記事の新規作成',
        error: 'タイトルと内容は必須です',
        csrfToken: req.csrfToken()
      });
    }
    
    // データベースに新しいニュース記事を作成
    await News.create({
      title: title.trim(),
      content: content.trim(),
      instagram_embed_code: instagram_embed_code ? instagram_embed_code.trim() : null,
      author_id: req.session.userId
    });
    
    console.log(`News article created by user ${req.session.userId}: ${title}`);
    
    res.redirect('/admin/news');
  } catch (error) {
    console.error('News creation error:', error);
    res.render('admin/news-form', {
      news: null,
      formAction: '/admin/news/create',
      formTitle: 'お知らせ記事の新規作成',
      error: 'ニュース記事の作成中にエラーが発生しました',
      csrfToken: req.csrfToken()
    });
  }
});

// ニュース編集フォーム
router.get('/news/edit/:id', requireAuth, csrfProtection, async (req, res) => {
  try {
    const newsId = parseInt(req.params.id);
    
    // パラメータの検証
    if (isNaN(newsId) || newsId <= 0) {
      return res.status(400).send('無効な記事IDです');
    }
    
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
router.post('/news/edit/:id', requireAuth, csrfProtection, async (req, res) => {
  try {
    const newsId = parseInt(req.params.id);
    const { title, content, instagram_embed_code } = req.body;
    
    // パラメータの検証
    if (isNaN(newsId) || newsId <= 0) {
      return res.status(400).send('無効な記事IDです');
    }
    
    // 入力値の検証
    if (!title || !content) {
      const news = await News.findByPk(newsId);
      return res.render('admin/news-form', {
        news,
        formAction: `/admin/news/edit/${newsId}`,
        formTitle: 'お知らせ記事の編集',
        error: 'タイトルと内容は必須です',
        csrfToken: req.csrfToken()
      });
    }
    
    // データベースの記事を更新
    const [updatedCount] = await News.update({
      title: title.trim(),
      content: content.trim(),
      instagram_embed_code: instagram_embed_code ? instagram_embed_code.trim() : null
    }, {
      where: { id: newsId }
    });
    
    if (updatedCount === 0) {
      return res.status(404).send('ニュース記事が見つかりません');
    }
    
    console.log(`News article updated: ID ${newsId}`);
    
    res.redirect('/admin/news');
  } catch (error) {
    console.error('News update error:', error);
    res.status(500).send('ニュース記事の更新中にエラーが発生しました');
  }
});

// ニュース削除処理
router.post('/news/delete/:id', requireAuth, csrfProtection, async (req, res) => {
  try {
    const newsId = parseInt(req.params.id);
    
    // パラメータの検証
    if (isNaN(newsId) || newsId <= 0) {
      return res.status(400).send('無効な記事IDです');
    }
    
    // データベースから記事を削除
    const deletedCount = await News.destroy({
      where: { id: newsId }
    });
    
    if (deletedCount === 0) {
      return res.status(404).send('削除する記事が見つかりません');
    }
    
    console.log(`News article deleted: ID ${newsId}`);
    
    res.redirect('/admin/news');
  } catch (error) {
    console.error('News deletion error:', error);
    res.status(500).send('ニュース記事の削除中にエラーが発生しました');
  }
});

// ユーザー管理系のルート（管理者のみ）
router.get('/users', requireAuth, requireAdmin, csrfProtection, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'full_name', 'role', 'created_at'],
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

// ログアウト処理
router.get('/logout', (req, res) => {
  const userId = req.session.userId;
  
  // セッションを破棄
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).send('ログアウト処理中にエラーが発生しました');
    }
    
    console.log(`User ${userId} logged out successfully`);
    res.redirect('/admin/login');
  });
});

module.exports = router;
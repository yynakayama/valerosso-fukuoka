// routes/admin.js - 管理画面関連のルート定義
const express = require('express');
const bcrypt = require('bcryptjs'); // パスワードハッシュ化ライブラリ
const csrf = require('csurf');     // CSRF保護ライブラリ
const path = require('path');
const router = express.Router();

// データベースモデルのインポート
const db = require('../models');
const { User, News, Inquiry } = db;

// ミドルウェアのインポート
const { requireAuth, requireNoAuth, requireAdmin } = require('../middleware/auth');

// CSRF保護の設定（管理画面で使用）
const csrfProtection = csrf({ cookie: true });

// PWAスクリプトを自動的に追加するミドルウェア
const addPWAScript = (req, res, next) => {
  // レスポンスの元のrenderメソッドを保存
  const originalRender = res.render;
  
  // renderメソッドをオーバーライド
  res.render = function(view, options = {}) {
    // 既存のlocalsを取得
    const locals = res.locals || {};
    
    // PWAスクリプトを追加
    if (!locals.pwaScriptAdded) {
      locals.pwaScriptAdded = true;
      
      // 既存のスクリプトがあれば保持し、PWAスクリプトを追加
      if (locals.scripts) {
        locals.scripts += '<script src="/admin/pwa-install.js"></script>';
      } else {
        locals.scripts = '<script src="/admin/pwa-install.js"></script>';
      }
    }
    
    // 元のrenderメソッドを呼び出し
    return originalRender.call(this, view, options);
  };
  
  next();
};

// PWA用マニフェストファイル
router.get('/manifest.json', (req, res) => {
  const manifest = {
    name: 'ヴァレロッソ福岡 管理画面',
    short_name: 'VSO管理',
    description: 'ヴァレロッソ福岡の管理画面アプリ',
    start_url: '/admin/panel',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0611e3',
    orientation: 'portrait-primary',
    scope: '/admin/',
    icons: [
      {
        src: '/img/vso.ico',
        sizes: '48x48',
        type: 'image/x-icon'
      },
      {
        src: '/img/favicon.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/img/favicon.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ],
    categories: ['business', 'productivity'],
    lang: 'ja',
    dir: 'ltr'
  };
  
  res.set('Content-Type', 'application/json');
  res.json(manifest);
});

// サービスワーカーファイル
router.get('/sw.js', (req, res) => {
  const swContent = `
// ヴァレロッソ福岡管理画面用サービスワーカー
const CACHE_NAME = 'vso-admin-v1';
const urlsToCache = [
  '/admin/panel',
  '/admin/news',
  '/admin/users',
  '/admin/inquiries',
  '/admin/login',
  '/css/style.css',
  '/css/header.css',
  '/css/footer.css',
  '/js/common-utils.js',
  '/img/vso.ico',
  '/img/healsy.png'
];

// インストール時の処理
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// フェッチ時の処理
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // キャッシュに存在する場合はキャッシュから返す
        if (response) {
          return response;
        }
        
        // キャッシュにない場合はネットワークから取得
        return fetch(event.request).then(
          (response) => {
            // 有効なレスポンスでない場合はそのまま返す
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // レスポンスをクローンしてキャッシュに保存
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          }
        );
      })
  );
});

// アクティベート時の処理
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
  `;
  
  res.set('Content-Type', 'application/javascript');
  res.send(swContent);
});

// PWA用のインストールスクリプト
router.get('/pwa-install.js', (req, res) => {
  const installScript = `
// PWA用メタタグとサービスワーカーの動的追加
(function() {
  'use strict';
  
  // メタタグの追加
  function addMetaTags() {
    const metaTags = [
      { name: 'theme-color', content: '#0611e3' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      { name: 'apple-mobile-web-app-title', content: 'VSO管理' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'description', content: 'ヴァレロッソ福岡の管理画面アプリ' }
    ];
    
    metaTags.forEach(tag => {
      if (!document.querySelector(\`meta[name="\${tag.name}"]\`)) {
        const meta = document.createElement('meta');
        meta.name = tag.name;
        meta.content = tag.content;
        document.head.appendChild(meta);
      }
    });
    
    // マニフェストリンクの追加
    if (!document.querySelector('link[rel="manifest"]')) {
      const manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = '/admin/manifest.json';
      document.head.appendChild(manifestLink);
    }
    
    // Apple Touch Iconの追加
    if (!document.querySelector('link[rel="apple-touch-icon"]')) {
      const appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      appleIcon.href = '/img/healsy.png';
      document.head.appendChild(appleIcon);
    }
  }
  
  // サービスワーカーの登録
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/admin/sw.js')
          .then(function(registration) {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
          })
          .catch(function(err) {
            console.log('ServiceWorker registration failed: ', err);
          });
      });
    }
  }
  
  // PWAインストールプロンプトの処理
  function handleInstallPrompt() {
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // インストールボタンの表示（必要に応じて）
      const installButton = document.createElement('button');
      installButton.textContent = 'アプリをインストール';
      installButton.style.cssText = \`
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        background: #0611e3;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
      \`;
      
      installButton.addEventListener('click', () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
              console.log('User accepted the install prompt');
            } else {
              console.log('User dismissed the install prompt');
            }
            deferredPrompt = null;
            installButton.remove();
          });
        }
      });
      
      document.body.appendChild(installButton);
    });
  }
  
  // 初期化
  addMetaTags();
  registerServiceWorker();
  handleInstallPrompt();
})();
  `;
  
  res.set('Content-Type', 'application/javascript');
  res.send(installScript);
});

// 管理者ログインページ
router.get('/login', requireNoAuth, csrfProtection, addPWAScript, (req, res) => {
  res.render('admin/login', { 
    error: null,
    csrfToken: req.csrfToken()
  });
});

// ログイン処理
router.post('/login', requireNoAuth, csrfProtection, addPWAScript, async (req, res) => {
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
router.get('/panel', requireAuth, csrfProtection, addPWAScript, async (req, res) => {
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
router.get('/news', requireAuth, csrfProtection, addPWAScript, async (req, res) => {
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
router.get('/news/create', requireAuth, csrfProtection, addPWAScript, (req, res) => {
  res.render('admin/news-form', { 
    news: null,
    formAction: '/admin/news/create',
    formTitle: 'お知らせ記事の新規作成',
    csrfToken: req.csrfToken()
  });
});

// ニュース作成処理
router.post('/news/create', requireAuth, csrfProtection, addPWAScript, async (req, res) => {
  try {
    const { title, content, instagram_embed_code } = req.body;
    
    // 入力値の検証
    if (!title) {
      return res.render('admin/news-form', {
        news: null,
        formAction: '/admin/news/create',
        formTitle: 'お知らせ記事の新規作成',
        error: 'タイトルは必須です',
        csrfToken: req.csrfToken()
      });
    }
    
    // データベースに新しいニュース記事を作成
    await News.create({
      title: title.trim(),
      content: content ? content.trim() : '',
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
router.get('/news/edit/:id', requireAuth, csrfProtection, addPWAScript, async (req, res) => {
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
router.post('/news/edit/:id', requireAuth, csrfProtection, addPWAScript, async (req, res) => {
  try {
    const newsId = parseInt(req.params.id);
    const { title, content, instagram_embed_code } = req.body;
    
    // パラメータの検証
    if (isNaN(newsId) || newsId <= 0) {
      return res.status(400).send('無効な記事IDです');
    }
    
    // 入力値の検証
    if (!title) {
      const news = await News.findByPk(newsId);
      return res.render('admin/news-form', {
        news,
        formAction: `/admin/news/edit/${newsId}`,
        formTitle: 'お知らせ記事の編集',
        error: 'タイトルは必須です',
        csrfToken: req.csrfToken()
      });
    }
    
    // データベースの記事を更新
    const [updatedCount] = await News.update({
      title: title.trim(),
      content: content ? content.trim() : '',
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
router.post('/news/delete/:id', requireAuth, csrfProtection, addPWAScript, async (req, res) => {
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
router.get('/users', requireAuth, requireAdmin, csrfProtection, addPWAScript, async (req, res) => {
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

// ユーザー新規作成フォーム
router.get('/users/create', requireAuth, requireAdmin, csrfProtection, addPWAScript, (req, res) => {
  res.render('admin/user-form', {
    user: null,
    formAction: '/admin/users/create',
    formTitle: '新規ユーザー作成',
    csrfToken: req.csrfToken()
  });
});

// ユーザー新規作成処理
router.post('/users/create', requireAuth, requireAdmin, csrfProtection, addPWAScript, async (req, res) => {
  try {
    const { username, full_name, password, role } = req.body;
    if (!username || !password || !role) {
      return res.render('admin/user-form', {
        user: null,
        formAction: '/admin/users/create',
        formTitle: '新規ユーザー作成',
        error: '全ての必須項目を入力してください',
        csrfToken: req.csrfToken()
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      username: username.trim(),
      full_name: full_name ? full_name.trim() : null,
      password: hashedPassword,
      role
    });
    res.redirect('/admin/users');
  } catch (error) {
    res.render('admin/user-form', {
      user: null,
      formAction: '/admin/users/create',
      formTitle: '新規ユーザー作成',
      error: 'ユーザー作成中にエラーが発生しました',
      csrfToken: req.csrfToken()
    });
  }
});

// ユーザー編集フォーム
router.get('/users/edit/:id', requireAuth, requireAdmin, csrfProtection, addPWAScript, async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).send('ユーザーが見つかりません');
  res.render('admin/user-form', {
    user,
    formAction: `/admin/users/edit/${user.id}`,
    formTitle: 'ユーザー編集',
    csrfToken: req.csrfToken()
  });
});

// ユーザー編集処理
router.post('/users/edit/:id', requireAuth, requireAdmin, csrfProtection, addPWAScript, async (req, res) => {
  try {
    const { username, full_name, password, role } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).send('ユーザーが見つかりません');
    user.username = username.trim();
    user.full_name = full_name ? full_name.trim() : null;
    user.role = role;
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }
    await user.save();
    res.redirect('/admin/users');
  } catch (error) {
    const user = await User.findByPk(req.params.id);
    res.render('admin/user-form', {
      user,
      formAction: `/admin/users/edit/${req.params.id}`,
      formTitle: 'ユーザー編集',
      error: 'ユーザー編集中にエラーが発生しました',
      csrfToken: req.csrfToken()
    });
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

// お問い合わせ管理ページ
router.get('/inquiries', requireAuth, requireAdmin, csrfProtection, addPWAScript, async (req, res) => {
  try {
    res.render('admin/inquiries', {
      title: 'お問い合わせ管理',
      currentUser: req.user,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.error('Inquiries page error:', error);
    res.status(500).send('お問い合わせ管理ページの読み込み中にエラーが発生しました');
  }
});

// お問い合わせデータ取得API
router.get('/api/inquiries', requireAuth, requireAdmin, async (req, res) => {
  try {
    const inquiries = await db.Inquiry.findAll({
      order: [['created_at', 'DESC']],
      raw: true // 生のデータを取得
    });
    
    // 日付をISO文字列に変換
    const formattedInquiries = inquiries.map(inquiry => ({
      id: inquiry.id,
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone,
      inquiry_type: inquiry.inquiry_type,
      message: inquiry.message,
      player_info: inquiry.player_info,
      media_info: inquiry.media_info,
      status: inquiry.status,
      created_at: inquiry.created_at ? inquiry.created_at.toISOString() : null,
      updated_at: inquiry.updated_at ? inquiry.updated_at.toISOString() : null
    }));
    
    res.json(formattedInquiries);
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).json({ error: 'お問い合わせ一覧の取得に失敗しました。' });
  }
});

// お問い合わせステータス更新API
router.patch('/api/inquiries/:id/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const inquiry = await Inquiry.findByPk(id);
    if (!inquiry) {
      return res.status(404).json({ error: 'お問い合わせが見つかりません' });
    }

    await inquiry.update({ status });
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating inquiry status:', error);
    res.status(500).json({ error: 'ステータスの更新に失敗しました' });
  }
});

// お問い合わせ削除API
router.delete('/api/inquiries/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const inquiry = await Inquiry.findByPk(id);
    
    if (!inquiry) {
      console.error(`Inquiry not found: ID ${id}`);
      return res.status(404).json({ error: 'お問い合わせが見つかりません' });
    }

    await inquiry.destroy();
    console.log(`Inquiry deleted successfully: ID ${id}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting inquiry:', error);
    res.status(500).json({ error: 'お問い合わせの削除に失敗しました' });
  }
});

// routes/admin.js の最後に以下のルートを追加

// ユーザー削除処理
router.post('/users/delete/:id', requireAuth, requireAdmin, csrfProtection, addPWAScript, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // パラメータの検証
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).send('無効なユーザーIDです');
    }
    
    // 削除対象のユーザーを取得
    const userToDelete = await User.findByPk(userId);
    
    if (!userToDelete) {
      return res.status(404).send('削除するユーザーが見つかりません');
    }
    
    // ユーザーを削除
    await userToDelete.destroy();
    
    console.log(`User deleted: ID ${userId}, Username: ${userToDelete.username}`);
    
    // ユーザー一覧にリダイレクト
    res.redirect('/admin/users');
  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).send('ユーザーの削除中にエラーが発生しました');
  }
});

module.exports = router;
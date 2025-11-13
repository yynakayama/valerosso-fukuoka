// routes/public.js - 公開ページ関連のルート定義
const express = require('express');
const path = require('path');
const fs = require('fs'); // ファイルシステム操作
const router = express.Router();

/**
 * 静的HTMLファイルの存在確認と提供
 * publicディレクトリ内のHTMLファイルを動的に配信
 */
const serveStaticPage = (req, res, next) => {
  // URLパスからファイル名を抽出（例: /team → team.html）
  const requestPath = req.path === '/' ? 'index' : req.path.substring(1);
  const htmlPath = path.join(__dirname, '../public', `${requestPath}.html`);
  
  // ファイルの存在確認
  fs.access(htmlPath, fs.constants.F_OK, (err) => {
    if (err) {
      // ファイルが存在しない場合は次のミドルウェアに進む
      return next();
    }
    
    // ファイルが存在する場合は配信
    res.set('Cache-Control', 'public, max-age=1800'); // 30分キャッシュ
    res.sendFile(htmlPath, (sendErr) => {
      if (sendErr) {
        console.error(`Error serving ${htmlPath}:`, sendErr);
        next(sendErr);
      }
    });
  });
};

/**
 * ホームページ
 * ルート（/）へのアクセスをindex.htmlに転送
 */
router.get('/', serveStaticPage);

/**
 * クラブ紹介ページ
 * /team へのアクセスをteam.htmlに転送
 */
router.get('/team', serveStaticPage);

/**
 * 練習・試合予定ページ
 * /schedule へのアクセスをschedule.htmlに転送
 */
router.get('/schedule', serveStaticPage);

/**
 * お知らせページ
 * /news へのアクセスをnews.htmlに転送
 */
router.get('/news', serveStaticPage);

/**
 * フォトギャラリーページ
 * /gallery へのアクセスをgallery.htmlに転送
 */
router.get('/gallery', serveStaticPage);

/**
 * 入部案内ページ
 * /join へのアクセスをjoin.htmlに転送
 */
router.get('/join', serveStaticPage);

/**
 * お問い合わせページ
 * /contact へのアクセスをcontact.htmlに転送
 */
router.get('/contact', serveStaticPage);

/**
 * サイトマップの生成
 * SEO対策としてサイトの構造を提供
 */
router.get('/sitemap.xml', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const pages = [
    { url: '/', priority: '1.0', changefreq: 'weekly' },
    { url: '/team', priority: '0.8', changefreq: 'yearly' },
    { url: '/news', priority: '0.9', changefreq: 'weekly' },
    { url: '/gallery', priority: '0.6', changefreq: 'yearly' },
    { url: '/join', priority: '0.5', changefreq: 'yearly' },
    { url: '/contact', priority: '0.4', changefreq: 'never' }
  ];
  
  // XML形式のサイトマップ生成
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  pages.forEach(page => {
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    xml += '  </url>\n';
  });
  
  xml += '</urlset>';
  
  res.set('Content-Type', 'application/xml');
  res.send(xml);
});

/**
 * robots.txtの生成
 * 検索エンジンクローラーへの指示
 */
router.get('/robots.txt', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  let robotsTxt = 'User-agent: *\n';
  robotsTxt += 'Allow: /\n';
  robotsTxt += 'Disallow: /admin/\n';          // 管理画面はクロール禁止
  robotsTxt += 'Disallow: /api/\n';            // API エンドポイントはクロール禁止
  robotsTxt += '\n';
  robotsTxt += `Sitemap: ${baseUrl}/sitemap.xml\n`;
  
  res.set('Content-Type', 'text/plain');
  res.send(robotsTxt);
});

/**
 * マニフェストファイル（PWA対応）
 * Progressive Web App として動作するための設定
 */
router.get('/manifest.json', (req, res) => {
  const manifest = {
    name: 'ヴァレロッソ福岡',
    short_name: 'VSO福岡',
    description: '筑後地区を拠点に活動する中学生向けサッカークラブ',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0611e3',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/img/vso.ico',
        sizes: '48x48',
        type: 'image/x-icon'
      }
      // 他のサイズのアイコンがあれば追加
    ]
  };
  
  res.json(manifest);
});

/**
 * ヘルスチェックエンドポイント
 * サーバーの稼働状況確認用
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * 404エラーハンドラー
 * 存在しないページへのアクセスをキャッチ
 */
router.use('*', (req, res) => {
  console.log(`404 Error: ${req.method} ${req.originalUrl} from IP: ${req.ip}`);
  
  // HTMLリクエストの場合はホームページにリダイレクト
  if (req.accepts('html')) {
    return res.status(404).sendFile(path.join(__dirname, '../public', 'index.html'));
  }
  
  // APIリクエストの場合はJSONエラーを返す
  if (req.accepts('json')) {
    return res.status(404).json({
      error: 'ページが見つかりません',
      code: 'NOT_FOUND',
      path: req.originalUrl
    });
  }
  
  // その他の場合はテキストエラー
  res.status(404).type('txt').send('ページが見つかりません');
});

module.exports = router;
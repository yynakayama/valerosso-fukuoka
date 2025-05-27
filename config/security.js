// config/security.js - セキュリティ関連の設定とミドルウェア
const helmet = require('helmet');        // セキュリティヘッダーを設定するライブラリ
const rateLimit = require('express-rate-limit'); // レート制限ライブラリ
const { setUserInfo } = require('../middleware/auth');

/**
 * セキュリティヘッダーの設定
 * XSS、クリックジャッキング、MIME sniffing等の攻撃を防御
 */
const securityHeaders = helmet({
  // Content Security Policy（CSP）の設定
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],                    // デフォルトでは同じオリジンのみ許可
      styleSrc: [                                // CSSソースの許可リスト
        "'self'", 
        "'unsafe-inline'",                       // インラインスタイルを許可
        "https://fonts.googleapis.com"           // Google Fontsを許可
      ],
      fontSrc: [                                 // フォントソースの許可リスト
        "'self'",
        "https://fonts.gstatic.com"              // Google Fontsを許可
      ],
      scriptSrc: [                               // JavaScriptソースの許可リスト
        "'self'",
        "'unsafe-inline'",                       // インラインスクリプトを許可（開発用）
        "https://www.instagram.com",             // Instagram埋め込み用
        "https://platform.instagram.com"         // Instagram埋め込み用
      ],
      frameSrc: [                                // iframe許可リスト
        "'self'",
        "https://www.instagram.com"              // Instagram埋め込み用
      ],
      imgSrc: [                                  // 画像ソースの許可リスト
        "'self'",
        "data:",                                 // データURIスキームを許可
        "https:",                                // HTTPS画像を許可
        "https://scontent.cdninstagram.com",     // Instagram画像
        "https://scontent-*.cdninstagram.com"    // Instagram CDN
      ],
      connectSrc: [                              // Ajax等の接続許可リスト
        "'self'",
        "https://www.instagram.com",
        "https://graph.instagram.com"            // Instagram Graph API
      ],
      objectSrc: ["'none'"],                     // Flash等のオブジェクトを禁止
      upgradeInsecureRequests: []                // HTTPをHTTPSに自動アップグレード
    }
  },
  // その他のセキュリティヘッダー
  crossOriginEmbedderPolicy: false,              // Instagram埋め込みのため無効化
  hsts: {                                        // HTTP Strict Transport Security
    maxAge: 31536000,                            // 1年間
    includeSubDomains: true,                     // サブドメインも含める
    preload: true                                // HSTSプリロードリストに登録可能
  }
});

/**
 * レート制限の設定
 * ブルートフォース攻撃やDDoS攻撃を防御
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,                      // 15分間のウィンドウ
  max: 100,                                      // 最大100リクエスト
  message: {
    error: 'リクエストが多すぎます。しばらく時間をおいてから再試行してください。',
    retryAfter: '15分後'
  },
  standardHeaders: true,                         // `RateLimit-*` ヘッダーを返す
  legacyHeaders: false,                          // `X-RateLimit-*` ヘッダーを無効
  // カスタムキー生成（IPアドレスベース）
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
});

/**
 * ログイン試行の制限
 * ブルートフォース攻撃からログイン機能を保護
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,                      // 15分間のウィンドウ
  max: 5,                                        // 最大5回のログイン試行
  message: {
    error: 'ログイン試行回数が上限に達しました。15分後に再試行してください。',
    retryAfter: '15分後'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // ログイン試行回数超過時のログ
  handler: (req, res) => {
    console.warn(`Login rate limit exceeded from IP: ${req.ip}, URL: ${req.originalUrl}`);
    res.status(429).json({
      error: 'ログイン試行回数が上限に達しました。15分後に再試行してください。',
      retryAfter: '15分後'
    });
  }
});

/**
 * API用のレート制限
 * API エンドポイントへの過度なアクセスを制限
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,                      // 15分間のウィンドウ
  max: 200,                                      // 最大200リクエスト（一般より多め）
  message: {
    error: 'API リクエストが多すぎます。しばらく時間をおいてから再試行してください。',
    retryAfter: '15分後'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * 管理画面用のレート制限
 * 管理機能への過度なアクセスを制限
 */
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,                      // 15分間のウィンドウ
  max: 50,                                       // 最大50リクエスト（より厳しく）
  message: {
    error: '管理画面へのアクセスが多すぎます。しばらく時間をおいてから再試行してください。',
    retryAfter: '15分後'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // 管理画面アクセス時のログ
  handler: (req, res) => {
    console.warn(`Admin rate limit exceeded from IP: ${req.ip}, URL: ${req.originalUrl}`);
    res.status(429).json({
      error: '管理画面へのアクセスが多すぎます。しばらく時間をおいてから再試行してください。',
      retryAfter: '15分後'
    });
  }
});

/**
 * リクエストログのミドルウェア
 * アクセスログとセキュリティ監視
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // レスポンス終了時の処理
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.session?.userId || 'anonymous'
    };
    
    // 重要なアクセスはログに記録
    if (req.originalUrl.startsWith('/admin') || req.originalUrl.startsWith('/api')) {
      console.log('Request:', JSON.stringify(logData));
    }
    
    // エラーレスポンスは警告として記録
    if (res.statusCode >= 400) {
      console.warn('Error Response:', JSON.stringify(logData));
    }
  });
  
  next();
};

module.exports = {
  securityHeaders,    // セキュリティヘッダー設定
  generalLimiter,     // 一般的なレート制限
  loginLimiter,       // ログイン用レート制限
  apiLimiter,         // API用レート制限
  adminLimiter,       // 管理画面用レート制限
  requestLogger,      // リクエストログ
  userInfo: setUserInfo // ユーザー情報設定（auth.jsから再エクスポート）
};
// config/security.js - セキュリティ関連の設定とミドルウェア
const { setUserInfo } = require('../middleware/auth');

/**
 * 基本的なセキュリティヘッダーの設定
 * 現時点では手動でヘッダーを設定（helmetは後で追加可能）
 */
const securityHeaders = (req, res, next) => {
  // XSS保護
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // HTTPS強制（本番環境のみ）
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Content Security Policy（修正版）
  const csp = [
    "default-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "script-src 'self' 'unsafe-inline' https://www.instagram.com https://platform.instagram.com",
    "frame-src 'self' https://www.instagram.com",
    // 修正：ワイルドカードの位置を正しく設定
    "img-src 'self' data: https: https://scontent.cdninstagram.com https://*.cdninstagram.com",
    "connect-src 'self' https://www.instagram.com https://graph.instagram.com"
  ].join('; ');
  
  res.setHeader('Content-Security-Policy', csp);
  
  next();
};

/**
 * 基本的なレート制限の設定
 * 現時点では簡単な実装（express-rate-limitは後で追加可能）
 */
const createLimiter = (windowMs, max, message) => {
  // 簡易版のレート制限（メモリベース）
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    // 期限切れのエントリを削除
    for (const [ip, data] of requests.entries()) {
      if (now - data.firstRequest > windowMs) {
        requests.delete(ip);
      }
    }
    
    // 現在のリクエストを記録
    if (!requests.has(key)) {
      requests.set(key, { count: 1, firstRequest: now });
    } else {
      const data = requests.get(key);
      data.count++;
      
      if (data.count > max) {
        console.warn(`Rate limit exceeded for IP: ${key}`);
        return res.status(429).json({ 
          error: message,
          retryAfter: Math.ceil((windowMs - (now - data.firstRequest)) / 1000)
        });
      }
    }
    
    next();
  };
};

// 各種リミッターの作成
const generalLimiter = createLimiter(
  15 * 60 * 1000, // 15分
  100, // 最大100リクエスト
  'リクエストが多すぎます。しばらく時間をおいてから再試行してください。'
);

const loginLimiter = createLimiter(
  15 * 60 * 1000, // 15分
  5, // 最大5回
  'ログイン試行回数が上限に達しました。15分後に再試行してください。'
);

const apiLimiter = createLimiter(
  15 * 60 * 1000, // 15分
  200, // 最大200リクエスト
  'API リクエストが多すぎます。しばらく時間をおいてから再試行してください。'
);

const adminLimiter = createLimiter(
  15 * 60 * 1000, // 15分
  50, // 最大50リクエスト
  '管理画面へのアクセスが多すぎます。しばらく時間をおいてから再試行してください。'
);

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
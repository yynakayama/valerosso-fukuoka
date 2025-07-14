// config/session.js - Railway環境変数統一版
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

// 環境に応じたMySQL接続設定（Railway変数に統一）
const getSessionStoreOptions = () => {
  if (process.env.NODE_ENV === 'production') {
    // Railway本番環境：Railway自動生成変数を使用
    const dbConfig = {
      host: process.env.MYSQLHOST,
      port: parseInt(process.env.MYSQLPORT) || 3306,
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQL_DATABASE
    };

    console.log('📊 Railway本番環境 セッションストア接続設定:', {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user ? 'SET' : 'NOT_SET'
    });

    return {
      ...dbConfig,
      // Railway MySQL用SSL設定
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      // セッションテーブルの設定
      schema: {
        tableName: 'sessions',
        columnNames: {
          session_id: 'session_id',
          expires: 'expires',
          data: 'data'
        }
      },
      // 接続プールの設定（Railway用に最適化）
      pool: {
        acquireTimeout: 60000,
        timeout: 60000,
        reconnect: true,
        connectionLimit: 5
      },
      // 期限切れセッションの自動削除設定
      clearExpired: true,
      checkExpirationInterval: 900000,   // 15分
      expiration: 86400000,              // 24時間
      createDatabaseTable: true,
      endConnectionOnClose: true
    };
  } else {
    // 開発環境：従来の DB_* 変数を使用
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3307,
      user: process.env.DB_USER || 'valerosso_user',
      password: process.env.DB_PASSWORD || 'valerosso_password',
      database: process.env.DB_NAME || 'valerosso'
    };

    console.log('📊 開発環境 セッションストア接続設定:', {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user ? 'SET' : 'NOT_SET'
    });

    return {
      ...dbConfig,
      schema: {
        tableName: 'sessions',
        columnNames: {
          session_id: 'session_id',
          expires: 'expires',
          data: 'data'
        }
      },
      pool: {
        acquireTimeout: 60000,
        timeout: 60000,
        reconnect: true
      },
      clearExpired: true,
      checkExpirationInterval: 900000,
      expiration: 86400000,
      createDatabaseTable: true,
      endConnectionOnClose: true
    };
  }
};

// セッションストアの作成
let sessionStore;
try {
  const sessionStoreOptions = getSessionStoreOptions();
  sessionStore = new MySQLStore(sessionStoreOptions);
} catch (error) {
  console.error('❌ セッションストア初期化エラー:', error);
  process.exit(1);
}

// Railway環境用のCookie設定
const cookieSettings = {
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  maxAge: 24 * 60 * 60 * 1000,
  sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
  domain: undefined
};

// セッション設定
const sessionConfig = session({
  key: 'valerosso.session',
  secret: process.env.SESSION_SECRET || 'valerosso-fukuoka-secret-key-2025',
  store: sessionStore,
  resave: true,
  saveUninitialized: false,
  rolling: true,
  cookie: cookieSettings,
  name: 'vso.sid',
  proxy: process.env.NODE_ENV === 'production'
});

// セッションストアのイベントハンドリング
sessionStore.onReady(() => {
  console.log('✅ セッションストア（MySQL）が正常に初期化されました');
  console.log('🗄️ セッションテーブルの準備が完了しました');
});

sessionStore.on('error', (error) => {
  console.error('❌ セッションストアエラー:', error.message);
  if (process.env.NODE_ENV === 'development') {
    console.error('詳細:', error);
  }
});

// 開発環境でのデバッグ情報  
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 開発モードでセッション設定を初期化しました');
  console.log('🍪 Cookie secure:', cookieSettings.secure);
  console.log('🍪 Cookie sameSite:', cookieSettings.sameSite);
}

console.log('🎯 セッション設定の初期化が完了しました');

module.exports = sessionConfig;
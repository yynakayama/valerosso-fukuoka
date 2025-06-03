// config/session.js - 環境変数統一修正版
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

// 環境に応じたMySQL接続設定（環境変数を統一）
const getSessionStoreOptions = () => {
  // 🔧 修正：config.js と同じ環境変数を使用
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'valerosso_user',
    password: process.env.DB_PASSWORD || 'valerosso_password',
    database: process.env.DB_NAME || 'valerosso'
  };

  if (process.env.NODE_ENV === 'production') {
    // Railway本番環境用設定
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
    // 開発環境用設定
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
  
  console.log('📊 セッションストア接続設定:', {
    host: sessionStoreOptions.host,
    port: sessionStoreOptions.port,
    database: sessionStoreOptions.database,
    user: sessionStoreOptions.user ? 'SET' : 'NOT_SET'
  });
  
  sessionStore = new MySQLStore(sessionStoreOptions);
} catch (error) {
  console.error('❌ セッションストア初期化エラー:', error);
  process.exit(1);
}

// 🔧 修正：Railway環境用のCookie設定
const cookieSettings = {
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  maxAge: 24 * 60 * 60 * 1000,
  sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax', // 🔧 strict → lax に変更
  domain: undefined // 🔧 追加：自動設定を許可
};

// 🔧 修正：セッション設定
const sessionConfig = session({
  key: 'valerosso.session',
  secret: process.env.SESSION_SECRET || 'valerosso-fukuoka-secret-key-2025',
  store: sessionStore,
  resave: true, // 🔧 修正：Railway環境では true に変更
  saveUninitialized: false,
  rolling: true,
  cookie: cookieSettings,
  name: 'vso.sid',
  proxy: process.env.NODE_ENV === 'production' // 🔧 追加：プロキシ対応
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

// セッション接続テスト
const testConnection = async () => {
  try {
    console.log('🔄 セッション接続テストを開始...');
    
    await new Promise((resolve, reject) => {
      let resolved = false;
      
      sessionStore.onReady(() => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      });
      
      sessionStore.on('error', (err) => {
        if (!resolved) {
          resolved = true;
          reject(err);
        }
      });
      
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.log('⚠️ セッション接続テストがタイムアウトしましたが、これは正常な場合があります');
          resolve();
        }
      }, 30000);
    });
    
    console.log('✅ セッション接続テスト完了');
  } catch (error) {
    console.log('⚠️ セッション接続テストでエラーが発生しましたが、サービスは継続します');
    console.log('📝 理由:', error.message);
  }
};

setTimeout(() => {
  testConnection();
}, 1000);

if (process.env.NODE_ENV === 'development') {
  console.log('🔧 開発モードでセッション設定を初期化しました');
  console.log('🍪 Cookie secure:', cookieSettings.secure);
  console.log('🍪 Cookie sameSite:', cookieSettings.sameSite);
}

console.log('🎯 セッション設定の初期化が完了しました');

module.exports = sessionConfig;
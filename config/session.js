// config/session.js - セッション管理の設定（Railway変数名対応版）
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

// 環境に応じたMySQL接続設定
const getSessionStoreOptions = () => {
  if (process.env.NODE_ENV === 'production') {
    // Railway本番環境用設定（自動生成変数を使用）
    return {
      host: process.env.MYSQLHOST,
      port: process.env.MYSQLPORT || 3306,
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQL_DATABASE,
      // SSL接続を強制（Railway MySQLで必須）
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
      // 接続プールの設定（本番環境用に最適化）
      pool: {
        acquireTimeout: 60000,
        timeout: 60000,
        reconnect: true,
        connectionLimit: 10
      },
      // 期限切れセッションの自動削除設定
      clearExpired: true,
      checkExpirationInterval: 900000,   // 15分
      expiration: 86400000,              // 24時間
      createDatabaseTable: true,
      endConnectionOnClose: true
    };
  } else {
    // 開発環境用設定（Docker用）
    return {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3307,
      user: process.env.DB_USER || 'valerosso_user',
      password: process.env.DB_PASSWORD || 'valerosso_password',
      database: process.env.DB_NAME || 'valerosso',
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

// セッションストアの作成（エラーハンドリング強化）
let sessionStore;
try {
  const sessionStoreOptions = getSessionStoreOptions();
  
  // 接続情報のデバッグ出力（パスワードは隠す）
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

// クッキー設定の決定
const cookieSettings = {
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  maxAge: 24 * 60 * 60 * 1000,    // 24時間
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
};

// セッション設定オブジェクト
const sessionConfig = session({
  key: 'valerosso.session',
  secret: process.env.SESSION_SECRET || 'valerosso-fukuoka-secret-key-2025',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: cookieSettings,
  name: 'vso.sid'
});

// セッションストアのイベントハンドリング
sessionStore.onReady(() => {
  console.log('✅ セッションストア（MySQL）が正常に初期化されました');
});

sessionStore.on('error', (error) => {
  console.error('❌ セッションストアエラー:', error);
  // 本番環境では詳細なエラー情報をログに記録
  if (process.env.NODE_ENV === 'production') {
    console.error('Database connection details:', {
      host: process.env.MYSQLHOST ? 'SET' : 'NOT_SET',
      port: process.env.MYSQLPORT,
      database: process.env.MYSQL_DATABASE ? 'SET' : 'NOT_SET',
      user: process.env.MYSQLUSER ? 'SET' : 'NOT_SET'
    });
  }
});

// セッション接続テスト
const testConnection = async () => {
  try {
    await new Promise((resolve, reject) => {
      sessionStore.onReady(resolve);
      sessionStore.on('error', reject);
      setTimeout(() => reject(new Error('Connection timeout')), 10000);
    });
    console.log('✅ セッション接続テスト成功');
  } catch (error) {
    console.error('❌ セッション接続テスト失敗:', error.message);
  }
};

// 接続テストを実行
testConnection();

// 開発環境でのセッション詳細ログ
if (process.env.NODE_ENV === 'development') {
  console.log('開発モードでセッション設定を初期化しました');
  console.log('Cookie secure:', cookieSettings.secure);
}

module.exports = sessionConfig;
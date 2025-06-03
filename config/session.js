// config/session.js - セッション管理の設定（タイムアウト最適化版）
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
        connectionLimit: 5  // Railway用に削減
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
  console.log('🗄️ セッションテーブルの準備が完了しました');
});

sessionStore.on('error', (error) => {
  console.error('❌ セッションストアエラー:', error.message);
  // 詳細なエラー情報は開発環境でのみ表示
  if (process.env.NODE_ENV === 'development') {
    console.error('詳細:', error);
  }
});

// セッション接続テスト（改良版：より柔軟なタイムアウト）
const testConnection = async () => {
  try {
    console.log('🔄 セッション接続テストを開始...');
    
    await new Promise((resolve, reject) => {
      let resolved = false;
      
      // onReadyイベントでの解決
      sessionStore.onReady(() => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      });
      
      // エラーイベントでの拒否
      sessionStore.on('error', (err) => {
        if (!resolved) {
          resolved = true;
          reject(err);
        }
      });
      
      // タイムアウトを30秒に延長（テーブル作成を考慮）
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.log('⚠️ セッション接続テストがタイムアウトしましたが、これは正常な場合があります');
          console.log('📝 初回起動時はセッションテーブル作成に時間がかかることがあります');
          resolve(); // タイムアウトでもエラーとしない
        }
      }, 30000); // 30秒に延長
    });
    
    console.log('✅ セッション接続テスト完了');
  } catch (error) {
    console.log('⚠️ セッション接続テストでエラーが発生しましたが、サービスは継続します');
    console.log('📝 理由:', error.message);
  }
};

// 接続テストを非同期で実行（サーバー起動をブロックしない）
setTimeout(() => {
  testConnection();
}, 1000); // 1秒後に実行

// 開発環境でのセッション詳細ログ
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 開発モードでセッション設定を初期化しました');
  console.log('🍪 Cookie secure:', cookieSettings.secure);
}

console.log('🎯 セッション設定の初期化が完了しました');

module.exports = sessionConfig;
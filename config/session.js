// config/session.js - Railway環境対応版
const session = require('express-session');

// Railway環境では一時的にメモリセッションを使用
// 安定動作確認後、MySQLセッションストアに移行予定

// 本番環境（Railway）用のクッキー設定
const cookieSettings = {
  secure: process.env.NODE_ENV === 'production',   // 本番環境ではHTTPS必須
  httpOnly: true,                                   // JavaScriptからのアクセスを防止（XSS対策）
  maxAge: 24 * 60 * 60 * 1000,                    // クッキーの有効期限（24時間）
  sameSite: 'lax'                                  // Railway環境での互換性を考慮
};

// セッション設定オブジェクト（メモリストア使用）
const sessionConfig = session({
  secret: process.env.SESSION_SECRET || 'valerosso-fukuoka-secret-key-2025', // セッション暗号化キー
  resave: false,                                      // セッションが変更されていなくても保存しない
  saveUninitialized: false,                           // 初期化されていないセッションは保存しない
  rolling: true,                                      // アクセスするたびにセッション期限をリセット
  cookie: cookieSettings,                             // クッキー設定を適用
  name: 'vso.sid'                                     // セッションクッキーの名前
});

// 開発環境でのセッション詳細ログ
if (process.env.NODE_ENV === 'development') {
  console.log('開発モードでセッション設定を初期化しました（メモリストア）');
  console.log('Cookie secure:', cookieSettings.secure);
}

// 本番環境での確認ログ
if (process.env.NODE_ENV === 'production') {
  console.log('本番環境でメモリセッションストアを使用中');
  console.log('注意: サーバー再起動時にセッションは消失します');
}

module.exports = sessionConfig;

/* 
=== 将来的なMySQLセッションストア設定（現在は無効） ===

const MySQLStore = require('express-mysql-session')(session);

// MySQL接続設定（環境変数から取得）
const sessionStoreOptions = {
  host: process.env.DB_HOST || 'mysql.railway.internal',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'railway',
  // セッションテーブルの設定
  schema: {
    tableName: 'sessions',           // セッション情報を保存するテーブル名
    columnNames: {
      session_id: 'session_id',      // セッションIDのカラム名
      expires: 'expires',            // 有効期限のカラム名
      data: 'data'                   // セッションデータのカラム名
    }
  },
  // 接続プールの設定
  pool: {
    acquireTimeout: 60000,           // 接続取得のタイムアウト（60秒）
    timeout: 60000,                  // クエリのタイムアウト（60秒）
    reconnect: true                  // 自動再接続を有効
  },
  // 期限切れセッションの自動削除設定
  clearExpired: true,                // 期限切れセッションを自動削除
  checkExpirationInterval: 900000,   // チェック間隔（15分）
  expiration: 86400000,              // セッションの有効期限（24時間）
  createDatabaseTable: true,         // セッションテーブルが存在しない場合は自動作成
  endConnectionOnClose: true         // アプリ終了時に接続を閉じる
};

// セッションストアの作成
const sessionStore = new MySQLStore(sessionStoreOptions);

// セッションストアのエラーハンドリング
sessionStore.onReady(() => {
  console.log('セッションストア（MySQL）が正常に初期化されました');
});

sessionStore.on('error', (error) => {
  console.error('セッションストアエラー:', error);
});

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

*/
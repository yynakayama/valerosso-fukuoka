require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'valerosso_user',
    password: process.env.DB_PASSWORD || 'valerosso_password',
    database: process.env.DB_NAME || 'valerosso',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3307,
    dialect: 'mysql',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    timezone: '+09:00',
    logging: console.log
  },
  test: {
    username: process.env.TEST_DB_USER || 'valerosso_user',
    password: process.env.TEST_DB_PASSWORD || 'valerosso_password',
    database: process.env.TEST_DB_NAME || 'valerosso',
    host: process.env.TEST_DB_HOST || 'localhost',
    port: process.env.TEST_DB_PORT || 3307,
    dialect: 'mysql',
    logging: false
  },
  production: {
    // 🔥 Railway用の最終修正版
    
    // Option 1: DATABASE_URLを優先使用
    use_env_variable: 'DATABASE_URL',
    
    // Option 2: フォールバック設定（DATABASE_URLがない場合）
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'railway',
    host: process.env.DB_HOST || 'mysql.railway.internal',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    
    // Railway MySQL用の最適化設定
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      supportBigNumbers: true,
      bigNumberStrings: true,
      dateStrings: true,
      typeCast: true,
      // 接続タイムアウト
      connectTimeout: 30000,
      acquireTimeout: 30000,
      timeout: 30000,
      // SSL設定（Railwayでは通常false）
      ssl: false,
      // 再接続設定
      reconnect: true,
      idleTimeout: 300000
    },
    
    // 接続プール設定
    pool: {
      max: 10,          // 最大接続数
      min: 0,           // 最小接続数
      acquire: 30000,   // 接続取得タイムアウト（30秒）
      idle: 10000,      // アイドルタイムアウト（10秒）
      evict: 5000,      // 接続チェック間隔（5秒）
      handleDisconnects: true,  // 自動再接続
      validate: (connection) => {
        return connection && connection.state !== 'disconnected';
      }
    },
    
    timezone: '+09:00',
    
    // ログ設定（デバッグ時のみ有効）
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    
    // テーブル定義設定
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: true,
      underscored: false,
      freezeTableName: false
    },
    
    // Railway用のリトライ設定
    retry: {
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /ESOCKETTIMEDOUT/,
        /EHOSTUNREACH/,
        /EPIPE/,
        /EAI_AGAIN/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/
      ],
      max: 3  // 最大3回リトライ
    }
  }
};
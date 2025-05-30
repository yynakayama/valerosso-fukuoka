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
    // 🔥 Railway用の完全修正版
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    
    // Railway MySQL用の詳細設定
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      supportBigNumbers: true,
      bigNumberStrings: true,
      // 接続タイムアウト設定
      connectTimeout: 60000,
      acquireTimeout: 60000,
      timeout: 60000,
      // Railway用のSSL設定（必要に応じて）
      ssl: false
    },
    
    // コネクションプール設定（Railway用に最適化）
    pool: {
      max: 5,           // 最大接続数
      min: 0,           // 最小接続数
      acquire: 30000,   // 接続取得タイムアウト
      idle: 10000,      // アイドルタイムアウト
      evict: 1000,      // 接続の定期チェック間隔
      handleDisconnects: true,  // 切断の自動処理
      retry: {
        max: 5          // リトライ回数
      }
    },
    
    timezone: '+09:00',
    logging: process.env.NODE_ENV === 'production' ? false : console.log,
    
    // Railway用の追加設定
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: true,
      underscored: false,
      freezeTableName: false
    },
    
    // 重要: Railway用のクエリオプション
    query: {
      raw: false
    },
    
    // Railway接続の安定化設定
    retry: {
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /ETIMEDOUT/,
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
      max: 5
    }
  }
};
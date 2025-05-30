// config/config.js - Railway対応修正版
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
    database: process.env.TEST_DB_NAME || 'valerosso_test',
    host: process.env.TEST_DB_HOST || 'localhost',
    port: process.env.TEST_DB_PORT || 3307,
    dialect: 'mysql',
    logging: false
  },
  
  production: {
    // Railway MySQL接続設定（個別指定方式）
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    
    // Railway MySQL必須設定
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      // 接続タイムアウト設定
      connectTimeout: 60000,
      acquireTimeout: 60000,
      timeout: 60000,
      // 文字化け防止
      charset: 'utf8mb4'
    },
    
    // 接続プール設定
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
      handleDisconnects: true
    },
    
    timezone: '+09:00',
    logging: false,
    
    // マイグレーション用設定
    migrationStorageTableName: 'SequelizeMeta',
    seederStorage: 'sequelize',
    seederStorageTableName: 'SequelizeData'
  }
};
// config/config.js - DATABASE_URL版（Railway対応）
require('dotenv').config();

console.log('🔧 Config loading...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT_SET');

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
    // DATABASE_URL を使用（Railwayが自動提供）
    use_env_variable: 'DATABASE_URL',
    dialect: 'mysql',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      connectTimeout: 60000,
      acquireTimeout: 60000,
      timeout: 60000
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
      handleDisconnects: true
    },
    timezone: '+09:00',
    logging: false
  }
};
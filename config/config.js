// config/config.js - 確実動作版
require('dotenv').config();

// デバッグ情報を出力
console.log('🔧 Config loading...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT_SET');
console.log('PORT:', process.env.PORT);

module.exports = {
  development: {
    username: 'valerosso_user',
    password: 'valerosso_password',
    database: 'valerosso',
    host: 'localhost',
    port: 3307,
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
    username: 'valerosso_user',
    password: 'valerosso_password', 
    database: 'valerosso_test',
    host: 'localhost',
    port: 3307,
    dialect: 'mysql',
    logging: false
  },
  
  production: {
    // DATABASE_URL を使用する方法
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
            idle: 10000
          }
        }
      }
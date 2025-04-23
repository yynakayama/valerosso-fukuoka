// config/config.js
require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'valerosso_user',
    password: process.env.DB_PASSWORD || 'valerosso_password',
    database: process.env.DB_NAME || 'valerosso',
    host: process.env.DB_HOST || 'db',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: console.log
  },
  test: {
    username: process.env.TEST_DB_USER || 'valerosso_user',
    password: process.env.TEST_DB_PASSWORD || 'valerosso_password',
    database: process.env.TEST_DB_NAME || 'valerosso',
    host: process.env.TEST_DB_HOST || 'db',
    port: process.env.TEST_DB_PORT || 3306,
    dialect: 'mysql',
    logging: false
  },
  production: {
    username: process.env.PROD_DB_USER || 'valerosso_user',
    password: process.env.PROD_DB_PASSWORD || 'valerosso_password',
    database: process.env.PROD_DB_NAME || 'valerosso',
    host: process.env.PROD_DB_HOST || 'db',
    port: process.env.PROD_DB_PORT || 3306,
    dialect: 'mysql',
    logging: false
  }
};
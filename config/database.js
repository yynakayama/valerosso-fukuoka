// config/database.js
const { Sequelize } = require('sequelize');

// 環境変数から接続情報を取得（Docker環境を考慮）
const sequelize = new Sequelize(
  process.env.DB_NAME || 'valerosso',       // データベース名
  process.env.DB_USER || 'valerosso_user',  // ユーザー名
  process.env.DB_PASSWORD || 'valerosso_password', // パスワード
  {
    host: process.env.DB_HOST || 'db',      // DockerComposeでのサービス名
    port: process.env.DB_PORT || 3306,      // MySQLのデフォルトポート
    dialect: 'mysql',                       // 使用するデータベース
    pool: {
      max: 5,                               // 最大接続数
      min: 0,                               // 最小接続数
      acquire: 30000,                       // 接続取得のタイムアウト時間（ミリ秒）
      idle: 10000                           // アイドル状態のタイムアウト時間（ミリ秒）
    },
    // 開発モードでのロギング設定
    logging: process.env.NODE_ENV === 'development' ? console.log : false
  }
);

// データベース接続テスト関数
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('データベース接続成功: MySQLへの接続が確立されました');
    return true;
  } catch (error) {
    console.error('データベース接続エラー:', error);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection
};
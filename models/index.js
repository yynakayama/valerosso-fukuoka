'use strict';

// 必要なモジュールのインポート
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
// 環境設定の読み込み
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
// データベース接続情報を格納するオブジェクト
const db = {};

// Sequelizeインスタンスの初期化
let sequelize;
if (config.use_env_variable) {
  // 環境変数から接続情報を取得
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  // 設定ファイルから直接接続情報を取得
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// モデルファイルの自動読み込み
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&  // 隠しファイルを除外
      file !== basename &&        // index.jsを除外
      file.slice(-3) === '.js' && // JavaScriptファイルのみ
      file.indexOf('.test.js') === -1  // テストファイルを除外
    );
  })
  .forEach(file => {
    // モデルの初期化
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// モデル間の関連付けを設定
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Sequelizeインスタンスをエクスポート用オブジェクトに追加
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// データベース接続情報をエクスポート
module.exports = db;

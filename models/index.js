'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];
const db = {};

let sequelize;

// 🔥 Railway用の接続処理強化
if (env === 'production') {
  console.log('🚀 本番環境での接続開始...');
  console.log('接続設定:', {
    host: config.host,
    port: config.port,
    database: config.database,
    username: config.username,
    password: config.password ? '***設定済み***' : '❌未設定'
  });
  
  // Sequelize インスタンスの作成（Railway用設定）
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      ...config,
      // 追加の接続安定化設定
      pool: {
        ...config.pool,
        // Railway用の接続プール最適化
        acquire: 30000,
        idle: 10000,
        evict: 1000,
        handleDisconnects: true
      },
      dialectOptions: {
        ...config.dialectOptions,
        // Railway MySQL用の追加設定
        dateStrings: true,
        typeCast: true,
        connectTimeout: 60000,
        acquireTimeout: 60000,
        timeout: 60000
      },
      // デバッグ用ログ（一時的に有効化）
      logging: (msg) => {
        console.log('🔍 SQL:', msg);
      },
      // 接続エラー時の詳細ログ
      logQueryParameters: true,
      benchmark: true
    }
  );
} else {
  // 開発環境・テスト環境用（既存の処理）
  if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable], config);
  } else {
    sequelize = new Sequelize(config.database, config.username, config.password, config);
  }
}

// 接続テストの実行
sequelize.authenticate()
  .then(() => {
    console.log('✅ データベース接続成功');
    console.log(`📊 接続先: ${config.username}@${config.host}:${config.port}/${config.database}`);
  })
  .catch(err => {
    console.error('❌ データベース接続失敗:');
    console.error('エラー詳細:', err.message);
    console.error('接続設定:', {
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username
    });
  });

// モデルファイルの読み込み（既存の処理）
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

// ============================================
// Railway環境変数の再確認
// ============================================

/*
Railway Dashboard で以下の環境変数を再確認してください：

✅ 確認済みの設定:
NODE_ENV="production"
DB_HOST="mysql.railway.internal"  
DB_USER="root"
DB_PASSWORD="fdYSRICDjcNmDNYFMnLatfTwQgEkXdtH"
DB_NAME="railway"
DB_PORT="3306"
SESSION_SECRET="valerosso-fukuoka-super-secret-key-2025"

🔍 追加で確認すべき点:
- DATABASE_URL が設定されているか？
- MYSQLHOST, MYSQLUSER, MYSQLPASSWORD も設定されているか？

Railway CLI での確認:
railway variables
railway logs --tail
*/

// ============================================
// 緊急時の代替案
// ============================================

/*
もし上記で解決しない場合の代替案:

1. Railway の MySQL サービスの再起動
   Railway Dashboard → Database → Restart

2. 環境変数の再設定
   古い変数を削除して新しく設定

3. DATABASE_URL形式での接続テスト
   config.js の production で use_env_variable: 'DATABASE_URL' を試す
*/
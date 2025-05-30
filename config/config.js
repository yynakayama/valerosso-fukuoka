// ============================================
// ❌ 現在の問題のあるconfig.js
// ============================================

// production設定の問題点：
// 下記のproduction設定は無効な構文のためコメントアウトまたは削除してください。
// production: {
//   username: process.env.PROD_DB_USER || 'valerosso_user',  // ❌ 間違った環境変数名
//   password: process.env.PROD_DB_PASSWORD || 'valerosso_password',  // ❌ 間違った環境変数名
//   database: process.env.PROD_DB_NAME || 'valerosso',  // ❌ 間違った環境変数名
//   host: process.env.PROD_DB_HOST || 'localhost',  // ❌ Railway用の設定なし
//   port: process.env.PROD_DB_PORT || 3307,  // ❌ Railwayは通常3306
//   dialect: 'mysql',
//   logging: false
// }

// ============================================
// ✅ Railway対応の正しいconfig.js
// ============================================

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
    // 🔥 Railway用の正しい設定
    
    // Option 1: DATABASE_URLを使用（推奨）
    use_env_variable: 'DATABASE_URL',
    
    // Option 2: 個別設定（フォールバック）
    username: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'railway',
    host: process.env.DB_HOST || process.env.MYSQLHOST,
    port: process.env.DB_PORT || process.env.MYSQLPORT || 3306, // ✅ 正しいポート
    
    dialect: 'mysql',
    
    // Railway用の詳細設定
    dialectOptions: {
      charset: 'utf8mb4',
      supportBigNumbers: true,
      bigNumberStrings: true,
      // SSL接続（Railwayで必要な場合）
      ssl: process.env.DATABASE_SSL === 'require' ? {
        rejectUnauthorized: false
      } : false,
      // 接続タイムアウト設定
      connectTimeout: 30000,
      acquireTimeout: 30000,
      timeout: 30000,
    },
    
    // コネクションプール設定
    pool: {
      max: 10,        // 最大接続数
      min: 0,         // 最小接続数
      acquire: 30000, // 接続取得タイムアウト
      idle: 10000,    // アイドルタイムアウト
      retry: {
        max: 5        // リトライ回数
      }
    },
    
    timezone: '+09:00',
    
    // ログ設定（本番では無効、デバッグ時は有効）
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    
    // Railway用の追加設定
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: true,
      underscored: false
    }
  }
};

// ============================================
// 🔧 Railway Dashboard で設定すべき環境変数
// ============================================

/*
Railway で以下の環境変数を確認・設定してください：

【自動設定される変数（通常）】
✅ DATABASE_URL=mysql://username:password@host:port/database
✅ MYSQLHOST=xxx.railway.app
✅ MYSQLPORT=3306
✅ MYSQLUSER=root
✅ MYSQLPASSWORD=xxxxxxxx
✅ MYSQLDATABASE=railway

【手動で設定する変数】
NODE_ENV=production
DB_LOGGING=false (デバッグ時はtrue)
DATABASE_SSL=false (必要に応じてrequire)

【確認コマンド】
Railway CLI: railway variables

【トラブルシューティング】
1. DATABASE_URLの確認:
   railway variables | grep DATABASE_URL

2. 個別変数の確認:
   railway variables | grep MYSQL

3. 接続テスト:
   railway connect database
*/

// ============================================
// 🚨 緊急修正手順
// ============================================

/*
1. 現在のconfig/config.jsを上記の正しい版に置き換え
2. Railway にデプロイ
3. Railway Dashboard で環境変数を確認
4. /debug/news でテスト
5. 問題があれば /debug/fix-db で修復

【即座に試す方法】
curl https://valerosso-fukuoka-production.up.railway.app/debug/news

【期待される結果】
{
  "success": true,
  "database": {
    "connection": "✅ 接続成功"
  }
}
*/
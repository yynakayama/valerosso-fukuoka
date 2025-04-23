'use strict';
// Sequelizeのモデルクラスをインポート
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  // Instagramトークン管理用のモデルクラス定義
  class InstagramToken extends Model {
    // モデル間の関連付けを定義するメソッド
    static associate(models) {
      // 将来的なInstagram連携機能の拡張用
    }
  }
  
  // モデルの初期化と属性の定義
  InstagramToken.init({
    // アクセストークンの定義（Instagram APIアクセス用）
    access_token: DataTypes.TEXT,
    // トークン種別の定義（認証方式の識別用）
    token_type: DataTypes.STRING,
    // トークンの有効期限（自動更新管理用）
    expires_at: DataTypes.DATE,
    // Instagram ユーザーID（アカウント識別用）
    instagram_user_id: DataTypes.STRING
  }, {
    sequelize,  // Sequelizeインスタンス
    modelName: 'InstagramToken',  // モデル名の設定
    tableName: 'instagram_tokens',  // 実際のテーブル名
    underscored: true,  // スネークケース命名規則の使用
  });
  
  // モデルをエクスポート
  return InstagramToken;
};
'use strict';
// Sequelizeのモデルクラスをインポート
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  // 写真管理用のモデルクラス定義
  class Photo extends Model {
    // モデル間の関連付けを定義するメソッド
    static associate(models) {
      // アソシエーションはここで定義します
      // 将来的なアルバム機能やタグ付け機能の拡張用
    }
  }
  
  // モデルの初期化と属性の定義
  Photo.init({
    // 写真タイトルの定義（一覧表示用）
    title: DataTypes.STRING,
    // 写真URLの定義（画像表示用）
    image_url: DataTypes.STRING,
    // Instagram投稿IDの定義（SNS連携用）
    instagram_id: DataTypes.STRING,
    // 写真説明文の定義（詳細表示用）
    caption: DataTypes.TEXT,
    // 撮影日時の定義（時系列管理用）
    taken_at: DataTypes.DATE
  }, {
    sequelize,  // Sequelizeインスタンス
    modelName: 'Photo',  // モデル名の設定
    tableName: 'photos',  // 実際のテーブル名
    underscored: true,  // スネークケース命名規則の使用
  });
  
  // モデルをエクスポート
  return Photo;
};
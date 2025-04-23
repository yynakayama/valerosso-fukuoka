'use strict';
// Sequelizeのモデルクラスをインポート
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  // ニュース記事管理用のモデルクラス定義
  class News extends Model {
    // モデル間の関連付けを定義するメソッド
    static associate(models) {
      // ニュース記事は一人のユーザーに所属する（多対1の関係）
      News.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }
  
  // モデルの初期化と属性の定義
  News.init({
    // 記事タイトルの定義（一覧表示用）
    title: DataTypes.STRING,
    // 記事本文の定義（長文対応）
    content: DataTypes.TEXT,
    // 記事用画像URLの定義（画像表示用）
    image_url: DataTypes.STRING,
    // 記事公開日時の定義（公開管理用）
    published_at: DataTypes.DATE,
    // 注目記事フラグの定義（特集記事の識別用）
    is_featured: DataTypes.BOOLEAN,
    // 作成者IDの定義（ユーザーとの関連付け用）
    user_id: DataTypes.INTEGER
  }, {
    sequelize,  // Sequelizeインスタンス
    modelName: 'News',  // モデル名の設定
    tableName: 'news',  // 実際のテーブル名
    underscored: true,  // スネークケース命名規則の使用
  });
  
  // モデルをエクスポート
  return News;
};
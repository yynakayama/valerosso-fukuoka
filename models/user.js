'use strict';
// Sequelizeのモデルクラスをインポート
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  // ユーザーモデルクラスの定義
  class User extends Model {
    // モデル間の関連付けを定義するメソッド
    static associate(models) {
      // ユーザーはニュース記事を複数持つことができる（1対多の関係）
      User.hasMany(models.News, { 
        foreignKey: 'user_id',  // 外部キーの指定
        as: 'news'  // 関連名の設定
      });
    }
  }
  
  // モデルの初期化と属性の定義
  User.init({
    // ユーザー名の定義（認証とユーザー識別に使用）
    username: DataTypes.STRING,
    // パスワードの定義（ハッシュ化して保存）
    password: DataTypes.STRING,
    // メールアドレスの定義（ユーザー連絡用）
    email: DataTypes.STRING,
    // ユーザー権限の定義（管理者または編集者）
    role: DataTypes.ENUM('admin', 'editor')
  }, {
    sequelize,  // Sequelizeインスタンス
    modelName: 'User',  // モデル名の設定
    tableName: 'users',  // 実際のテーブル名
    underscored: true,  // スネークケース命名規則の使用
  });
  
  // モデルをエクスポート
  return User;
};
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // ユーザーは複数のニュース記事を持つ
      User.hasMany(models.News, { foreignKey: 'user_id', as: 'news' });
    }
  }
  
  User.init({
    // ユーザー名
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    // メールアドレス
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    // パスワード（ハッシュ化して保存）
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // ユーザーの役割（管理者、編集者など）
    role: {
      type: DataTypes.ENUM('admin', 'editor', 'viewer'),
      defaultValue: 'editor'
    },
    // アカウントが有効かどうか
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    underscored: true, // スネークケース命名規則を使用
  });
  
  return User;
};
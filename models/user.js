'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
       // ユーザーはニュース記事を複数持つことができる
  User.hasMany(models.News, { foreignKey: 'user_id' });
    }
  }
  
  User.init({
    username: DataTypes.STRING,
    password: DataTypes.STRING,
    email: DataTypes.STRING,
    role: DataTypes.ENUM('admin', 'editor')
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    underscored: true, // created_at, updated_atのようなスネークケースを使用
  });
  
  return User;
};
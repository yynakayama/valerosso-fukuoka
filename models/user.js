'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'editor'),
      defaultValue: 'editor'
    }
  }, {
    underscored: true, // snake_caseのカラム名を使用
    tableName: 'users' // テーブル名を明示的に指定
  });
  
  User.associate = function(models) {
    // ユーザーは多くのニュース記事を持つ可能性がある
    User.hasMany(models.News, {
      foreignKey: 'author_id',
      as: 'articles'
    });
  };
  
  return User;
};
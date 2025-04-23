'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class News extends Model {
    static associate(models) {
      // ニュース記事は一人のユーザーに所属する
      News.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }
  
  News.init({
    title: DataTypes.STRING,
    content: DataTypes.TEXT,
    image_url: DataTypes.STRING,
    published_at: DataTypes.DATE,
    is_featured: DataTypes.BOOLEAN,
    user_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'News',
    tableName: 'news',
    underscored: true,
  });
  
  return News;
};
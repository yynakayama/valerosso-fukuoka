'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Photo extends Model {
    static associate(models) {
      // アソシエーションはここで定義します
    }
  }
  
  Photo.init({
    title: DataTypes.STRING,
    image_url: DataTypes.STRING,
    instagram_id: DataTypes.STRING,
    caption: DataTypes.TEXT,
    taken_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Photo',
    tableName: 'photos',
    underscored: true,
  });
  
  return Photo;
};
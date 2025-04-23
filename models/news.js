'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class News extends Model {
    static associate(models) {
      // ニュース記事は一人のユーザーに所属する
      News.belongsTo(models.User, { foreignKey: 'user_id', as: 'author' });
      
      // ニュース記事は複数のInstagram投稿と関連付けられる
      News.belongsToMany(models.InstagramPost, {
        through: 'news_instagram_links',
        foreignKey: 'news_id',
        as: 'instagramPosts'
      });
    }
  }
  
  News.init({
    // 記事タイトル
    title: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    // 記事本文
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    // 記事用画像URL
    image_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    // 公開日時
    published_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    // 注目記事フラグ
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // 作成者ID
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'News',
    tableName: 'news',
    underscored: true,
  });
  
  return News;
};
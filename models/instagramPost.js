'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class InstagramPost extends Model {
    static associate(models) {
      // Instagram投稿は複数のニュース記事と関連付けられる
      InstagramPost.belongsToMany(models.News, {
        through: 'news_instagram_links',
        foreignKey: 'instagram_post_id',
        as: 'newsArticles'
      });
    }
  }
  
  InstagramPost.init({
    // Instagram側の投稿ID
    instagram_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    // 投稿のキャプション
    caption: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // 画像のURL
    media_url: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    // 投稿へのパーマリンク
    permalink: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    // 投稿日時
    posted_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    // 表示フラグ
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'InstagramPost',
    tableName: 'instagram_posts',
    underscored: true,
  });
  
  return InstagramPost;
};
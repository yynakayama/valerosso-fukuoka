'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class NewsInstagramLink extends Model {
    static associate(models) {
      // このモデルは中間テーブルなので、特別な関連付けは不要
    }
  }
  
  NewsInstagramLink.init({
    // ニュース記事ID
    news_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'News',
        key: 'id'
      }
    },
    // Instagram投稿ID
    instagram_post_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'InstagramPost',
        key: 'id'
      }
    },
    // 表示順序
    display_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'NewsInstagramLink',
    tableName: 'news_instagram_links',
    underscored: true,
  });
  
  return NewsInstagramLink;
};
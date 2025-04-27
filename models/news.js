'use strict';
module.exports = (sequelize, DataTypes) => {
  const News = sequelize.define('News', {
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    instagram_embed_code: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    underscored: true, // snake_caseのカラム名を使用
    tableName: 'news' // テーブル名を明示的に指定
  });
  
  News.associate = function(models) {
    // ニュース記事は一人の著者を持つ
    News.belongsTo(models.User, {
      foreignKey: 'author_id',
      as: 'author'
    });
  };
  
  return News;
};
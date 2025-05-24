'use strict';
module.exports = (sequelize, DataTypes) => {
  const News = sequelize.define('News', {
    // 記事タイトル
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // 記事本文
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    // インスタグラム埋め込みコード（オプション）
    instagram_embed_code: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // 作成者ID（外部キー）
    author_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    underscored: true, // snake_caseのカラム名を使用（created_at, updated_at）
    tableName: 'news' // テーブル名を明示的に指定
  });
  
  // 他のモデルとの関連付け設定
  News.associate = function(models) {
    // ニュース記事は1人のユーザー（作成者）に属する（多対1の関係）
    News.belongsTo(models.User, {
      foreignKey: 'author_id', // 外部キーのカラム名
      as: 'author' // 関連付けの別名
    });
  };
  
  return News;
};
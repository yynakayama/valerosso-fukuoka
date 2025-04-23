'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class InstagramToken extends Model {
    static associate(models) {
      // アソシエーションはここで定義します
    }
  }
  
  InstagramToken.init({
    access_token: DataTypes.TEXT,
    token_type: DataTypes.STRING,
    expires_at: DataTypes.DATE,
    instagram_user_id: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'InstagramToken',
    tableName: 'instagram_tokens',
    underscored: true,
  });
  
  return InstagramToken;
};
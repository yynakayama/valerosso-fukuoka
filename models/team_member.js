'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TeamMember extends Model {
    static associate(models) {
      // アソシエーションはここで定義します
    }
  }
  
  TeamMember.init({
    name: DataTypes.STRING,
    position: DataTypes.STRING,
    role: DataTypes.ENUM('player', 'coach', 'staff'),
    profile: DataTypes.TEXT,
    image_url: DataTypes.STRING,
    joined_date: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'TeamMember',
    tableName: 'team_members',
    underscored: true,
  });
  
  return TeamMember;
};
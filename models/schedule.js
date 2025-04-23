'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Schedule extends Model {
    static associate(models) {
      // アソシエーションはここで定義します
    }
  }
  
  Schedule.init({
    title: DataTypes.STRING,
    event_type: DataTypes.ENUM('practice', 'match', 'tournament', 'other'),
    start_time: DataTypes.DATE,
    end_time: DataTypes.DATE,
    location: DataTypes.STRING,
    description: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Schedule',
    tableName: 'schedules',
    underscored: true,
  });
  
  return Schedule;
};
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Inquiry = sequelize.define('Inquiry', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    inquiry_type: {
      type: DataTypes.ENUM('one-day-trial', 'join', 'media', 'other'),
      allowNull: false,
      field: 'inquiry_type'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    player_info: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'player_info'
    },
    media_info: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'media_info'
    },
    status: {
      type: DataTypes.ENUM('new', 'in-progress', 'completed', 'cancelled'),
      defaultValue: 'new'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'inquiries',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Inquiry;
}; 
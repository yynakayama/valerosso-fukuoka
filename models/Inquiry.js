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
    inquiryType: {
      type: DataTypes.ENUM('one-day-trial', 'join', 'media', 'other'),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    playerInfo: {
      type: DataTypes.JSON,
      allowNull: true
    },
    mediaInfo: {
      type: DataTypes.JSON,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('new', 'in-progress', 'completed', 'cancelled'),
      defaultValue: 'new'
    }
  }, {
    tableName: 'inquiries',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Inquiry;
}; 
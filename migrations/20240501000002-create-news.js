'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ニュースのテーブル作成
    await queryInterface.createTable('news', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      author_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      publish_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      is_published: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      image_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // テーブル削除
    await queryInterface.dropTable('news');
  }
};
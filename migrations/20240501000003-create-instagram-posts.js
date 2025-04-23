'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // インスタグラム投稿テーブルの作成
    await queryInterface.createTable('instagram_posts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      instagram_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      caption: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      media_url: {
        type: Sequelize.STRING,
        allowNull: false
      },
      permalink: {
        type: Sequelize.STRING,
        allowNull: false
      },
      thumbnail_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      media_type: {
        type: Sequelize.ENUM('IMAGE', 'VIDEO', 'CAROUSEL_ALBUM'),
        allowNull: false
      },
      posted_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      fetched_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    await queryInterface.dropTable('instagram_posts');
  }
};
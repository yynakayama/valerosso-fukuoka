'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ニュースとインスタグラム投稿の関連付けテーブルの作成
    await queryInterface.createTable('news_instagram_links', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      news_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'news',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      instagram_post_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'instagram_posts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      display_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      linked_by: {
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
    
    // ニュースIDとインスタグラム投稿IDのユニーク制約を追加
    await queryInterface.addConstraint('news_instagram_links', {
      fields: ['news_id', 'instagram_post_id'],
      type: 'unique',
      name: 'unique_news_instagram'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // テーブル削除
    await queryInterface.dropTable('news_instagram_links');
  }
};
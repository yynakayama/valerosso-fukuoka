'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // ニューステーブルの作成
    await queryInterface.createTable('news', {
      id: {
        allowNull: false, // NULLを許可しない
        autoIncrement: true, // 自動インクリメント
        primaryKey: true, // 主キー
        type: Sequelize.INTEGER // 整数型
      },
      title: {
        type: Sequelize.STRING, // 文字列型
        allowNull: false // NULLを許可しない
      },
      content: {
        type: Sequelize.TEXT, // テキスト型
        allowNull: false // NULLを許可しない
      },
      instagram_embed_code: {
        type: Sequelize.TEXT, // テキスト型
        allowNull: true // NULLを許可する
      },
      author_id: {
        type: Sequelize.INTEGER, // 整数型
        references: {
          model: 'users', // 外部キーとして参照するテーブル名
          key: 'id' // 外部キーとして参照するカラム
        },
        onUpdate: 'CASCADE', // 親テーブルが更新された場合に連動
        onDelete: 'SET NULL' // 親テーブルが削除された場合にNULLを設定
      },
      created_at: {
        allowNull: false, // NULLを許可しない
        type: Sequelize.DATE // 日付型
      },
      updated_at: {
        allowNull: false, // NULLを許可しない
        type: Sequelize.DATE // 日付型
      }
    });
  },

  async down(queryInterface, Sequelize) {
    // ニューステーブルの削除
    await queryInterface.dropTable('news');
  }
};
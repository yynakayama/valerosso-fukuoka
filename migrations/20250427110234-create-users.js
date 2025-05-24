'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // ユーザーテーブルの作成
    await queryInterface.createTable('users', {
      id: {
        allowNull: false, // NULLを許可しない
        autoIncrement: true, // 自動インクリメント
        primaryKey: true, // 主キー
        type: Sequelize.INTEGER // 整数型
      },
      username: {
        type: Sequelize.STRING, // 文字列型
        allowNull: false, // NULLを許可しない
        unique: true // ユニーク制約
      },
      password: {
        type: Sequelize.STRING, // 文字列型
        allowNull: false // NULLを許可しない
      },
      full_name: {
        type: Sequelize.STRING, // 文字列型（追加）
        allowNull: true // NULLを許可する
      },
      role: {
        type: Sequelize.ENUM('admin', 'editor'), // ENUM型（'admin'または'editor'）
        defaultValue: 'editor', // デフォルト値
        allowNull: false // NULLを許可しない
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
    // ユーザーテーブルの削除
    await queryInterface.dropTable('users');
  }
};
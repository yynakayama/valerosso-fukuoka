'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // テーブル作成時の処理
  async up(queryInterface, Sequelize) {
    // usersテーブルの作成処理
    await queryInterface.createTable('users', {
      // 主キーの設定
      id: {
        allowNull: false,  // NULL値を許可しない
        autoIncrement: true,  // 自動インクリメント
        primaryKey: true,  // 主キーとして設定
        type: Sequelize.INTEGER
      },
      // ユーザー名フィールドの設定
      username: {
        type: Sequelize.STRING(50),  // 最大50文字の文字列
        allowNull: false,  // 必須フィールド
        unique: true  // 一意性制約
      },
      // パスワードフィールドの設定
      password: {
        type: Sequelize.STRING(255),  // ハッシュ化されたパスワードを格納
        allowNull: false  // 必須フィールド
      },
      // メールアドレスフィールドの設定
      email: {
        type: Sequelize.STRING(100),  // 最大100文字の文字列
        allowNull: false,  // 必須フィールド
        unique: true  // 一意性制約
      },
      // ユーザー権限フィールドの設定
      role: {
        type: Sequelize.ENUM('admin', 'editor'),  // 権限種別の列挙型
        defaultValue: 'editor'  // デフォルト値の設定
      },
      // レコード作成日時
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      // レコード更新日時
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  // テーブル削除時の処理
  async down(queryInterface, Sequelize) {
    // usersテーブルの削除処理
    await queryInterface.dropTable('users');
  }
};
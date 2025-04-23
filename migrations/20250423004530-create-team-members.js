'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // テーブル作成の実行処理
  async up(queryInterface, Sequelize) {
    // チームメンバー管理用のテーブルを作成
    await queryInterface.createTable('team_members', {
      // システム管理用の主キー定義
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      // メンバー名の定義
      name: {
        type: Sequelize.STRING(100),  // 名前の文字数制限
        allowNull: false  // 名前は必須項目
      },
      // メンバーのポジション定義
      position: {
        type: Sequelize.STRING(50),  // ポジション名の文字数制限
        allowNull: true  // ポジションは任意項目
      },
      // メンバーの役割区分定義
      role: {
        type: Sequelize.ENUM('player', 'coach', 'staff'),  // 役割の種類を制限
        allowNull: false  // 役割は必須項目
      },
      // メンバーのプロフィール定義
      profile: {
        type: Sequelize.TEXT,  // 長文テキスト形式
        allowNull: true  // プロフィールは任意項目
      },
      // プロフィール画像の格納定義
      image_url: {
        type: Sequelize.STRING(255),  // URL形式での画像参照
        allowNull: true  // 画像は任意項目
      },
      // チーム加入日の定義
      joined_date: {
        type: Sequelize.DATE,  // 日付形式
        allowNull: true  // 加入日は任意項目
      },
      // レコード管理情報の定義
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

  // ロールバック時の処理
  async down(queryInterface, Sequelize) {
    // team_membersテーブルの完全削除
    await queryInterface.dropTable('team_members');
  }
};
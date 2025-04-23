'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // テーブル作成の実行処理
  async up(queryInterface, Sequelize) {
    // Instagramトークン管理用のテーブルを作成
    await queryInterface.createTable('instagram_tokens', {
      // システム管理用の主キー定義
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      // Instagramアクセストークンの定義
      access_token: {
        type: Sequelize.TEXT,  // トークン文字列を格納
        allowNull: false  // アクセストークンは必須項目
      },
      // トークン種別の定義
      token_type: {
        type: Sequelize.STRING(50),  // トークン種別の文字数制限
        allowNull: false  // トークン種別は必須項目
      },
      // トークン有効期限の定義
      expires_at: {
        type: Sequelize.DATE,  // 日時形式
        allowNull: false  // 有効期限は必須項目
      },
      // Instagram ユーザーIDの定義
      instagram_user_id: {
        type: Sequelize.STRING(100),  // InstagramユーザーIDの文字数制限
        allowNull: false  // ユーザーIDは必須項目
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
    // instagram_tokensテーブルの完全削除
    await queryInterface.dropTable('instagram_tokens');
  }
};
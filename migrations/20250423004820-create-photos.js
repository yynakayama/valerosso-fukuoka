'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // テーブル作成の実行処理
  async up(queryInterface, Sequelize) {
    // 写真管理用のテーブルを作成
    await queryInterface.createTable('photos', {
      // システム管理用の主キー定義
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      // 写真タイトルの定義
      title: {
        type: Sequelize.STRING(100),  // タイトルの文字数制限
        allowNull: true  // タイトルは任意項目
      },
      // 写真のURL保存定義
      image_url: {
        type: Sequelize.STRING(255),  // URL形式での画像参照
        allowNull: false  // 画像URLは必須項目
      },
      // Instagram連携用ID定義
      instagram_id: {
        type: Sequelize.STRING(100),  // InstagramのID文字数制限
        allowNull: true  // Instagram連携は任意項目
      },
      // 写真説明文の定義
      caption: {
        type: Sequelize.TEXT,  // 長文テキスト形式
        allowNull: true  // 説明文は任意項目
      },
      // 撮影日時の定義
      taken_at: {
        type: Sequelize.DATE,  // 日時形式
        allowNull: true  // 撮影日時は任意項目
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
    // photosテーブルの完全削除
    await queryInterface.dropTable('photos');
  }
};
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // テーブル作成の実行処理
  async up(queryInterface, Sequelize) {
    // ニュース記事管理用のテーブルを作成
    await queryInterface.createTable('news', {
      // システム管理用の主キー定義
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      // 記事タイトルの定義
      title: {
        type: Sequelize.STRING(100),  // タイトルの文字数制限
        allowNull: false  // タイトルは必須項目
      },
      // 記事本文の定義
      content: {
        type: Sequelize.TEXT,  // 長文テキスト形式
        allowNull: false  // 本文は必須項目
      },
      // 記事用画像の格納定義
      image_url: {
        type: Sequelize.STRING(255),  // URL形式での画像参照
        allowNull: true  // 画像は任意項目
      },
      // 記事公開日時の定義
      published_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW  // デフォルトは現在時刻
      },
      // 注目記事フラグの定義
      is_featured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false  // デフォルトは非注目記事
      },
      // 記事作成者との関連付け
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',  // usersテーブルとの外部キー制約
          key: 'id'
        },
        onUpdate: 'CASCADE',  // 参照先の更新を反映
        onDelete: 'SET NULL'  // 参照先の削除時はNULLに設定
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
    // newsテーブルの完全削除
    await queryInterface.dropTable('news');
  }
};
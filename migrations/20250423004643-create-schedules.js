'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // テーブル作成の実行処理
  async up(queryInterface, Sequelize) {
    // スケジュール管理用のテーブルを作成
    await queryInterface.createTable('schedules', {
      // システム管理用の主キー定義
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      // イベントタイトルの定義
      title: {
        type: Sequelize.STRING(100),  // タイトルの文字数制限
        allowNull: false  // タイトルは必須項目
      },
      // イベント種別の定義
      event_type: {
        type: Sequelize.ENUM('practice', 'match', 'tournament', 'other'),  // イベント種別を制限
        allowNull: false  // イベント種別は必須項目
      },
      // イベント開始時刻の定義
      start_time: {
        type: Sequelize.DATE,  // 日時形式
        allowNull: false  // 開始時刻は必須項目
      },
      // イベント終了時刻の定義
      end_time: {
        type: Sequelize.DATE,  // 日時形式
        allowNull: true  // 終了時刻は任意項目
      },
      // イベント開催場所の定義
      location: {
        type: Sequelize.STRING(255),  // 場所名の文字数制限
        allowNull: true  // 開催場所は任意項目
      },
      // イベント詳細説明の定義
      description: {
        type: Sequelize.TEXT,  // 長文テキスト形式
        allowNull: true  // 詳細説明は任意項目
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
    // schedulesテーブルの完全削除
    await queryInterface.dropTable('schedules');
  }
};
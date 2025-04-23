'use strict';
// Sequelizeのモデルクラスをインポート
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  // スケジュール管理用のモデルクラス定義
  class Schedule extends Model {
    // モデル間の関連付けを定義するメソッド
    static associate(models) {
      // 将来的なチーム・会場との関連付けなどの拡張用
    }
  }
  
  // モデルの初期化と属性の定義
  Schedule.init({
    // イベントタイトルの定義（一覧表示用）
    title: DataTypes.STRING,
    // イベント種別の定義（練習/試合/大会/その他）
    event_type: DataTypes.ENUM('practice', 'match', 'tournament', 'other'),
    // 開始時刻の定義（イベント開始管理用）
    start_time: DataTypes.DATE,
    // 終了時刻の定義（イベント終了管理用）
    end_time: DataTypes.DATE,
    // 開催場所の定義（会場情報表示用）
    location: DataTypes.STRING,
    // イベント詳細説明の定義（詳細情報表示用）
    description: DataTypes.TEXT
  }, {
    sequelize,  // Sequelizeインスタンス
    modelName: 'Schedule',  // モデル名の設定
    tableName: 'schedules',  // 実際のテーブル名
    underscored: true,  // スネークケース命名規則の使用
  });
  
  // モデルをエクスポート
  return Schedule;
};
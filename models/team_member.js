'use strict';
// Sequelizeのモデルクラスをインポート
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  // チームメンバー管理用のモデルクラス定義
  class TeamMember extends Model {
    // モデル間の関連付けを定義するメソッド
    static associate(models) {
      // 将来的なチーム構成やポジション管理との連携用
    }
  }
  
  // モデルの初期化と属性の定義
  TeamMember.init({
    // メンバー名の定義（表示・検索用）
    name: DataTypes.STRING,
    // ポジションの定義（役割表示用）
    position: DataTypes.STRING,
    // メンバー区分の定義（選手/コーチ/スタッフ）
    role: DataTypes.ENUM('player', 'coach', 'staff'),
    // プロフィールの定義（詳細情報表示用）
    profile: DataTypes.TEXT,
    // プロフィール画像の定義（画像表示用）
    image_url: DataTypes.STRING,
    // 加入日の定義（在籍期間管理用）
    joined_date: DataTypes.DATE
  }, {
    sequelize,  // Sequelizeインスタンス
    modelName: 'TeamMember',  // モデル名の設定
    tableName: 'team_members',  // 実際のテーブル名
    underscored: true,  // スネークケース命名規則の使用
  });
  
  // モデルをエクスポート
  return TeamMember;
};
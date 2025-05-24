'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    // ユーザー名（ログイン用、一意制約あり）
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    // パスワード（ハッシュ化済み）
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // フルネーム（表示用の名前）
    full_name: {
      type: DataTypes.STRING,
      allowNull: true // NULLを許可
    },
    // 権限レベル（管理者または編集者）
    role: {
      type: DataTypes.ENUM('admin', 'editor'),
      defaultValue: 'editor'
    }
  }, {
    underscored: true, // snake_caseのカラム名を使用（created_at, updated_at）
    tableName: 'users' // テーブル名を明示的に指定
  });
  
  // 他のモデルとの関連付け設定
  User.associate = function(models) {
    // ユーザーは多くのニュース記事を持つ可能性がある（1対多の関係）
    User.hasMany(models.News, {
      foreignKey: 'author_id', // 外部キーのカラム名
      as: 'articles' // 関連付けの別名
    });
  };
  
  return User;
};
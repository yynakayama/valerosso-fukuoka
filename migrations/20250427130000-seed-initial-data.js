// migrations/20250427130000-seed-initial-data.js（セキュリティ強化版）
'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    // 環境変数から初期パスワードを取得（開発環境用のデフォルト値あり）
    const initialPassword = process.env.INITIAL_ADMIN_PASSWORD || 'admin123';
    
    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(initialPassword, 10);

    // 初期管理者ユーザーを作成
    await queryInterface.bulkInsert('users', [{
      username: 'admin',
      password: hashedPassword,
      full_name: 'システム管理者',
      role: 'admin',
      created_at: new Date(),
      updated_at: new Date()
    }], {
      ignoreDuplicates: true
    });

    // 本番環境では警告を表示
    if (process.env.NODE_ENV === 'production' && initialPassword === 'admin123') {
      console.warn('⚠️  WARNING: デフォルトパスワードが使用されています。本番運用前に必ず変更してください！');
    }

    // ユーザーIDを取得（外部キー用）
    const [users] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE username = 'admin'"
    );
    const adminUserId = users[0].id;

    // 初期お知らせ記事を作成
    await queryInterface.bulkInsert('news', [
      {
        title: 'ヴァレロッソ福岡 公式サイト開設',
        content: 'ヴァレロッソ福岡の公式ウェブサイトが開設されました。お知らせや練習予定、試合結果などの情報を随時更新していきます。',
        author_id: adminUserId,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        title: 'セキュリティに関する重要なお知らせ',
        content: 'システム管理者の皆様へ：初期設定完了後、必ず管理者パスワードを変更してください。セキュリティ強化のため、定期的なパスワード変更を推奨します。',
        author_id: adminUserId,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {
      ignoreDuplicates: true
    });
  },

  async down(queryInterface, Sequelize) {
    // ロールバック時：初期データを削除
    await queryInterface.bulkDelete('news', {
      title: [
        'ヴァレロッソ福岡 公式サイト開設',
        'セキュリティに関する重要なお知らせ'
      ]
    });

    await queryInterface.bulkDelete('users', {
      username: 'admin'
    });
  }
};
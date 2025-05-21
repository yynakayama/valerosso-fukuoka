'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // 管理者ユーザーを作成
    await queryInterface.bulkInsert('users', [{
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      created_at: new Date(),
      updated_at: new Date()
    }], {});
  },

  async down(queryInterface, Sequelize) {
    // 管理者ユーザーを削除
    await queryInterface.bulkDelete('users', { username: 'admin' }, {});
  }
}; 
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // created_at が null のレコードを更新
    await queryInterface.sequelize.query(`
      UPDATE inquiries 
      SET created_at = NOW(), updated_at = NOW() 
      WHERE created_at IS NULL
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // ロールバックは不要
  }
}; 
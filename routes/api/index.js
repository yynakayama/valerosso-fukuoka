const express = require('express');
const router = express.Router();

// 各APIルートのインポート
const newsRoutes = require('./news');
const inquiryRoutes = require('./inquiries');

// ルートの登録
router.use('/news', newsRoutes);
router.use('/inquiries', inquiryRoutes);

// テスト用APIエンドポイント
router.get('/test', (req, res) => {
  res.json({ 
    message: 'APIが正常に動作しています',
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 
const express = require('express');
const csrf = require('csurf');
const router = express.Router();
const { Inquiry } = require('../../models');
const { requireAuth, requireAdmin } = require('../../middleware/auth');

// CSRF保護ミドルウェアの設定
const csrfProtection = csrf({ cookie: true });

// レート制限の設定
const rateLimit = (() => {
  const requests = new Map();
  const limit = 2; // 15分あたりのリクエスト数
  const windowMs = 15 * 60 * 1000;  // 15分
  
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    const currentTime = Date.now();

    // 期限切れのリクエストを削除
    for (const [ip, data] of requests.entries()) {
      if (currentTime - data.timestamp > windowMs) {
        requests.delete(ip);
      }
    }

    // 現在のリクエストを記録
    if (!requests.has(key)) {
      requests.set(key, { count: 1, timestamp: currentTime });
    } else {
      const data = requests.get(key);
      if (data.count < limit) {
        data.count += 1;
      } else {
        return res.status(429).json({ message: 'リクエストが多すぎます。しばらく待ってから再試行してください。' });
      }
    }
    next();
  };
})();

// お問い合わせの新規作成
router.post('/', rateLimit, csrfProtection, async (req, res) => {
  try {
    const now = new Date();
    const inquiryData = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      inquiry_type: req.body.inquiryType,
      message: req.body.message,
      created_at: now,
      updated_at: now
    };

    // お問い合わせ種類に応じて追加情報を設定
    if (req.body.inquiryType === 'one-day-trial' || req.body.inquiryType === 'join') {
      inquiryData.player_info = {
        grade: req.body.grade,
        experience: req.body.experience,
        position: req.body.position,
        currentTeam: req.body.currentTeam,
        preferredDate: req.body.preferredPlayerDate
      };
    } else if (req.body.inquiryType === 'media') {
      inquiryData.media_info = {
        mediaName: req.body.mediaName,
        mediaType: req.body.mediaType,
        preferredDate: req.body.preferredDate
      };
    }

    console.log('Creating inquiry with data:', inquiryData);
    const inquiry = await Inquiry.create(inquiryData);
    console.log('Created inquiry:', inquiry.toJSON());

    res.status(201).json({
      success: true,
      message: 'お問い合わせを受け付けました。'
    });
  } catch (error) {
    console.error('Error creating inquiry:', error);
    res.status(500).json({
      success: false,
      message: 'お問い合わせの送信に失敗しました。'
    });
  }
});

// 管理者用：お問い合わせ一覧の取得
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const inquiries = await Inquiry.findAll({
      order: [['created_at', 'DESC']],
      limit: 100
    });
    res.json(inquiries);
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).json({
      success: false,
      message: 'お問い合わせ一覧の取得に失敗しました。'
    });
  }
});

// 管理者用：お問い合わせの詳細取得
router.get('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const inquiry = await Inquiry.findByPk(req.params.id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'お問い合わせが見つかりません。'
      });
    }
    res.json(inquiry);
  } catch (error) {
    console.error('Error fetching inquiry:', error);
    res.status(500).json({
      success: false,
      message: 'お問い合わせの取得に失敗しました。'
    });
  }
});

// 管理者用：お問い合わせのステータス更新
router.patch('/:id/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const [updatedCount] = await Inquiry.update(
      { status },
      { where: { id: req.params.id } }
    );

    if (updatedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'お問い合わせが見つかりません。'
      });
    }

    const inquiry = await Inquiry.findByPk(req.params.id);
    res.json(inquiry);
  } catch (error) {
    console.error('Error updating inquiry status:', error);
    res.status(500).json({
      success: false,
      message: 'ステータスの更新に失敗しました。'
    });
  }
});

module.exports = router; 
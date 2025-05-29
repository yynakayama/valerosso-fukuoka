const express = require('express');
const router = express.Router();
const { Inquiry } = require('../../models');
const { isAuthenticated, isAdmin } = require('../../middleware/auth');

// お問い合わせの新規作成
router.post('/', async (req, res) => {
  try {
    const inquiryData = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      inquiryType: req.body.inquiryType,
      message: req.body.message
    };

    // お問い合わせ種類に応じて追加情報を設定
    if (req.body.inquiryType === 'one-day-trial' || req.body.inquiryType === 'join') {
      inquiryData.playerInfo = {
        grade: req.body.grade,
        experience: req.body.experience,
        position: req.body.position,
        currentTeam: req.body.currentTeam,
        preferredDate: req.body.preferredPlayerDate
      };
    } else if (req.body.inquiryType === 'media') {
      inquiryData.mediaInfo = {
        mediaName: req.body.mediaName,
        mediaType: req.body.mediaType,
        preferredDate: req.body.preferredDate
      };
    }

    const inquiry = await Inquiry.create(inquiryData);

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
router.get('/', [isAuthenticated, isAdmin], async (req, res) => {
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
router.get('/:id', [isAuthenticated, isAdmin], async (req, res) => {
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
router.patch('/:id/status', [isAuthenticated, isAdmin], async (req, res) => {
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
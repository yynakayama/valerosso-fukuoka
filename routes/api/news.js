const express = require('express');
const router = express.Router();
const { User, News } = require('../../models');

// ニュース一覧を取得するAPIエンドポイント
router.get('/', async (req, res) => {
  try {
    // クエリパラメータから制限数を取得（デフォルト：無制限）
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    
    // データベースからニュース一覧を取得（日付順にソート）
    const options = {
      order: [['created_at', 'DESC']], // 新しい記事を先頭に
      attributes: [
        'id', 
        'title', 
        'content', 
        'instagram_embed_code',
        'created_at'
      ], 
      include: [{
        model: User,
        as: 'author',
        attributes: ['username', 'full_name']
      }]
    };
    
    // 制限数が指定されている場合は追加
    if (limit) {
      options.limit = limit;
    }
    
    const news = await News.findAll(options);
    
    res.json(news);
  } catch (error) {
    console.error('News fetch error:', error);
    res.status(500).json({ 
      message: 'ニュースの取得に失敗しました',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 特定のニュース記事を取得するAPIエンドポイント
router.get('/:id', async (req, res) => {
  try {
    const newsId = parseInt(req.params.id);
    
    // パラメータの検証
    if (isNaN(newsId) || newsId <= 0) {
      return res.status(400).json({ message: '無効な記事IDです' });
    }
    
    // データベースから特定の記事を取得
    const newsItem = await News.findByPk(newsId, {
      attributes: [
        'id', 
        'title', 
        'content', 
        'instagram_embed_code',
        'created_at'
      ], 
      include: [{
        model: User,
        as: 'author',
        attributes: ['username', 'full_name']
      }]
    });
    
    if (!newsItem) {
      return res.status(404).json({ message: '記事が見つかりません' });
    }
    
    res.json(newsItem);
  } catch (error) {
    console.error('News fetch error:', error);
    res.status(500).json({ 
      message: '記事の取得に失敗しました',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 新規ニュース投稿APIエンドポイント（管理画面用）
router.post('/', async (req, res) => {
  try {
    const { title, content, instagram_embed_code } = req.body;
    
    // 入力値の検証
    if (!title || !content) {
      return res.status(400).json({ message: 'タイトルと内容は必須です' });
    }
    
    // データベースに新しいニュース記事を作成
    const newItem = await News.create({
      title: title.trim(),
      content: content.trim(),
      instagram_embed_code: instagram_embed_code ? instagram_embed_code.trim() : null,
      author_id: req.session?.userId || 1 // ログイン中のユーザーIDまたはデフォルト
    });
    
    // 作成された記事を返す（ステータスコード201：Created）
    res.status(201).json({
      message: 'ニュース記事が正常に作成されました',
      data: newItem
    });
  } catch (error) {
    console.error('News creation error:', error);
    res.status(500).json({ 
      message: 'ニュース記事の作成に失敗しました',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ニュース記事を更新するAPIエンドポイント
router.put('/:id', async (req, res) => {
  try {
    const newsId = parseInt(req.params.id);
    const { title, content, instagram_embed_code } = req.body;
    
    // パラメータの検証
    if (isNaN(newsId) || newsId <= 0) {
      return res.status(400).json({ message: '無効な記事IDです' });
    }
    
    // 入力値の検証
    if (!title || !content) {
      return res.status(400).json({ message: 'タイトルと内容は必須です' });
    }
    
    // データベースの記事を更新
    const [updatedCount] = await News.update({
      title: title.trim(),
      content: content.trim(),
      instagram_embed_code: instagram_embed_code ? instagram_embed_code.trim() : null
    }, {
      where: { id: newsId }
    });
    
    if (updatedCount === 0) {
      return res.status(404).json({ message: '更新する記事が見つかりません' });
    }
    
    res.json({ message: '記事が正常に更新されました' });
  } catch (error) {
    console.error('News update error:', error);
    res.status(500).json({ 
      message: 'ニュース記事の更新に失敗しました',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ニュース記事を削除するAPIエンドポイント
router.delete('/:id', async (req, res) => {
  try {
    const newsId = parseInt(req.params.id);
    
    // パラメータの検証
    if (isNaN(newsId) || newsId <= 0) {
      return res.status(400).json({ message: '無効な記事IDです' });
    }
    
    // データベースから記事を削除
    const deletedCount = await News.destroy({
      where: { id: newsId }
    });
    
    // 削除された記事がない場合は404エラーを返す
    if (deletedCount === 0) {
      return res.status(404).json({ message: '削除する記事が見つかりません' });
    }
    
    // 正常に削除された場合の応答
    res.json({ message: '記事が正常に削除されました' });
  } catch (error) {
    console.error('News deletion error:', error);
    res.status(500).json({ 
      message: 'ニュース記事の削除に失敗しました',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 
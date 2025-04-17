// server.js - サーバーのメインファイル
const express = require('express'); // Expressフレームワークのインポート
const cors = require('cors');       // CORSミドルウェアのインポート
require('dotenv').config();         // 環境変数の読み込み

// Expressアプリケーションの初期化
const app = express();
const PORT = process.env.PORT || 3000; // 環境変数からポート番号を取得、なければ3000を使用

// ミドルウェアの設定
app.use(cors());                // クロスオリジンリクエストを許可
app.use(express.json());        // JSONリクエストボディの解析
app.use(express.static('public')); // 静的ファイルの提供（HTMLやCSS、画像など）

// 仮のニュースデータ（後でデータベースに置き換え予定）
let newsItems = [
  {
    id: 1,
    title: '夏季トレーニングキャンプの日程発表',
    content: '今年の夏季トレーニングキャンプは8月10日から15日まで福岡市内で行われます。詳細は後日お知らせします。',
    date: '2025-04-15'
  },
  {
    id: 2,
    title: '新入部員募集のお知らせ',
    content: '2025年度の新入部員を募集しています。体験練習も随時受け付けていますので、興味のある方はお問い合わせください。',
    date: '2025-04-16'
  }
];

// テスト用APIエンドポイント - サーバーが正常に動作しているか確認するため
app.get('/api/test', (req, res) => {
  res.json({ message: 'APIが正常に動作しています' });
});

// ニュース一覧を取得するAPIエンドポイント
app.get('/api/news', (req, res) => {
  res.json(newsItems);
});

// 特定のニュース記事を取得するAPIエンドポイント
app.get('/api/news/:id', (req, res) => {
  // URLパラメータから記事IDを取得し、整数に変換
  const newsItem = newsItems.find(item => item.id === parseInt(req.params.id));
  
  // 記事が見つからない場合は404エラーを返す
  if (!newsItem) return res.status(404).json({ message: '記事が見つかりません' });
  
  // 記事が見つかった場合はJSONとして返す
  res.json(newsItem);
});

// 新規ニュース投稿APIエンドポイント（本来は認証機能が必要）
app.post('/api/news', (req, res) => {
  const { title, content } = req.body;
  
  // 新しいニュース記事オブジェクトを作成
  const newItem = {
    id: newsItems.length + 1,
    title,
    content,
    date: new Date().toISOString().split('T')[0] // 現在の日付をYYYY-MM-DD形式で設定
  };
  
  // 配列に追加
  newsItems.push(newItem);
  
  // 作成された記事を返す（ステータスコード201：Created）
  res.status(201).json(newItem);
});

// ニュース記事を削除するAPIエンドポイント（本来は認証機能が必要）
app.delete('/api/news/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  // 削除前の配列の長さを記録
  const initialLength = newsItems.length;
  
  // 指定されたIDの記事を除外して新しい配列を作成
  newsItems = newsItems.filter(item => item.id !== id);
  
  // 配列の長さが変わらなかった場合、記事が見つからなかったことを意味する
  if (newsItems.length === initialLength) {
    return res.status(404).json({ message: '削除する記事が見つかりません' });
  }
  
  // 正常に削除された場合の応答
  res.json({ message: '記事が正常に削除されました' });
});

// サーバーの起動
app.listen(PORT, () => {
  console.log(`サーバーがポート${PORT}で起動しました`);
});
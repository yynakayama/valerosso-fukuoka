// public/js/pages/news.js - ニュースページのJavaScript
document.addEventListener('DOMContentLoaded', () => {
    // ニュース記事を表示するコンテナ要素を取得
    const newsContainer = document.querySelector('.news-container');
    
    // ローディング表示を追加
    newsContainer.innerHTML = '<p class="loading">ニュースを読み込んでいます...</p>';
    
    // APIからニュースデータを取得
    fetch('/api/news')
      .then(response => {
        // レスポンスが正常でない場合はエラーをスロー
        if (!response.ok) {
          throw new Error('サーバーからのレスポンスが正常ではありません');
        }
        return response.json(); // レスポンスをJSONとして解析
      })
      .then(newsItems => {
        // コンテナを一旦空にする
        newsContainer.innerHTML = '';
        
        // ニュースがない場合の表示
        if (newsItems.length === 0) {
          newsContainer.innerHTML = '<p>現在、お知らせはありません。</p>';
          return;
        }
        
        // 各ニュース記事に対してDOM要素を作成して表示
        newsItems.forEach(item => {
          const newsCard = document.createElement('div');
          newsCard.className = 'news-card';
          
          // HTMLを構築
          newsCard.innerHTML = `
            <h3>${item.title}</h3>
            <div class="news-date">${item.date}</div>
            <p>${item.content}</p>
          `;
          
          // コンテナに追加
          newsContainer.appendChild(newsCard);
        });
      })
      .catch(error => {
        // エラーが発生した場合
        console.error('ニュース取得エラー:', error);
        newsContainer.innerHTML = '<p class="error">ニュースの読み込みに失敗しました。後でもう一度お試しください。</p>';
      });
  });
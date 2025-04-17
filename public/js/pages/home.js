// home.js - ホームページのお知らせ欄にインスタグラム投稿を表示するJavaScript

/**
 * DOMが完全に読み込まれたときに実行される関数
 */
document.addEventListener('DOMContentLoaded', function() {
    // ニュースコンテナの参照を取得
    const newsContainer = document.querySelector('.news-container');
    
    // お知らせ投稿を読み込んで表示
    loadNewsForHomePage();
    
    /**
     * ホームページ用のお知らせを読み込む関数
     * 最新の3件だけを表示する
     */
    function loadNewsForHomePage() {
        // ローディング表示
        newsContainer.innerHTML = '<div class="loading">読み込み中...</div>';
        
        // APIからニュースデータを取得
        fetch('/api/news')
            .then(response => {
                if (!response.ok) {
                    throw new Error('サーバーからのレスポンスが正常ではありません');
                }
                return response.json();
            })
            .then(newsItems => {
                // 投稿がない場合
                if (newsItems.length === 0) {
                    newsContainer.innerHTML = '<p class="no-news">現在お知らせはありません。</p>';
                    return;
                }
                
                // リストをクリア
                newsContainer.innerHTML = '';
                
                // 最新の3件だけを表示
                const recentPosts = newsItems.slice(0, 3);
                
                // 各投稿をニュースカードとして表示
                recentPosts.forEach(post => {
                    // 日付をフォーマット
                    const date = new Date(post.date);
                    const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
                    
                    // ニュースカード要素を作成
                    const newsCard = document.createElement('div');
                    newsCard.className = 'news-card';
                    
                    // カードの内容をHTMLで構成
                    newsCard.innerHTML = `
                        <div class="news-content">
                            <div class="news-date">${formattedDate}</div>
                            <h3 class="news-title">${post.title}</h3>
                            <p>${post.content}</p>
                        </div>
                    `;
                    
                    // ニュースコンテナに追加
                    newsContainer.appendChild(newsCard);
                });
            })
            .catch(error => {
                console.error('ニュース取得エラー:', error);
                newsContainer.innerHTML = '<p class="error">ニュースの読み込みに失敗しました。後でもう一度お試しください。</p>';
            });
    }
});

// インスタグラム埋め込みスクリプトを動的に読み込む
(function() {
    // スクリプト要素を作成
    const script = document.createElement('script');
    script.src = '//www.instagram.com/embed.js';
    script.async = true;
    script.defer = true;
    
    // bodyの最後に追加
    document.body.appendChild(script);
})();
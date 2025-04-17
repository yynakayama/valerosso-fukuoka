// news.js - お知らせページの機能を実装するJavaScript

/**
 * DOMが完全に読み込まれたときに実行される関数
 */
document.addEventListener('DOMContentLoaded', function() {
    // お知らせコンテナの参照を取得
    const newsPageContainer = document.querySelector('.news-page-container');
    
    // お知らせを読み込んで表示
    loadAllNews();
    
    /**
     * すべてのお知らせを読み込む関数
     */
    function loadAllNews() {
        // ローディング表示
        newsPageContainer.innerHTML = '<div class="loading">読み込み中...</div>';
        
        // ローカルストレージから投稿を取得
        let posts = JSON.parse(localStorage.getItem('newsPosts')) || [];
        
        // 少し遅延を入れてローディング表示を確認できるようにする（実際の実装では不要）
        setTimeout(() => {
            // 投稿がない場合
            if (posts.length === 0) {
                newsPageContainer.innerHTML = 
                    '<div class="no-news-message">現在お知らせはありません。</div>';
                return;
            }
            
            // リストをクリア
            newsPageContainer.innerHTML = '';
            
            // 各投稿をカードとして表示
            posts.forEach(post => {
                // 日付をフォーマット
                const date = new Date(post.date);
                const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
                
                // カード要素を作成
                const newsCard = document.createElement('div');
                newsCard.className = 'news-page-card';
                
                // カードの内容をHTMLで構成
                newsCard.innerHTML = `
                    <div class="news-page-content">
                        <div class="news-page-date">${formattedDate}</div>
                        <h2 class="news-page-title">${post.title}</h2>
                        <div class="news-page-embed">${post.embedCode}</div>
                    </div>
                `;
                
                // コンテナに追加
                newsPageContainer.appendChild(newsCard);
            });
            
            // インスタグラム埋め込みを処理（インスタグラムの埋め込みスクリプトを実行）
            if (window.instgrm) {
                window.instgrm.Embeds.process();
            }
        }, 500); // 500msの遅延（デモ用、実際の実装では不要）
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
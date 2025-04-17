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
        
        // ローカルストレージから投稿を取得
        let posts = JSON.parse(localStorage.getItem('newsPosts')) || [];
        
        // 少し遅延を入れてローディング表示を確認できるようにする（実際の実装では不要）
        setTimeout(() => {
            // 投稿がない場合
            if (posts.length === 0) {
                newsContainer.innerHTML = '<p class="no-news">現在お知らせはありません。</p>';
                return;
            }
            
            // リストをクリア
            newsContainer.innerHTML = '';
            
            // 最新の3件だけを表示
            const recentPosts = posts.slice(0, 3);
            
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
                        <div class="news-instagram-embed">${post.embedCode}</div>
                    </div>
                `;
                
                // ニュースコンテナに追加
                newsContainer.appendChild(newsCard);
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
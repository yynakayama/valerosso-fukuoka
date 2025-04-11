/**
 * home.js
 * ホームページ固有のJavaScript
 */

// DOMが完全に読み込まれた後に実行
document.addEventListener('DOMContentLoaded', function() {
    // お知らせカードのサンプルデータ
    // 実際のプロジェクトでは、APIやバックエンドからデータを取得する場合が多い
    const newsData = [
        {
            title: '福岡ジュニアカップの組み合わせ決定',
            date: '2025年4月8日',
            image: 'images/news-1.jpg',
            excerpt: '4月15日に開催される福岡ジュニアカップの組み合わせが決定しました。高校生チームは午前9時から第1試合です。',
            link: 'news.html#news1'
        },
        {
            title: '春休み特別練習のお知らせ',
            date: '2025年4月5日',
            image: 'images/news-2.jpg',
            excerpt: '春休み期間中の特別練習を実施します。練習時間と持ち物の詳細はお知らせをご確認ください。',
            link: 'news.html#news2'
        },
        {
            title: '新入部員募集のお知らせ',
            date: '2025年4月1日',
            image: 'images/news-3.jpg',
            excerpt: '2025年度の新入部員を募集しています。体験練習も随時受け付けていますので、お気軽にお問い合わせください。',
            link: 'news.html#news3'
        }
    ];
    
    // ニュースコンテナを取得
    const newsContainer = document.querySelector('.news-container');
    
    // ニュースデータがあり、コンテナが存在する場合
    if (newsData && newsContainer) {
        // 各ニュースデータをループしてカードを生成
        newsData.forEach(news => {
            // カード要素を作成
            const newsCard = document.createElement('div');
            newsCard.className = 'news-card';
            
            // カードの内容を作成（画像とテキストコンテンツ）
            newsCard.innerHTML = `
                <img src="${news.image}" alt="${news.title}" loading="lazy">
                <div class="news-content">
                    <div class="news-date">${news.date}</div>
                    <h3 class="news-title">${news.title}</h3>
                    <p class="news-excerpt">${news.excerpt}</p>
                    <a href="${news.link}" class="news-link">続きを読む &raquo;</a>
                </div>
            `;
            
            // カードをコンテナに追加
            newsContainer.appendChild(newsCard);
        });
    }
    
    
});
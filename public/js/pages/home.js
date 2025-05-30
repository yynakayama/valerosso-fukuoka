// ホームページ用JavaScript - 最新のお知らせを表示

// DOMContentLoadedイベント：ページのHTMLが読み込み完了した時に実行
document.addEventListener('DOMContentLoaded', function() {
    // 最新お知らせを読み込む関数を呼び出し
    loadLatestNews();
});

// 最新のお知らせをAPIから取得して表示する関数
async function loadLatestNews() {
    try {
        // APIのベースURLを環境に応じて設定
        const baseUrl = window.location.hostname === 'localhost' ? '' : '/api';
        
        // APIエンドポイントから最新のお知らせデータを取得
        const response = await fetch(`${baseUrl}/api/news`);
        
        // レスポンスが正常でない場合はエラーを投げる
        if (!response.ok) {
            throw new Error('ニュースの取得に失敗しました');
        }
        
        // JSONデータとして解析
        const newsData = await response.json();
        
        // お知らせコンテナ要素を取得
        const newsContainer = document.querySelector('.news-section .news-container');
        
        // ニュースデータが空の場合
        if (newsData.length === 0) {
            newsContainer.innerHTML = '<p class="no-news">現在お知らせはありません。</p>';
            return;
        }
        
        // 最新3件のニュースのみを表示（ホームページ用）
        const latestNews = newsData.slice(0, 3);
        
        // 各ニュース記事のHTMLを生成
        const newsHTML = latestNews.map(news => createNewsPreview(news)).join('');
        
        // 生成したHTMLをコンテナに挿入
        newsContainer.innerHTML = newsHTML;
        
        // インスタグラム埋め込みの初期化を実行
        initializeInstagramEmbeds();
        
    } catch (error) {
        console.error('ニュース読み込みエラー:', error);
        
        // エラー時の表示
        const newsContainer = document.querySelector('.news-section .news-container');
        newsContainer.innerHTML = '<p class="error-message">お知らせの読み込み中にエラーが発生しました。</p>';
    }
}

// ホームページ用のニュースプレビューHTMLを生成する関数
function createNewsPreview(news) {
    // 日付をフォーマット（YYYY-MM-DD形式に変換）
    const formattedDate = formatDate(news.created_at);
    
    // 記事本文を短縮表示（150文字まで）
    const shortContent = news.content.length > 150 ? 
        news.content.substring(0, 150) + '...' : 
        news.content;
    
    // インスタグラム埋め込みがある場合のプレビュー表示
    let instagramPreview = '';
    if (news.instagram_embed_code && news.instagram_embed_code.trim()) {
        // ホームページでは簡単なプレビューのみ表示
        if (isValidInstagramEmbed(news.instagram_embed_code)) {
            instagramPreview = `
                <div class="instagram-preview">
                    <p class="instagram-note">📷 Instagram投稿あり</p>
                    <div class="instagram-embed-preview" data-instagram-post="true">
                        <div class="instagram-wrapper">
                            ${news.instagram_embed_code}
                        </div>
                    </div>
                </div>
            `;
        } else {
            instagramPreview = `
                <div class="instagram-preview">
                    <p class="instagram-note">📷 Instagram投稿（読み込みエラー）</p>
                </div>
            `;
        }
    }
    
    // ニュースプレビューのHTMLを返す
    return `
        <div class="news-preview">
            <div class="news-preview-header">
                <h3 class="news-preview-title">${escapeHtml(news.title)}</h3>
                <span class="news-preview-date">${formattedDate}</span>
            </div>
            
            <div class="news-preview-content">
                <p>${escapeHtml(shortContent)}</p>
                ${instagramPreview}
            </div>
            
            <div class="news-preview-footer">
                <a href="news.html" class="read-more-link">続きを読む →</a>
            </div>
        </div>
    `;
}

// 日付をフォーマットする関数（YYYY-MM-DD形式に変換）
function formatDate(dateString) {
    const date = new Date(dateString);
    
    // 日付が無効な場合の処理
    if (isNaN(date.getTime())) {
        return '日付不明';
    }
    
    // YYYY-MM-DD形式でフォーマット
    return date.getFullYear() + '-' + 
           String(date.getMonth() + 1).padStart(2, '0') + '-' + 
           String(date.getDate()).padStart(2, '0');
}

// HTMLタグをエスケープする関数（XSS対策）
function escapeHtml(text) {
    if (!text) return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// インスタグラム埋め込みコードが有効かチェックする関数
function isValidInstagramEmbed(embedCode) {
    // 基本的なバリデーション：instagram-mediaクラスが含まれているかチェック
    return embedCode.includes('instagram-media') || 
           embedCode.includes('instagram.com/p/') ||
           embedCode.includes('instagram.com/reel/');
}

// インスタグラム埋め込みを初期化する関数（改良版）
function initializeInstagramEmbeds() {
    // インスタグラムの埋め込みスクリプトが既に読み込まれているかチェック
    if (window.instgrm) {
        // 既に読み込まれている場合は埋め込みを再処理
        try {
            window.instgrm.Embeds.process();
            console.log('Instagram埋め込みを再処理しました');
        } catch (error) {
            console.warn('Instagram埋め込みの再処理でエラー:', error);
            loadInstagramScript();
        }
    } else {
        // インスタグラムの埋め込みスクリプトを動的に読み込み
        loadInstagramScript();
    }
}

// インスタグラムスクリプトを読み込む関数
function loadInstagramScript() {
    // 既存のスクリプトタグがないかチェック
    if (document.querySelector('script[src*="instagram.com/embed.js"]')) {
        console.log('Instagramスクリプトは既に読み込まれています');
        return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://www.instagram.com/embed.js';
    script.async = true;
    script.defer = true; // 非同期読み込みを確実に
    
    // スクリプト読み込み完了後に埋め込みを処理
    script.onload = function() {
        console.log('Instagramスクリプトが読み込まれました');
        if (window.instgrm) {
            try {
                window.instgrm.Embeds.process();
                console.log('Instagram埋め込みの処理が完了しました');
            } catch (error) {
                console.error('Instagram埋め込み処理でエラー:', error);
            }
        }
    };
    
    // スクリプト読み込みエラー時の処理
    script.onerror = function() {
        console.error('Instagramスクリプトの読み込みに失敗しました');
        // エラー表示を更新
        const errorElements = document.querySelectorAll('[data-instagram-post="true"]');
        errorElements.forEach(element => {
            element.innerHTML = `
                <div class="instagram-embed-error">
                    <p>⚠️ Instagram投稿の読み込みに失敗しました</p>
                    <p class="error-detail">ネットワーク接続を確認してページを再読み込みしてください</p>
                </div>
            `;
        });
    };
    
    document.head.appendChild(script);
}
// 埋め込みスクリプトが既に読み込まれているかチェック
    if (window.instgrm) {
        // 既に読み込まれている場合は埋め込みを再処理
        window.instgrm.Embeds.process();
    } else {
        // インスタグラムの埋め込みスクリプトを動的に読み込み
        const script = document.createElement('script');
        script.src = 'https://www.instagram.com/embed.js';
        script.async = true;
        
        // スクリプト読み込み完了後に埋め込みを処理
        script.onload = function() {
            if (window.instgrm) {
                window.instgrm.Embeds.process();
            }
        };
        
        document.head.appendChild(script);
    }

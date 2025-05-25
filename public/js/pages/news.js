// お知らせページ用JavaScript - APIからデータを取得して表示

// DOMContentLoaded*イベント：ページのHTMLが読み込み完了した時に実行
document.addEventListener('DOMContentLoaded', function() {
    // お知らせ一覧を読み込む関数を呼び出し
    loadNewsList();
});

// お知らせ一覧をAPIから取得して表示する関数
async function loadNewsList() {
    try {
        // 読み込み中表示を見つける
        const loadingElement = document.querySelector('.loading');
        
        // APIエンドポイント*からお知らせデータを取得
        const response = await fetch('/api/news');
        
        // レスポンスが正常でない場合はエラーを投げる
        if (!response.ok) {
            throw new Error('ニュースの取得に失敗しました');
        }
        
        // JSONデータ*として解析
        const newsData = await response.json();
        
        // お知らせコンテナ要素を取得
        const newsContainer = document.querySelector('.news-container');
        
        // 読み込み中表示を削除
        if (loadingElement) {
            loadingElement.remove();
        }
        
        // ニュースデータが空の場合
        if (newsData.length === 0) {
            newsContainer.innerHTML = '<p class="no-news">現在お知らせはありません。</p>';
            return;
        }
        
        // 各ニュース記事のHTMLを生成
        const newsHTML = newsData.map(news => createNewsCard(news)).join('');
        
        // 生成したHTMLをコンテナに挿入
        newsContainer.innerHTML = newsHTML;
        
        // インスタグラム埋め込みの初期化を実行
        initializeInstagramEmbeds();
        
    } catch (error) {
        console.error('ニュース読み込みエラー:', error);
        
        // エラー時の表示
        const newsContainer = document.querySelector('.news-container');
        newsContainer.innerHTML = '<p class="error-message">お知らせの読み込み中にエラーが発生しました。</p>';
    }
}

// 個別のニュースカードHTMLを生成する関数
function createNewsCard(news) {
    // 日付をフォーマット（YYYY-MM-DD形式に変換）
    const formattedDate = formatDate(news.created_at);
    
    // 記事本文の処理（HTMLタグのエスケープ*）
    const safeContent = escapeHtml(news.content);
    
    // インスタグラム埋め込みコードの処理
    let instagramEmbed = '';
    if (news.instagram_embed_code && news.instagram_embed_code.trim()) {
        // 埋め込みコードが有効かチェック
        if (isValidInstagramEmbed(news.instagram_embed_code)) {
            instagramEmbed = `
                <div class="instagram-embed" data-instagram-post="true">
                    <div class="instagram-wrapper">
                        ${news.instagram_embed_code}
                    </div>
                    <p class="instagram-caption">📷 Instagram投稿</p>
                </div>
            `;
        } else {
            // 無効な埋め込みコードの場合は警告を表示
            instagramEmbed = `
                <div class="instagram-embed-error">
                    <p>⚠️ Instagram投稿の読み込みに失敗しました</p>
                </div>
            `;
        }
    }
    
    // 作成者情報の処理
    const authorName = news.author ? 
        (news.author.full_name || news.author.username) : 
        '管理者';
    
    // ニュースカードのHTMLを返す
    return `
        <article class="news-card">
            <div class="news-header">
                <h3 class="news-title">${escapeHtml(news.title)}</h3>
                <div class="news-meta">
                    <span class="news-date">${formattedDate}</span>
                    <span class="news-author">投稿者: ${escapeHtml(authorName)}</span>
                </div>
            </div>
            
            <div class="news-content">
                <p>${safeContent}</p>
                ${instagramEmbed}
            </div>
        </article>
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

// HTMLタグをエスケープする関数（XSS対策*）
function escapeHtml(text) {
    if (!text) return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// インスタグラム埋め込みコードが有効かチェックする関数
function isValidInstagramEmbed(embedCode) {
    // 基本的なバリデーション*：instagram-mediaクラスが含まれているかチェック
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

/* 
用語解説:
- DOMContentLoadedイベント: HTMLの読み込みが完了した時に発生するイベント
- APIエンドポイント: サーバーサイドでデータを提供するURL
- JSONデータ: JavaScript Object Notationの略、データ交換形式
- HTMLタグのエスケープ: <や>などの特殊文字を安全な形式に変換すること
- サニタイズ: 悪意のあるコードを除去してデータを安全にすること
- XSS対策: Cross-Site Scriptingという攻撃手法への対策
*/
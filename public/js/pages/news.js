// お知らせページ用JavaScript - APIからデータを取得して表示（Instagram画像表示修正版）

// DOMContentLoadedイベント：ページのHTMLが読み込み完了した時に実行
document.addEventListener('DOMContentLoaded', function() {
    console.log('ページ読み込み完了 - ニュース一覧読み込み開始');
    loadNewsList();
});

// お知らせ一覧をAPIから取得して表示する関数
async function loadNewsList() {
    try {
        // 読み込み中表示を見つける
        const loadingElement = document.querySelector('.loading');
        
        // APIエンドポイントからお知らせデータを取得
        const response = await fetch('/api/news');
        
        // レスポンスが正常でない場合はエラーを投げる
        if (!response.ok) {
            throw new Error('ニュースの取得に失敗しました');
        }
        
        // JSONデータとして解析
        const newsData = await response.json();
        console.log('取得したニュースデータ:', newsData);
        
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
        
        // Instagram埋め込みの初期化を実行（少し遅延させる）
        setTimeout(() => {
            initializeInstagramEmbeds();
        }, 500);
        
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
    
    // 記事本文の処理（HTMLタグのエスケープ）
    const safeContent = escapeHtml(news.content);
    
    // Instagram埋め込みコードの処理
    let instagramEmbed = '';
    if (news.instagram_embed_code && news.instagram_embed_code.trim()) {
        console.log('Instagram埋め込みコード検出:', news.title);
        
        // 埋め込みコードが有効かチェック
        if (isValidInstagramEmbed(news.instagram_embed_code)) {
            instagramEmbed = `
                <div class="news-instagram-embed" data-instagram-post="true">
                    <div class="instagram-wrapper">
                        ${cleanInstagramEmbedCode(news.instagram_embed_code)}
                    </div>
                </div>
            `;
        } else {
            // 無効な埋め込みコードの場合は警告を表示
            instagramEmbed = `
                <div class="instagram-embed-error">
                    <p>⚠️ Instagram投稿の読み込みに失敗しました</p>
                    <p class="error-detail">埋め込みコードが無効です</p>
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

// Instagram埋め込みコードをクリーンアップする関数
function cleanInstagramEmbedCode(embedCode) {
    // 重複するscriptタグを除去（JavaScriptは別途読み込むため）
    return embedCode.replace(/<script[^>]*src[^>]*instagram\.com\/embed\.js[^>]*><\/script>/gi, '');
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

// Instagram埋め込みコードが有効かチェックする関数
function isValidInstagramEmbed(embedCode) {
    // 基本的なバリデーション
    return embedCode.includes('instagram-media') || 
           embedCode.includes('instagram.com/p/') ||
           embedCode.includes('instagram.com/reel/');
}

// Instagram埋め込みを初期化する関数（改良版）
function initializeInstagramEmbeds() {
    console.log('Instagram埋め込み初期化開始');
    
    // 既存のInstagramスクリプトを除去
    const existingScripts = document.querySelectorAll('script[src*="instagram.com/embed.js"]');
    existingScripts.forEach(script => {
        script.remove();
        console.log('既存のInstagramスクリプトを除去しました');
    });
    
    // window.instgrmをリセット
    if (window.instgrm) {
        delete window.instgrm;
        console.log('Instagram埋め込みオブジェクトをリセットしました');
    }
    
    // 新しいスクリプトを読み込み
    loadInstagramScript();
}

// Instagramスクリプトを読み込む関数
function loadInstagramScript() {
    // 既存のスクリプトタグがないかチェック
    if (document.querySelector('script[src*="instagram.com/embed.js"]')) {
        console.log('Instagramスクリプトは既に読み込まれています');
        return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://www.instagram.com/embed.js';
    script.async = true;
    script.defer = true;
    
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
- XSS対策: Cross-Site Scriptingという攻撃手法への対策
- バリデーション: データが正しい形式や条件を満たしているかチェックすること
*/
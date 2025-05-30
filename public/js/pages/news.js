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
        
        // APIのベースURLを環境に応じて設定
        const baseUrl = window.location.hostname === 'localhost' ? '' : '/api';
        
        // APIエンドポイントからお知らせデータを取得
        const response = await fetch(`${baseUrl}/api/news`);
        
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
            // ユニークIDを生成
            const uniqueId = 'instagram-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            
            instagramEmbed = `
                <div class="instagram-embed" data-instagram-post="true" id="${uniqueId}">
                    <div class="instagram-loading">
                        <span>📷 Instagram投稿を読み込み中...</span>
                    </div>
                    <div class="instagram-wrapper" style="display: none;">
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
    let cleanCode = embedCode.replace(/<script[^>]*src[^>]*instagram\.com\/embed\.js[^>]*><\/script>/gi, '');
    
    // data-instgrm-captioned属性を追加（画像表示を改善）
    cleanCode = cleanCode.replace(
        /class="instagram-media"/gi, 
        'class="instagram-media" data-instgrm-captioned'
    );
    
    return cleanCode;
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
    const checks = [
        embedCode.includes('instagram-media'),
        embedCode.includes('instagram.com/p/') || embedCode.includes('instagram.com/reel/'),
        embedCode.includes('data-instgrm-permalink')
    ];
    
    const isValid = checks.filter(check => check).length >= 2;
    console.log('Instagram埋め込みコード検証:', { isValid, checks });
    
    return isValid;
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
    console.log('Instagramスクリプト読み込み開始');
    
    const script = document.createElement('script');
    script.src = 'https://www.instagram.com/embed.js';
    script.async = true;
    script.defer = true;
    
    script.onload = function() {
        console.log('Instagramスクリプト読み込み完了');
        
        // スクリプト読み込み後に少し待ってから処理実行
        setTimeout(() => {
            processInstagramEmbeds();
        }, 1000);
    };
    
    script.onerror = function(error) {
        console.error('Instagramスクリプト読み込みエラー:', error);
        showInstagramError();
    };
    
    document.head.appendChild(script);
}

// Instagram埋め込み処理実行
function processInstagramEmbeds() {
    console.log('Instagram埋め込み処理開始');
    
    if (!window.instgrm || !window.instgrm.Embeds) {
        console.error('Instagram埋め込みオブジェクトが利用できません');
        showInstagramError();
        return;
    }
    
    try {
        // 各Instagram埋め込み要素を個別に処理
        const instagramElements = document.querySelectorAll('[data-instagram-post="true"]');
        console.log('処理対象のInstagram要素数:', instagramElements.length);
        
        instagramElements.forEach((element, index) => {
            const loadingElement = element.querySelector('.instagram-loading');
            const wrapperElement = element.querySelector('.instagram-wrapper');
            
            if (loadingElement && wrapperElement) {
                // 読み込み中表示を隠して、実際のコンテンツを表示
                setTimeout(() => {
                    loadingElement.style.display = 'none';
                    wrapperElement.style.display = 'block';
                    
                    console.log(`Instagram要素${index + 1}を表示しました`);
                }, index * 200); // 各要素を200ms間隔で表示
            }
        });
        
        // Instagram埋め込み処理を実行
        window.instgrm.Embeds.process();
        console.log('Instagram埋め込み処理が完了しました');
        
        // 処理完了後に再度確認
        setTimeout(() => {
            checkInstagramProcessing();
        }, 3000); // 3秒後に確認
        
    } catch (error) {
        console.error('Instagram埋め込み処理でエラー:', error);
        showInstagramError();
    }
}

// Instagram処理結果を確認
function checkInstagramProcessing() {
    const instagramElements = document.querySelectorAll('[data-instagram-post="true"]');
    
    instagramElements.forEach((element, index) => {
        const iframe = element.querySelector('iframe');
        const blockquote = element.querySelector('blockquote.instagram-media');
        
        console.log(`Instagram要素${index + 1}:`, {
            hasIframe: !!iframe,
            hasBlockquote: !!blockquote
        });
        
        // iframeが生成されていない場合の対処
        if (blockquote && !iframe) {
            console.warn(`Instagram要素${index + 1}でiframeが生成されていません - 再処理を試行`);
            
            setTimeout(() => {
                if (window.instgrm && window.instgrm.Embeds) {
                    window.instgrm.Embeds.process();
                }
            }, 1000);
        }
    });
}

// エラー表示
function showInstagramError() {
    const errorElements = document.querySelectorAll('[data-instagram-post="true"]');
    errorElements.forEach(element => {
        element.innerHTML = `
            <div class="instagram-embed-error">
                <p>⚠️ Instagram投稿の読み込みに失敗しました</p>
                <p class="error-detail">ネットワーク接続を確認してページを再読み込みしてください</p>
                <button onclick="location.reload()" class="retry-button" style="background-color: #0611e3; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 10px;">再読み込み</button>
            </div>
        `;
    });
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
// お知らせページ用JavaScript - APIからデータを取得して表示（Instagram画像表示修正版）

// DOMContentLoadedイベント：ページのHTMLが読み込み完了した時に実行
document.addEventListener('DOMContentLoaded', function() {
    console.log('ページ読み込み完了 - ニュース一覧読み込み開始');
    loadNewsList();
});

// お知らせ一覧をAPIから取得して表示する関数
async function loadNewsList() {
    try {
        // 共通ユーティリティを使用して読み込み中表示を削除
        if (window.commonUtils) {
            window.commonUtils.removeLoading();
        } else {
            const loadingElement = document.querySelector('.loading');
            if (loadingElement) {
                loadingElement.remove();
            }
        }
        
        // 共通ユーティリティを使用してAPIからデータを取得
        const newsData = await (window.commonUtils ? 
            window.commonUtils.fetchData('/api/news') : 
            fetch('/api/news').then(response => {
                if (!response.ok) throw new Error('ニュースの取得に失敗しました');
                return response.json();
            })
        );
        console.log('取得したニュースデータ:', newsData);
        
        // お知らせコンテナ要素を取得
        const newsContainer = document.querySelector('.news-container');
        
        // ニュースデータが空の場合
        if (newsData.length === 0) {
            newsContainer.innerHTML = '<p class="no-news">現在お知らせはありません。</p>';
            return;
        }
        
        // 各ニュース記事のHTMLを生成
        const newsHTML = newsData.map(news => createNewsCard(news)).join('');
        
        // 生成したHTMLをコンテナに挿入
        newsContainer.innerHTML = newsHTML;
        
        // 共通Instagramマネージャーを使用して埋め込みを初期化（少し遅延させる）
        setTimeout(() => {
            if (window.instagramManager) {
                window.instagramManager.initializeEmbeds();
            } else {
                initializeInstagramEmbeds();
            }
        }, 500);
        
    } catch (error) {
        console.error('ニュース読み込みエラー:', error);
        
        // 共通ユーティリティを使用してエラー表示
        if (window.commonUtils) {
            window.commonUtils.showError('お知らせの読み込み中にエラーが発生しました。', '.news-container');
        } else {
            const newsContainer = document.querySelector('.news-container');
            newsContainer.innerHTML = '<p class="error-message">お知らせの読み込み中にエラーが発生しました。</p>';
        }
    }
}

// 個別のニュースカードHTMLを生成する関数
function createNewsCard(news) {
    // 共通ユーティリティを使用して日付をフォーマット
    const formattedDate = window.commonUtils ? 
        window.commonUtils.formatDate(news.created_at) : 
        formatDate(news.created_at);
    
    // 共通ユーティリティを使用してHTMLエスケープ
    const escapeFunction = window.commonUtils ? 
        window.commonUtils.escapeHtml : 
        escapeHtml;
    
    // 記事本文の処理（HTMLタグのエスケープ）
    const safeContent = escapeFunction(news.content);
    
    // Instagram埋め込みコードの処理
    let instagramEmbed = '';
    if (news.instagram_embed_code && news.instagram_embed_code.trim()) {
        console.log('Instagram埋め込みコード検出:', news.title);
        
        // 共通Instagramマネージャーを使用して埋め込みコードをチェック
        const isValidEmbed = window.instagramManager ? 
            window.instagramManager.constructor.isValidEmbed(news.instagram_embed_code) : 
            isValidInstagramEmbed(news.instagram_embed_code);
        
        if (isValidEmbed) {
            const cleanCode = window.instagramManager ? 
                window.instagramManager.constructor.cleanEmbedCode(news.instagram_embed_code) : 
                cleanInstagramEmbedCode(news.instagram_embed_code);
            
            instagramEmbed = `
                <div class="news-instagram-embed" data-instagram-post="true">
                    <div class="instagram-wrapper">
                        ${cleanCode}
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
                <h3 class="news-title">${escapeFunction(news.title)}</h3>
                <div class="news-meta">
                    <span class="news-date">${formattedDate}</span>
                    <span class="news-author">投稿者: ${escapeFunction(authorName)}</span>
                </div>
            </div>
            
            <div class="news-content">
                <p>${safeContent}</p>
                ${instagramEmbed}
            </div>
        </article>
    `;
}

// フォールバック用の関数（共通ユーティリティが読み込まれていない場合）
function cleanInstagramEmbedCode(embedCode) {
    if (window.instagramManager) {
        return window.instagramManager.constructor.cleanEmbedCode(embedCode);
    }
    return embedCode.replace(/<script[^>]*src[^>]*instagram\.com\/embed\.js[^>]*><\/script>/gi, '');
}

function formatDate(dateString) {
    if (window.commonUtils) {
        return window.commonUtils.formatDate(dateString);
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '日付不明';
    return date.getFullYear() + '-' + 
           String(date.getMonth() + 1).padStart(2, '0') + '-' + 
           String(date.getDate()).padStart(2, '0');
}

function escapeHtml(text) {
    if (window.commonUtils) {
        return window.commonUtils.escapeHtml(text);
    }
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function isValidInstagramEmbed(embedCode) {
    if (window.instagramManager) {
        return window.instagramManager.constructor.isValidEmbed(embedCode);
    }
    return embedCode.includes('instagram-media') || 
           embedCode.includes('instagram.com/p/') ||
           embedCode.includes('instagram.com/reel/');
}

// フォールバック用のInstagram埋め込み初期化関数
function initializeInstagramEmbeds() {
    if (window.instagramManager) {
        window.instagramManager.initializeEmbeds();
    } else {
        // 簡易版のフォールバック処理
        console.log('Instagram埋め込み初期化開始（フォールバック）');
        
        const existingScripts = document.querySelectorAll('script[src*="instagram.com/embed.js"]');
        existingScripts.forEach(script => script.remove());
        
        if (window.instgrm) {
            delete window.instgrm;
        }
        
        const script = document.createElement('script');
        script.src = 'https://www.instagram.com/embed.js';
        script.async = true;
        script.onload = function() {
            if (window.instgrm) {
                try {
                    window.instgrm.Embeds.process();
                } catch (error) {
                    console.error('Instagram埋め込み処理でエラー:', error);
                }
            }
        };
        document.head.appendChild(script);
    }
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
// ホームページ用JavaScript - 最新のお知らせを表示

// DOMContentLoadedイベント：ページのHTMLが読み込み完了した時に実行
document.addEventListener('DOMContentLoaded', function() {
    // 最新お知らせを読み込む関数を呼び出し
    loadLatestNews();
});

// 最新のお知らせをAPIから取得して表示する関数
async function loadLatestNews() {
    try {
        // 共通ユーティリティを使用してAPIからデータを取得
        const newsData = await (window.commonUtils ? 
            window.commonUtils.fetchData('/api/news') : 
            fetch('/api/news').then(response => {
                if (!response.ok) throw new Error('ニュースの取得に失敗しました');
                return response.json();
            })
        );
        
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
        
        // 共通Instagramマネージャーを使用して埋め込みを初期化
        if (window.instagramManager) {
            window.instagramManager.initializeEmbeds();
        } else {
            initializeInstagramEmbeds();
        }
        
    } catch (error) {
        console.error('ニュース読み込みエラー:', error);
        
        // 共通ユーティリティを使用してエラー表示
        if (window.commonUtils) {
            window.commonUtils.showError('お知らせの読み込み中にエラーが発生しました。', '.news-section .news-container');
        } else {
            const newsContainer = document.querySelector('.news-section .news-container');
            newsContainer.innerHTML = '<p class="error-message">お知らせの読み込み中にエラーが発生しました。</p>';
        }
    }
}

// ホームページ用のニュースプレビューHTMLを生成する関数
function createNewsPreview(news) {
    // 共通ユーティリティを使用して日付をフォーマット
    const formattedDate = window.commonUtils ? 
        window.commonUtils.formatDate(news.created_at) : 
        formatDate(news.created_at);
    
    // 記事本文を短縮表示（150文字まで）
    const shortContent = news.content.length > 150 ? 
        news.content.substring(0, 150) + '...' : 
        news.content;
    
    // インスタグラム埋め込みがある場合のプレビュー表示
    let instagramPreview = '';
    if (news.instagram_embed_code && news.instagram_embed_code.trim()) {
        // ホームページでは簡単なプレビューのみ表示
        if (window.instagramManager ? 
            window.instagramManager.constructor.isValidEmbed(news.instagram_embed_code) : 
            isValidInstagramEmbed(news.instagram_embed_code)) {
            instagramPreview = `
                <div class="instagram-preview">
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
    
    // 共通ユーティリティを使用してHTMLエスケープ
    const escapeFunction = window.commonUtils ? 
        window.commonUtils.escapeHtml : 
        escapeHtml;
    
    // ニュースプレビューのHTMLを返す
    return `
        <div class="news-preview">
            <div class="news-preview-header">
                <h3 class="news-preview-title">${escapeFunction(news.title)}</h3>
                <span class="news-preview-date">${formattedDate}</span>
            </div>
            
            <div class="news-preview-content">
                <p>${escapeFunction(shortContent)}</p>
                ${instagramPreview}
            </div>
            
            <div class="news-preview-footer">
                <a href="news.html" class="read-more-link">続きを読む →</a>
            </div>
        </div>
    `;
}

// フォールバック用の関数（共通ユーティリティが読み込まれていない場合）
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
        if (window.instgrm) {
            try {
                window.instgrm.Embeds.process();
            } catch (error) {
                console.warn('Instagram埋め込みの再処理でエラー:', error);
            }
        } else {
            const script = document.createElement('script');
            script.src = 'https://www.instagram.com/embed.js';
            script.async = true;
            script.onload = function() {
                if (window.instgrm) {
                    window.instgrm.Embeds.process();
                }
            };
            document.head.appendChild(script);
        }
    }
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

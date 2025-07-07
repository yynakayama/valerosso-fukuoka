/**
 * Instagram埋め込み管理クラス
 * 複数ページで使用されるInstagram埋め込み機能を統合管理
 */
class InstagramManager {
    constructor() {
        this.isScriptLoaded = false;
        this.isProcessing = false;
    }

    /**
     * Instagram埋め込みを初期化
     * @param {number} delay - 初期化までの遅延時間（ミリ秒）
     */
    async initializeEmbeds(delay = 0) {
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        console.log('Instagram埋め込み初期化開始');
        
        // 既存のスクリプトをクリーンアップ
        this.cleanupExistingScripts();
        
        // 新しいスクリプトを読み込み
        await this.loadScript();
    }

    /**
     * 既存のInstagramスクリプトをクリーンアップ
     */
    cleanupExistingScripts() {
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
    }

    /**
     * Instagramスクリプトを読み込み
     */
    async loadScript() {
        // 既に読み込み済みかチェック
        if (document.querySelector('script[src*="instagram.com/embed.js"]')) {
            console.log('Instagramスクリプトは既に読み込まれています');
            this.processEmbeds();
            return;
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://www.instagram.com/embed.js';
            script.async = true;
            script.defer = true;

            script.onload = () => {
                console.log('Instagramスクリプトが読み込まれました');
                this.isScriptLoaded = true;
                this.processEmbeds();
                resolve();
            };

            script.onerror = () => {
                console.error('Instagramスクリプトの読み込みに失敗しました');
                this.showErrorMessages();
                reject(new Error('Instagram script load failed'));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * 埋め込み処理を実行
     */
    processEmbeds() {
        if (window.instgrm && !this.isProcessing) {
            try {
                this.isProcessing = true;
                window.instgrm.Embeds.process();
                console.log('Instagram埋め込みの処理が完了しました');
            } catch (error) {
                console.error('Instagram埋め込み処理でエラー:', error);
                this.showErrorMessages();
            } finally {
                this.isProcessing = false;
            }
        }
    }

    /**
     * エラーメッセージを表示
     */
    showErrorMessages() {
        const errorElements = document.querySelectorAll('[data-instagram-post="true"]');
        errorElements.forEach(element => {
            element.innerHTML = `
                <div class="instagram-embed-error">
                    <p>⚠️ Instagram投稿の読み込みに失敗しました</p>
                    <p class="error-detail">ネットワーク接続を確認してページを再読み込みしてください</p>
                </div>
            `;
        });
    }

    /**
     * 埋め込みコードが有効かチェック
     * @param {string} embedCode - 埋め込みコード
     * @returns {boolean} 有効かどうか
     */
    static isValidEmbed(embedCode) {
        return embedCode.includes('instagram-media') || 
               embedCode.includes('instagram.com/p/') ||
               embedCode.includes('instagram.com/reel/');
    }

    /**
     * 埋め込みコードをクリーンアップ
     * @param {string} embedCode - 埋め込みコード
     * @returns {string} クリーンアップされたコード
     */
    static cleanEmbedCode(embedCode) {
        // 重複するscriptタグを除去（JavaScriptは別途読み込むため）
        return embedCode.replace(/<script[^>]*src[^>]*instagram\.com\/embed\.js[^>]*><\/script>/gi, '');
    }
}

// グローバルインスタンスを作成
window.instagramManager = new InstagramManager(); 
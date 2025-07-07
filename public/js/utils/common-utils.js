/**
 * 共通ユーティリティ関数
 * 複数ページで使用される共通機能を統合管理
 */
class CommonUtils {
    /**
     * 日付をフォーマット（YYYY-MM-DD形式に変換）
     * @param {string} dateString - 日付文字列
     * @returns {string} フォーマットされた日付
     */
    static formatDate(dateString) {
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

    /**
     * HTMLタグをエスケープする関数（XSS対策）
     * @param {string} text - エスケープするテキスト
     * @returns {string} エスケープされたテキスト
     */
    static escapeHtml(text) {
        if (!text) return '';
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * メールアドレスの形式チェック
     * @param {string} email - チェックするメールアドレス
     * @returns {boolean} 有効かどうか
     */
    static isValidEmail(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    }

    /**
     * 電話番号の形式チェック（数字とハイフンのみ）
     * @param {string} phone - チェックする電話番号
     * @returns {boolean} 有効かどうか
     */
    static isValidPhone(phone) {
        const phonePattern = /^[0-9\-]+$/;
        return phonePattern.test(phone);
    }

    /**
     * 著作権年を更新
     */
    static updateCopyrightYear() {
        const copyrightElements = document.querySelectorAll('.copyright-year');
        const currentYear = new Date().getFullYear();
        
        copyrightElements.forEach(element => {
            element.textContent = currentYear;
        });
    }

    /**
     * APIからデータを取得する共通関数
     * @param {string} endpoint - APIエンドポイント
     * @returns {Promise<Object>} 取得したデータ
     */
    static async fetchData(endpoint) {
        try {
            const response = await fetch(endpoint);
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API fetch error:', error);
            throw error;
        }
    }

    /**
     * エラーメッセージを表示
     * @param {string} message - エラーメッセージ
     * @param {string} containerSelector - 表示先のセレクタ
     */
    static showError(message, containerSelector) {
        const container = document.querySelector(containerSelector);
        if (container) {
            container.innerHTML = `<p class="error-message">${message}</p>`;
        }
    }

    /**
     * 読み込み中表示を削除
     * @param {string} selector - 読み込み中要素のセレクタ
     */
    static removeLoading(selector = '.loading') {
        const loadingElement = document.querySelector(selector);
        if (loadingElement) {
            loadingElement.remove();
        }
    }
}

// グローバルインスタンスを作成
window.commonUtils = CommonUtils; 
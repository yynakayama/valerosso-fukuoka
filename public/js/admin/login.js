// login.js - 管理者ログイン処理を担当するJavaScript

/**
 * DOMが完全に読み込まれたときに実行される関数
 * ログインフォームのイベントリスナーを設定する
 */
document.addEventListener('DOMContentLoaded', function() {
    // ログインフォーム要素を取得
    const loginForm = document.getElementById('login-form');
    // エラーメッセージ表示領域を取得
    const loginError = document.getElementById('login-error');
    
    // セッションをチェックして既にログインしているか確認
    checkSession();
    
    // ログインフォームの送信イベントにリスナーを追加
    loginForm.addEventListener('submit', function(event) {
        // フォームのデフォルト送信動作を停止
        event.preventDefault();
        
        // フォームからユーザー名とパスワードを取得
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // ログイン認証処理を実行
        authenticateUser(username, password);
    });
    
    /**
     * ユーザー認証を行う関数
     * @param {string} username - ユーザー名
     * @param {string} password - パスワード
     */
    function authenticateUser(username, password) {
        // 実際の環境では、ここでサーバーにリクエストを送信して認証を行う
        // このサンプルでは、シンプル化のためにフロントエンドだけで擬似的に認証します
        
        // 注意: 実際の実装では、ハードコードされた認証情報は使用せず、
        // サーバーサイドで適切に認証処理を行うべきです
        if (username === 'admin' && password === 'valerosso2024') {
            // 認証成功 - セッションに保存
            sessionStorage.setItem('isLoggedIn', 'true');
            // 管理パネルページにリダイレクト
            window.location.href = 'admin-panel.html';
        } else {
            // 認証失敗 - エラーメッセージを表示
            loginError.textContent = 'ユーザー名またはパスワードが正しくありません。';
            loginError.style.display = 'block';
        }
    }
    
    /**
     * セッションをチェックしてログイン状態を確認する関数
     */
    function checkSession() {
        // セッションストレージからログイン状態を確認
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        
        // ログイン済みの場合は管理パネルにリダイレクト
        if (isLoggedIn === 'true') {
            window.location.href = 'admin-panel.html';
        }
    }
});
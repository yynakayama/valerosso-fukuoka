// admin-panel.js - 管理者パネル画面の機能を実装するJavaScript

/**
 * DOMが完全に読み込まれたときに実行される関数
 */
document.addEventListener('DOMContentLoaded', function() {
    // セッションをチェックしてログイン状態を確認
    checkSession();
    
    // 要素の参照を取得
    const instagramPostForm = document.getElementById('instagram-post-form');
    const postMessage = document.getElementById('post-message');
    const newsList = document.getElementById('news-list');
    const btnLogout = document.getElementById('btn-logout');
    const btnRefresh = document.getElementById('btn-refresh');
    
    // ログアウトボタンのイベントリスナーを設定
    btnLogout.addEventListener('click', logout);
    
    // 更新ボタンのイベントリスナーを設定
    btnRefresh.addEventListener('click', loadNewsPosts);
    
    // 投稿フォームの送信イベントリスナーを設定
    instagramPostForm.addEventListener('submit', function(event) {
        // フォームのデフォルト送信動作を停止
        event.preventDefault();
        
        // フォームからデータを取得
        const title = document.getElementById('post-title').value;
        const embedCode = document.getElementById('instagram-embed-code').value;
        
        // 埋め込みコードの検証（基本的な検証のみ）
        if (!embedCode.includes('instagram-media')) {
            showMessage(postMessage, '有効なインスタグラム埋め込みコードを入力してください。', 'error');
            return;
        }
        
        // お知らせを保存
        saveNewsPost(title, embedCode);
    });
    
    // 初期表示時にお知らせ一覧を読み込む
    loadNewsPosts();
    
    /**
     * セッションをチェックしてログイン状態を確認する関数
     */
    function checkSession() {
        // セッションストレージからログイン状態を確認
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        
        // ログインしていない場合はログインページにリダイレクト
        if (isLoggedIn !== 'true') {
            window.location.href = 'admin-login.html';
        }
    }
    
    /**
     * ログアウト処理を行う関数
     */
    function logout() {
        // セッションストレージからログイン状態を削除
        sessionStorage.removeItem('isLoggedIn');
        // ログインページにリダイレクト
        window.location.href = 'admin-login.html';
    }
    
    /**
     * お知らせ投稿を保存する関数
     * @param {string} title - お知らせのタイトル
     * @param {string} embedCode - インスタグラム埋め込みコード
     */
    function saveNewsPost(title, embedCode) {
        // 現在の日時を取得
        const now = new Date();
        const dateStr = now.toISOString();
        
        // 新しい投稿オブジェクトを作成
        const newPost = {
            id: 'post_' + now.getTime(), // タイムスタンプをIDとして使用
            title: title,
            embedCode: embedCode,
            date: dateStr
        };
        
        // ローカルストレージから既存の投稿を取得
        let posts = JSON.parse(localStorage.getItem('newsPosts')) || [];
        
        // 新しい投稿を配列の先頭に追加（最新順にするため）
        posts.unshift(newPost);
        
        // ローカルストレージに保存
        localStorage.setItem('newsPosts', JSON.stringify(posts));
        
        // 成功メッセージを表示
        showMessage(postMessage, 'お知らせが正常に投稿されました！', 'success');
        
        // フォームをリセット
        instagramPostForm.reset();
        
        // お知らせ一覧を再読み込み
        loadNewsPosts();
    }
    
    /**
     * お知らせ投稿一覧を読み込む関数
     */
    function loadNewsPosts() {
        // ローディング表示
        newsList.innerHTML = '<div class="loading">読み込み中...</div>';
        
        // ローカルストレージから投稿を取得
        let posts = JSON.parse(localStorage.getItem('newsPosts')) || [];
        
        // 少し遅延を入れてローディング表示を確認できるようにする（実際の実装では不要）
        setTimeout(() => {
            // 投稿がない場合
            if (posts.length === 0) {
                newsList.innerHTML = '<div class="no-posts">投稿されたお知らせはありません。</div>';
                return;
            }
            
            // リストをクリア
            newsList.innerHTML = '';
            
            // 各投稿をリストに追加
            posts.forEach(post => {
                // 日付をフォーマット
                const date = new Date(post.date);
                const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
                
                // 投稿要素を作成
                const postElement = document.createElement('div');
                postElement.className = 'news-item';
                postElement.dataset.id = post.id;
                
                // 投稿の内容をHTMLで構成
                postElement.innerHTML = `
                    <div class="news-item-title">${post.title}</div>
                    <div class="news-item-date">${formattedDate}</div>
                    <div class="news-item-embed">${post.embedCode}</div>
                    <button class="btn-delete" data-id="${post.id}">削除</button>
                `;
                
                // リストに追加
                newsList.appendChild(postElement);
            });
            
            // インスタグラム埋め込みを処理（インスタグラムの埋め込みスクリプトを実行）
            if (window.instgrm) {
                window.instgrm.Embeds.process();
            }
            
            // 削除ボタンにイベントリスナーを設定
            document.querySelectorAll('.btn-delete').forEach(button => {
                button.addEventListener('click', function(event) {
                    const postId = event.target.dataset.id;
                    deleteNewsPost(postId);
                });
            });
        }, 500); // 500msの遅延（デモ用、実際の実装では不要）
    }
    
    /**
     * お知らせ投稿を削除する関数
     * @param {string} postId - 削除する投稿のID
     */
    function deleteNewsPost(postId) {
        // 確認ダイアログを表示
        if (confirm('このお知らせを削除してもよろしいですか？')) {
            // ローカルストレージから投稿を取得
            let posts = JSON.parse(localStorage.getItem('newsPosts')) || [];
            
            // 指定されたIDの投稿を除外
            posts = posts.filter(post => post.id !== postId);
            
            // 更新された投稿リストをローカルストレージに保存
            localStorage.setItem('newsPosts', JSON.stringify(posts));
            
            // 投稿一覧を再読み込み
            loadNewsPosts();
            
            // 成功メッセージを表示
            showMessage(postMessage, 'お知らせが削除されました。', 'success');
        }
    }
    
    /**
     * メッセージを表示する関数
     * @param {HTMLElement} element - メッセージを表示する要素
     * @param {string} message - 表示するメッセージ
     * @param {string} type - メッセージの種類（'success' または 'error'）
     */
    function showMessage(element, message, type) {
        // メッセージ要素にクラスとコンテンツを設定
        element.textContent = message;
        element.className = 'message ' + type;
        
        // メッセージを表示
        element.style.display = 'block';
        
        // 5秒後にメッセージを自動的に非表示にする
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
});

// インスタグラム埋め込みスクリプトを動的に読み込む
(function() {
    // スクリプト要素を作成
    const script = document.createElement('script');
    script.src = '//www.instagram.com/embed.js';
    script.async = true;
    script.defer = true;
    
    // bodyの最後に追加
    document.body.appendChild(script);
})();
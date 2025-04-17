// navigation.js - ナビゲーションメニューの動作を制御するJavaScript

/**
 * DOMが完全に読み込まれたときに実行される関数
 */
document.addEventListener('DOMContentLoaded', function() {
    // 要素への参照を取得
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const overlay = document.querySelector('.overlay');
    
    // ハンバーガーメニューがクリックされたときのイベントリスナー
    hamburger.addEventListener('click', toggleMenu);
    
    // オーバーレイがクリックされたときのイベントリスナー
    overlay.addEventListener('click', closeMenu);
    
    // ナビゲーションリンクがクリックされたときのイベントリスナー
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', closeMenu);
    });
    
    /**
     * メニューの表示/非表示を切り替える関数
     */
    function toggleMenu() {
        // ハンバーガーアイコンのアクティブ状態を切り替え
        hamburger.classList.toggle('active');
        // ナビゲーションメニューのアクティブ状態を切り替え
        navMenu.classList.toggle('active');
        // オーバーレイのアクティブ状態を切り替え
        overlay.classList.toggle('active');
        
        // メニューがアクティブになったらスクロールを無効化、非アクティブなら有効化
        if (navMenu.classList.contains('active')) {
            document.body.style.overflow = 'hidden'; // スクロール無効化
        } else {
            document.body.style.overflow = ''; // スクロール有効化
        }
    }
    
    /**
     * メニューを閉じる関数
     */
    function closeMenu() {
        // ハンバーガーアイコンのアクティブ状態を解除
        hamburger.classList.remove('active');
        // ナビゲーションメニューのアクティブ状態を解除
        navMenu.classList.remove('active');
        // オーバーレイのアクティブ状態を解除
        overlay.classList.remove('active');
        // スクロールを有効化
        document.body.style.overflow = '';
    }
    
    /**
     * ウィンドウがリサイズされたときにメニューを調整する
     * （デスクトップサイズになったらメニューを閉じる）
     */
    window.addEventListener('resize', function() {
        // ウィンドウの幅が768px以上（デスクトップ表示）になったらメニューを閉じる
        if (window.innerWidth >= 768) {
            closeMenu();
        }
    });
});
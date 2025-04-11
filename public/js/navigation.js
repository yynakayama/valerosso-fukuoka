/**
 * navigation.js
 * ハンバーガーメニューの動作を制御するJavaScript
 */

// DOMが完全に読み込まれた後に実行
document.addEventListener('DOMContentLoaded', function() {
    // 必要な要素を取得して変数に格納
    const hamburger = document.querySelector('.hamburger'); // ハンバーガーボタン
    const navMenu = document.querySelector('.nav-menu');    // ナビゲーションメニュー
    const overlay = document.querySelector('.overlay');     // オーバーレイ
    
    // ハンバーガーボタンのクリックイベントを設定
    hamburger.addEventListener('click', function() {
        // activeクラスを切り替え（付ける/外す）
        hamburger.classList.toggle('active');  // ボタンのアニメーション用
        navMenu.classList.toggle('active');    // メニューの表示/非表示
        overlay.classList.toggle('active');    // オーバーレイの表示/非表示
        
        // メニュー表示中は背景スクロールを防止
        if (navMenu.classList.contains('active')) {
            // メニューが表示されている場合、bodyのスクロールを無効化
            document.body.style.overflow = 'hidden';
        } else {
            // メニューが非表示の場合、bodyのスクロールを有効化（デフォルト）
            document.body.style.overflow = '';
        }
    });
    
    // オーバーレイ（背景の暗い部分）のクリックイベントを設定
    overlay.addEventListener('click', function() {
        // activeクラスを削除してメニューを閉じる
        hamburger.classList.remove('active');  // ボタンを元に戻す
        navMenu.classList.remove('active');    // メニューを非表示
        overlay.classList.remove('active');    // オーバーレイを非表示
        document.body.style.overflow = '';     // スクロールを有効化
    });
    
    // メニュー内の各リンクをクリックした時の処理
    const navLinks = document.querySelectorAll('.nav-menu a'); // メニュー内のすべてのリンクを取得
    // 各リンクに対してイベントリスナーを設定
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            // リンクをクリックしたらメニューを閉じる
            hamburger.classList.remove('active');  // ボタンを元に戻す
            navMenu.classList.remove('active');    // メニューを非表示
            overlay.classList.remove('active');    // オーバーレイを非表示
            document.body.style.overflow = '';     // スクロールを有効化
        });
    });
    
    // 現在のページをハイライト表示する
    // 現在のURLのパス部分を取得
    const currentPath = window.location.pathname;
    // ファイル名（最後の '/' 以降）を取得
    const currentPage = currentPath.substring(currentPath.lastIndexOf('/') + 1);
    
    // 各メニューリンクをチェックし、現在のページとURLが一致するリンクに 'current' クラスを追加
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref === currentPage || 
            (currentPage === '' && linkHref === 'index.html')) {
            link.classList.add('current');
        }
    });
});
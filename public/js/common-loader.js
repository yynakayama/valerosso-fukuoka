// common-loader.js - 共通パーツ読み込み＆ナビゲーション制御用JavaScript

class CommonLoader {
    constructor() {
        this.cache = new Map(); // キャッシュ機能※1
    }

    /**
     * 共通パーツを読み込んで指定要素に挿入する
     * @param {string} url - 読み込むHTMLファイルのパス
     * @param {string} targetSelector - 挿入先のCSSセレクタ※2
     * @param {Function} callback - 読み込み完了後のコールバック関数※3
     */
    async loadComponent(url, targetSelector, callback = null) {
        try {
            // キャッシュから取得を試行
            let html = this.cache.get(url);
            
            if (!html) {
                // キャッシュにない場合はfetchで取得
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to load ${url}: ${response.status}`);
                }
                html = await response.text();
                
                // キャッシュに保存
                this.cache.set(url, html);
            }
            
            // 指定された要素に挿入
            const targetElement = document.querySelector(targetSelector);
            if (targetElement) {
                targetElement.innerHTML = html;
                
                // コールバック関数があれば実行
                if (callback && typeof callback === 'function') {
                    callback();
                }
            } else {
                console.warn(`Target element not found: ${targetSelector}`);
            }
            
        } catch (error) {
            console.error('Error loading component:', error);
        }
    }

    /**
     * ヘッダーとフッターを一括読み込み
     * @param {string} currentPage - 現在のページ名（ナビゲーション用）
     */
    async loadHeaderAndFooter(currentPage = '') {
        // ヘッダー読み込み
        await this.loadComponent('header.html', 'header', () => {
            // ヘッダー読み込み後の処理
            this.initializeNavigation(currentPage);
        });
        
        // フッター読み込み
        await this.loadComponent('footer.html', 'footer', () => {
            // フッター読み込み後の処理
            this.updateCopyrightYear();
        });
    }

    /**
     * ナビゲーションの初期化（現在ページのハイライト）
     * @param {string} currentPage - 現在のページ名
     */
    initializeNavigation(currentPage) {
        if (!currentPage) return;
        
        // 現在のページに対応するナビゲーションリンクにcurrentクラスを追加
        const navLinks = document.querySelectorAll('.nav-menu a');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            // より柔軟なマッチング（ファイル名のみ、パス付き、相対パスなど）
            if (href === currentPage || 
                href === `./${currentPage}` || 
                href === currentPage.replace('.html', '') ||
                href === `./${currentPage.replace('.html', '')}` ||
                (currentPage === 'index.html' && href === 'index.html') ||
                (currentPage === 'index.html' && href === './index.html')) {
                link.classList.add('current');
            }
        });
        
        // ハンバーガーメニューの機能を初期化
        this.initializeHamburgerMenu();
    }

    /**
     * ハンバーガーメニューの初期化
     */
    initializeHamburgerMenu() {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        const overlay = document.querySelector('.overlay');
        
        if (hamburger && navMenu && overlay) {
            // 既存のイベントリスナーを削除（重複回避）
            hamburger.replaceWith(hamburger.cloneNode(true));
            overlay.replaceWith(overlay.cloneNode(true));
            
            // 再取得
            const newHamburger = document.querySelector('.hamburger');
            const newOverlay = document.querySelector('.overlay');
            
            // イベントリスナーを追加
            newHamburger.addEventListener('click', () => this.toggleMenu(newHamburger, navMenu, newOverlay));
            newOverlay.addEventListener('click', () => this.closeMenu(newHamburger, navMenu, newOverlay));
            
            // ナビゲーションリンククリック時にメニューを閉じる
            const navLinks = navMenu.querySelectorAll('a');
            navLinks.forEach(link => {
                link.addEventListener('click', () => this.closeMenu(newHamburger, navMenu, newOverlay));
            });
            
            // ウィンドウリサイズ時の処理を追加
            window.addEventListener('resize', () => {
                // デスクトップサイズ（768px以上）になったらメニューを閉じる
                if (window.innerWidth >= 768) {
                    this.closeMenu(newHamburger, navMenu, newOverlay);
                }
            });
        } else {
            console.warn('ハンバーガーメニューの要素が見つかりません:', {
                hamburger: !!hamburger,
                navMenu: !!navMenu, 
                overlay: !!overlay
            });
        }
    }

    /**
     * メニューの開閉切り替え
     */
    toggleMenu(hamburger, navMenu, overlay) {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        overlay.classList.toggle('active');
        
        // スクロール制御
        if (navMenu.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    /**
     * メニューを閉じる
     */
    closeMenu(hamburger, navMenu, overlay) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    /**
     * フッターの著作権年を更新
     */
    updateCopyrightYear() {
        const copyrightElements = document.querySelectorAll('.copyright-year');
        const currentYear = new Date().getFullYear();
        
        copyrightElements.forEach(element => {
            element.textContent = currentYear;
        });
    }

    /**
     * 既存の main.js の機能も統合
     * コピーライト年の更新を main.js から移植
     */
    initializeCommonFeatures() {
        // main.js の updateCopyrightYear 機能をここに統合済み
        // 他の共通機能があれば今後ここに追加
    }
}

// グローバルインスタンスを作成
const commonLoader = new CommonLoader();

// DOMContentLoaded時に自動実行
document.addEventListener('DOMContentLoaded', function() {
    // ページファイル名を取得（例: index.html, contact.html）
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // ヘッダーとフッターを読み込み
    commonLoader.loadHeaderAndFooter(currentPage);
});
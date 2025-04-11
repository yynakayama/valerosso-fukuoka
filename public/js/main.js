/**
 * main.js
 * すべてのページで共通して使用するJavaScript
 */

// DOMが完全に読み込まれた後に実行
document.addEventListener('DOMContentLoaded', function() {
    // ページ読み込み時の初期化処理
    console.log('Valerosso Fukuoka website loaded');
    
    // レスポンシブイメージの遅延読み込み設定
    if ('loading' in HTMLImageElement.prototype) {
        // ブラウザがネイティブの遅延読み込みをサポートしている場合
        const images = document.querySelectorAll('img[loading="lazy"]');
        images.forEach(img => {
            img.src = img.dataset.src;
        });
    } else {
        // 遅延読み込みをサポートしていない場合の代替策
        // ここに必要に応じてJavaScriptの遅延読み込みライブラリの実装を追加
    }
    
    // スムーススクロール機能
    // ページ内リンク（#で始まるリンク）をクリックした際に、
    // ページをスムーズにスクロールさせる
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return; // ハッシュのみの場合は何もしない
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // ターゲット要素の位置までスムーズにスクロール
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // 現在の年を自動的にフッターの著作権表示に挿入
    const currentYear = new Date().getFullYear();
    const copyrightElement = document.querySelector('.copyright-year');
    if (copyrightElement) {
        copyrightElement.textContent = currentYear;
    }
});
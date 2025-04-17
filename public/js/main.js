// main.js - すべてのページで共通して使用するJavaScript

/**
 * DOMが完全に読み込まれたときに実行される関数
 */
document.addEventListener('DOMContentLoaded', function() {
    // コピーライト年の更新
    updateCopyrightYear();
    
    /**
     * フッターのコピーライト年を現在の年に更新する関数
     */
    function updateCopyrightYear() {
        // すべてのcopyright-year要素を取得
        const copyrightYearElements = document.querySelectorAll('.copyright-year');
        
        // 現在の年を取得
        const currentYear = new Date().getFullYear();
        
        // 各要素のテキストを現在の年に更新
        copyrightYearElements.forEach(element => {
            element.textContent = currentYear;
        });
    }
});
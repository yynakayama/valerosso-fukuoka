document.addEventListener('DOMContentLoaded', function() {
    // 画像の遅延読み込み
    const images = document.querySelectorAll('.gallery-item img');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                observer.unobserve(img);
            }
        });
    });

    images.forEach(img => {
        img.dataset.src = img.src;
        img.src = '';
        imageObserver.observe(img);
    });

    // スマートフォンの場合は拡大表示を無効化
    if (window.innerWidth > 768) {
        // 画像クリック時の拡大表示機能
        const galleryItems = document.querySelectorAll('.gallery-item');
        
        galleryItems.forEach(item => {
            item.addEventListener('click', function() {
                const img = this.querySelector('img');
                const modal = document.createElement('div');
                modal.className = 'image-modal';
                
                modal.innerHTML = `
                    <div class="modal-content">
                        <img src="${img.src}" alt="${img.alt}">
                        <div class="modal-caption">${this.querySelector('.gallery-caption').textContent}</div>
                    </div>
                `;
                
                document.body.appendChild(modal);
                
                // ESCキーでモーダルを閉じる
                const closeModal = function() {
                    document.body.removeChild(modal);
                    document.removeEventListener('keydown', handleKeyPress);
                };
                
                const handleKeyPress = function(e) {
                    if (e.key === 'Escape') {
                        closeModal();
                    }
                };
                
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) {
                        closeModal();
                    }
                });
                
                document.addEventListener('keydown', handleKeyPress);
            });
        });
    }
}); 
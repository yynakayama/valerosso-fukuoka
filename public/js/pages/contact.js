/**
 * contact.js - お問い合わせページ固有のJavaScript
 * お問い合わせフォームの動的な表示・非表示の切り替えや
 * バリデーションを管理する
 */

// DOM(Document Object Model)の読み込みが完了したら実行
document.addEventListener('DOMContentLoaded', function() {
    // 必要な要素の取得
    const inquiryTypeSelect = document.getElementById('inquiry-type');
    const playerInfoFields = document.getElementById('player-info');
    const mediaInfoFields = document.getElementById('media-info');
    const contactForm = document.getElementById('contact-form');
    
    // 共通ユーティリティを使用して著作権年を更新
    if (window.commonUtils) {
        window.commonUtils.updateCopyrightYear();
    }
    
    // お問い合わせ種類の選択変更時のイベントリスナー
    inquiryTypeSelect.addEventListener('change', function() {
        const selectedValue = this.value;
        
        // すべての条件付きフィールドを非表示にする
        playerInfoFields.classList.add('hidden');
        mediaInfoFields.classList.add('hidden');
        
        // 選択肢に応じたフィールドを表示する
        if (selectedValue === 'one-day-trial' || selectedValue === 'join') {
            // 1日体験または入部希望の場合は選手情報を表示
            playerInfoFields.classList.remove('hidden');
            
            // このタイプの場合、必須フィールドのrequired属性を設定
            setRequiredAttributes(playerInfoFields, true);
            setRequiredAttributes(mediaInfoFields, false);
            
        } else if (selectedValue === 'media') {
            // 取材の場合はメディア情報を表示
            mediaInfoFields.classList.remove('hidden');
            
            // このタイプの場合、必須フィールドのrequired属性を設定
            setRequiredAttributes(mediaInfoFields, true);
            setRequiredAttributes(playerInfoFields, false);
            
        } else {
            // その他のお問い合わせの場合は追加フィールドを表示しない
            setRequiredAttributes(playerInfoFields, false);
            setRequiredAttributes(mediaInfoFields, false);
        }
    });
    
    // フォーム送信時のイベントリスナー
    contactForm.addEventListener('submit', async function(event) {
        event.preventDefault(); // デフォルトの送信動作をキャンセル
        
        // バリデーションを実行
        if (validateForm()) {
            try {
                // フォームデータの収集
                const formData = {
                    name: document.getElementById('name').value.trim(),
                    email: document.getElementById('email').value.trim(),
                    phone: document.getElementById('phone').value.trim(),
                    inquiryType: inquiryTypeSelect.value,
                    message: document.getElementById('message').value.trim()
                };

                // お問い合わせ種類に応じて追加情報を設定
                if (formData.inquiryType === 'one-day-trial' || formData.inquiryType === 'join') {
                    formData.grade = document.getElementById('grade').value;
                    formData.experience = document.getElementById('experience').value;
                    formData.position = document.getElementById('position').value;
                    formData.currentTeam = document.getElementById('current-team').value;
                    formData.preferredPlayerDate = document.getElementById('preferred-player-date').value;
                } else if (formData.inquiryType === 'media') {
                    formData.mediaName = document.getElementById('media-name').value;
                    formData.mediaType = document.getElementById('media-type').value;
                    formData.preferredDate = document.getElementById('preferred-date').value;
                }

                // APIにデータを送信
                const response = await fetch('/api/inquiries', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (response.ok) {
                    // 成功時の処理
                    alert('お問い合わせありがとうございます。担当者より折り返しご連絡いたします。');
                    
                    // フォームをリセット
                    contactForm.reset();
                    
                    // 条件付きフィールドを非表示に
                    playerInfoFields.classList.add('hidden');
                    mediaInfoFields.classList.add('hidden');
                } else {
                    // **修正点：サーバーからの具体的なエラーメッセージを表示**
                    // HTTPステータスコード別の処理
                    if (response.status === 429) {
                        // レート制限の場合
                        alert(result.message || 'リクエストが多すぎます。しばらく待ってから再試行してください。');
                    } else if (response.status === 400) {
                        // バリデーションエラーの場合
                        alert(result.message || '入力内容に問題があります。確認してください。');
                    } else if (response.status === 500) {
                        // サーバーエラーの場合
                        alert(result.message || 'サーバーでエラーが発生しました。しばらく経ってから再度お試しください。');
                    } else {
                        // その他のエラーの場合
                        alert(result.message || '送信に失敗しました。しばらく経ってから再度お試しください。');
                    }
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                alert('申し訳ありません。送信に失敗しました。しばらく経ってから再度お試しください。');
            }
        }
    });
    
    /**
     * フォーム内の特定の親要素内の必須フィールドのrequired属性を設定する関数
     * @param {HTMLElement} parentElement - 親要素
     * @param {boolean} isRequired - required属性を設定するかどうか
     */
    function setRequiredAttributes(parentElement, isRequired) {
        // 親要素内のすべてのinput, select, textareaを取得
        const fields = parentElement.querySelectorAll('input, select, textarea');
        
        // 各フィールドに対してrequired属性を設定または削除
        fields.forEach(field => {
            // 必須マークを持つフィールドのみ処理（任意項目は変更しない）
            const label = document.querySelector(`label[for="${field.id}"]`);
            if (label && label.querySelector('.required')) {
                if (isRequired) {
                    field.setAttribute('required', '');
                } else {
                    field.removeAttribute('required');
                }
            }
        });
    }
    
    /**
     * フォームのバリデーションを行う関数
     * @returns {boolean} バリデーション結果
     */
    function validateForm() {
        let isValid = true;
        
        // 基本情報のバリデーション
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const inquiryType = inquiryTypeSelect.value;
        
        // 基本的な空チェック（メッセージは除外）
        if (!name || !email || !phone || !inquiryType) {
            alert('必須項目を入力してください。');
            return false;
        }
        
        // 共通ユーティリティを使用してバリデーション
        const emailValidator = window.commonUtils ? 
            window.commonUtils.isValidEmail : 
            (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        
        const phoneValidator = window.commonUtils ? 
            window.commonUtils.isValidPhone : 
            (phone) => /^[0-9\-]+$/.test(phone);
        
        if (!emailValidator(email)) {
            alert('有効なメールアドレスを入力してください。');
            return false;
        }
        
        if (!phoneValidator(phone)) {
            alert('電話番号は数字とハイフンのみで入力してください。');
            return false;
        }
        
        // お問い合わせ種類別のバリデーション
        if (inquiryType === 'one-day-trial' || inquiryType === 'join') {
            // 1日体験または入部希望の場合
            const grade = document.getElementById('grade').value;
            const experience = document.getElementById('experience').value;
            const preferredPlayerDate = document.getElementById('preferred-player-date').value;
            
            if (!grade || !experience || !preferredPlayerDate) {
                alert('学年、サッカー経験年数、希望日を入力してください。');
                return false;
            }
        } else if (inquiryType === 'media') {
            // 取材の場合
            const mediaName = document.getElementById('media-name').value.trim();
            const mediaType = document.getElementById('media-type').value;
            
            if (!mediaName || !mediaType) {
                alert('媒体名と媒体種類を入力してください。');
                return false;
            }
        }
        
        // プライバシーポリシーの同意チェック
        const privacyAgreement = document.getElementById('privacy-agreement').checked;
        if (!privacyAgreement) {
            alert('プライバシーポリシーに同意してください。');
            return false;
        }
        
        return isValid;
    }

    // プライバシーポリシーモーダル表示
    const privacyLink = document.querySelector('.privacy-link');
    const modal = document.getElementById('privacy-modal');
    const closeBtn = document.querySelector('.close-modal');

    if (privacyLink && modal && closeBtn) {
        privacyLink.addEventListener('click', function(e) {
            e.preventDefault();
            modal.style.display = 'block';
        });
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
        window.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
});
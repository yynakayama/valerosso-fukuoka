// public/js/pages/admin-panel.js - 管理画面のJavaScript
document.addEventListener('DOMContentLoaded', () => {
    // フォーム要素の取得
    const newsForm = document.getElementById('news-form');
    const newsList = document.getElementById('news-list');
    
    // 既存のニュース記事を読み込む関数
    const loadNews = () => {
      // ローディング表示
      newsList.innerHTML = '<p>ニュース記事を読み込んでいます...</p>';
      
      // APIからニュースデータを取得
      fetch('/api/news')
        .then(response => response.json())
        .then(newsItems => {
          // コンテナを一旦空にする
          newsList.innerHTML = '';
          
          // ニュースがない場合の表示
          if (newsItems.length === 0) {
            newsList.innerHTML = '<p>ニュース記事がありません。</p>';
            return;
          }
          
          // 各ニュース記事に対してリスト項目を作成
          newsItems.forEach(item => {
            const listItem = document.createElement('div');
            listItem.className = 'news-item';
            
            // HTMLを構築（タイトル、日付、削除ボタンを含む）
            listItem.innerHTML = `
              <div class="news-info">
                <h3>${item.title}</h3>
                <div class="news-date">${item.date}</div>
              </div>
              <div class="news-actions">
                <button class="delete-btn" data-id="${item.id}">削除</button>
              </div>
            `;
            
            // リストに追加
            newsList.appendChild(listItem);
            
            // 削除ボタンにイベントリスナーを追加
            listItem.querySelector('.delete-btn').addEventListener('click', (e) => {
              deleteNews(item.id);
            });
          });
        })
        .catch(error => {
          console.error('ニュース取得エラー:', error);
          newsList.innerHTML = '<p class="error">ニュースの読み込みに失敗しました。</p>';
        });
    };
    
    // ニュース記事を削除する関数
    const deleteNews = (id) => {
      if (!confirm('この記事を削除してもよろしいですか？')) return;
      
      fetch(`/api/news/${id}`, {
        method: 'DELETE'
      })
        .then(response => response.json())
        .then(data => {
          // 成功メッセージを表示
          alert('記事が削除されました');
          // リストを再読み込み
          loadNews();
        })
        .catch(error => {
          console.error('削除エラー:', error);
          alert('記事の削除に失敗しました');
        });
    };
    
    // フォーム送信時の処理
    newsForm.addEventListener('submit', (e) => {
      e.preventDefault(); // デフォルトの送信動作をキャンセル
      
      // フォームからデータを取得
      const formData = new FormData(newsForm);
      const newsData = {
        title: formData.get('title'),
        content: formData.get('content')
      };
      
      // 入力検証
      if (!newsData.title || !newsData.content) {
        alert('タイトルと内容を入力してください');
        return;
      }
      
      // APIにPOSTリクエストを送信
      fetch('/api/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newsData)
      })
        .then(response => response.json())
        .then(data => {
          // 成功メッセージを表示
          alert('ニュース記事が投稿されました');
          // フォームをリセット
          newsForm.reset();
          // リストを再読み込み
          loadNews();
        })
        .catch(error => {
          console.error('投稿エラー:', error);
          alert('記事の投稿に失敗しました');
        });
    });
    
    // ページ読み込み時にニュース記事を表示
    loadNews();
  });
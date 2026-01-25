// 設定：9:00 から 18:00 まで、30分刻み
const START_HOUR = 9;
const END_HOUR = 18;
const STEP_MIN = 30; 

// 仮のデータ（実際は前の画面やGASから受け取る）
const targetDates = ["2/1", "2/2", "2/3"];

// 初期化処理
function init() {
    const template = document.getElementById('form-main');
    const container = document.getElementById('form'); // 挿入先
    const submitBtn = document.getElementById('submit'); // 送信ボタンの手前に挿入したい場合

    targetDates.forEach(dateStr => {
        // 1. テンプレートを複製
        const clone = template.content.cloneNode(true);

        // 2. 日付をセット
        clone.querySelector('.date-text').textContent = dateStr;

        // 3. タイムライン（ブロック）を生成
        const blocksContainer = clone.querySelector('.time-blocks');
        const rulerContainer = clone.querySelector('.time-ruler');
        
        let totalSlots = (END_HOUR - START_HOUR) * (60 / STEP_MIN);

        for (let i = 0; i < totalSlots; i++) {
            // 時間計算
            let currentMin = (START_HOUR * 60) + (i * STEP_MIN);
            let h = Math.floor(currentMin / 60);
            let m = currentMin % 60;
            
            // ブロック作成
            const block = document.createElement('div');
            block.classList.add('time-block');
            block.dataset.time = `${h}:${m.toString().padStart(2, '0')}`; // "9:30"などを保持
            block.dataset.status = "0"; // 0:なし, 1:可, 2:微妙, 3:不可

            // クリックイベント（色変え）
            block.addEventListener('click', () => toggleStatus(block));

            blocksContainer.appendChild(block);

            // メモリ（1時間ごとに表示）
            if (m === 0) {
                const label = document.createElement('div');
                label.className = 'ruler-label';
                label.textContent = h;
                // 位置調整（CSSで計算が必要だが簡易的に）
                label.style.left = `${i * 30}px`; 
                rulerContainer.appendChild(label);
            }
        }

        // フォームに追加（ボタンの手前などに挿入）
        container.insertBefore(clone, submitBtn); 
    });
}

// クリック時の状態遷移ロジック
function toggleStatus(element) {
    // 現在のステータスを取得（0〜3）
    let status = parseInt(element.dataset.status);
    
    // 次のステータスへ (0->1->2->3->0...)
    status = (status + 1) % 4;

    // クラスをリセットして付け替え
    element.className = 'time-block'; // 一旦リセット
    element.dataset.status = status;

    if (status === 1) element.classList.add('status-ok');
    else if (status === 2) element.classList.add('status-maybe');
    else if (status === 3) element.classList.add('status-ng');
}

// 実行
init();
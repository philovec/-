//AI生成ここから

// 数字を時間形式に変換する便利関数（例: 13.5 → "13:30"）
function formatTime(value) {
    const hours = Math.floor(value);
    const minutes = (value - hours) * 60;
    // 分が0なら "00"、30なら "30" にする
    const minutesStr = minutes === 0 ? "00" : Math.round(minutes).toString();
    return `${hours}:${minutesStr}`;
}

// スライダーを作成する関数
function initSlider(id) {
    const slider = document.getElementById(`slider-${id}`);
            
    // すでに作成済みなら何もしない（二重作成防止）
    if (slider.noUiSlider) return;

    // noUiSliderを作成
    noUiSlider.create(slider, {//----------------------------------値については要変更
        start: [13, 17], // 初期値 (13:00 〜 17:00)
        connect: true,   // 間を塗りつぶす
        range: {
            'min': 9,    // 朝9時から
            'max': 22    // 夜22時まで
        },
        step: 0.5,       // 0.5 = 30分刻み
        tooltips: false  // ツールチップは邪魔になることがあるのでOFF（上の文字で表示）
    });

    // スライダーを動かした時の処理
    slider.noUiSlider.on('update', function (values) {
        // valuesは文字列で来るので数値に変換
        const start = parseFloat(values[0]);
        const end = parseFloat(values[1]);
                
        // 画面の文字を更新 (13.5 -> 13:30)
        const text = `${formatTime(start)} - ${formatTime(end)}`;
        document.getElementById(`time-display-${id}`).innerText = text;
                
        // 送信用の隠しデータを更新
        document.getElementById(`input-start-${id}`).value = formatTime(start);
        document.getElementById(`input-end-${id}`).value = formatTime(end);
    });
}

// ボタンが押された時の処理
function setStatus(id, status) {
    const card = document.getElementById(`card-${id}`);
    const btns = card.querySelectorAll('.status-btn');
            
    // 全ボタンの選択状態を解除
    btns.forEach(btn => btn.classList.remove('selected'));
            
    // 押されたボタンだけ選択状態にする (event.targetを使用)
    // ※クリックした要素そのものを指す
    event.currentTarget.classList.add('selected');

    // 「部分参加」ならスライダー表示エリアを開く
    if (status === 'partial') {
        card.classList.add('active-partial');
        // スライダーを初期化（初回のみ作成される仕組み）
        initSlider(id); 
    } else {
        // それ以外なら閉じる
        card.classList.remove('active-partial');
    }
}
//AI生成ここまで
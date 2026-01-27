document.addEventListener('DOMContentLoaded', async()=>{
    const isVisited = sessionStorage.getItem('isVisited')
    if(!isVisited || JSON.parse(isVisited) !== true){
        await load()
    }

    //名前入力時
    const displayBtn = document.getElementById('form-display')
    displayBtn.addEventListener('click',() => {searchName()})

    //名前がその他の時の入力欄表示
    const nameElement = document.getElementById('name-user')
    nameElement.addEventListener('change', ()=> {displayNameInput()})

    //送信ボタン
    const submitBtn = document.getElementById('submit')
    submitBtn.addEventListener('click', ()=> {submit()})

    await loadForm()
    
    //ローディング画面の削除
    const loader = document.getElementById('loading-screen');
    loader.classList.add('loaded');
})

async function loadForm(){
    //名前の表示
    const nameElement = document.getElementById('name-user')
    const result = {targetSheetNameList:sessionStorage.getItem('targetSheetNameList')}

    Object.keys(result).forEach(key => {
        result[key] = JSON.parse(result[key])
    })

    const targetSheetNameList = result.targetSheetNameList
    
    for (let i = 0; i < targetSheetNameList.length; i++){
        const optionElement = document.createElement('option')
        optionElement.textContent = targetSheetNameList[i]
        nameElement.appendChild(optionElement)
    }
    const optionElement = document.createElement('option')
    optionElement.textContent = 'その他'
    nameElement.appendChild(optionElement)
}

function displayNameInput(){
    const nameElement = document.getElementById('name-user')
    const extraNameElement = document.getElementById('extra-name-user')
    
    if (nameElement.value === 'その他'){
    extraNameElement.disabled =false
    } else if(!extraNameElement.hasAttribute('disabled')){
        extraNameElement.value = ''
        extraNameElement.disabled = true
    }
}

async function searchName(){
    try{
        disable()

        const nameElement = document.getElementById('name-user')
        const extraNameElement = document.getElementById('extra-name-user')
        const template = document.getElementById('timeline-template')
        const tableBody = document.getElementById('table-body')

        let name = ''
        if(nameElement.value === 'その他'){
            name = extraNameElement.value
            if(!name){
                alert('名前を入力してください。')
                return
            }
            const response = confirm(`${name}さんのシートを作成しますか？`)
            if (!response){return}
            await createPerson(name)
            return
        } else {
            name = nameElement.value
        }

        //テーブル作成
        renderEachTable(name,template,tableBody)
        convertTableToForm(tableBody)
    } catch(e){
        alertError(e)
    } finally {
        enable()
    }
}

async function createPerson(name) {
    try{
        disable()

        const action = "createPerson"
        const targetMtg = JSON.parse(sessionStorage.getItem('targetMtg'))

        const dataObj = {action:action, name:name, targetMtg:targetMtg}
        const result = await postGAS(dataObj)

        alert('シート作成が完了しました。リロードします。')
        sessionStorage.setItem('isVisited','false')
        location.reload()
    } catch(e) {
        alertError(e)
    } finally{
        enable()
    }
}

async function submit() {
    try{
        disable()
        const action = "submit"
        
        const dates = JSON.parse(sessionStorage.getItem('dates'))

        const nameElement = document.getElementById('name-user')
        const timelineElements = document.querySelectorAll('.timeline-bars')
        const name = nameElement.value
        const personalData = []

        for (let i = 0; i < dates.length; i++){
            const obj = {content:[], comment: ''}
            const content = obj['content']

            const comment = timelineElements[i].nextElementSibling.firstElementChild.value
            const cells = timelineElements[i].querySelectorAll('[data-status]')
            
            cells.forEach(cell => {
                const dataStatus = cell.getAttribute('data-status')
                content.push(dataStatus)
            })
            obj['comment'] = comment
            personalData.push(obj)
        }
        const dataObj = {action:action, name:name, personalData:personalData}

        const result = await postGAS(dataObj)

        alert('送信しました。')
        sessionStorage.setItem('isVisited','false')
        location.reload()
    } catch(e) {
        alertError(e)
    } finally {
        enable()
    }
}



//CSS調整用、以下Gemini作成

/**
 * 既存のテーブルHTMLを操作可能なフォームに変換する関数
 */
function convertTableToForm(tableBody) {
    // 1. タイムラインのセル（div）を操作可能にする
    const timelineRows = tableBody.querySelectorAll('.timeline-bars');
    
    timelineRows.forEach(row => {
        const cells = row.children;
        Array.from(cells).forEach(cell => {
            const text = cell.textContent.trim();


            if (!text) {
                text = 'p'//初期状態
            }
            
            // テキストを見てクラスとデータを付与
            cell.dataset.status = text; // "p", "u" などをデータ属性に保存
            updateCellVisual(cell, text); // 色をつける
            
            // 見た目を良くするため、文字自体は消す（あるいは薄くする）
            // 時間ラベル（9, 10...）が表示されていないセルなら文字を消す等の調整
            // 今回は、色で表現するため文字は空にする（時間軸ラベルと競合しない場合）
             cell.textContent = ''; 
        });
    });

    // 2. コメント欄（div）を input タグに変換する
    const commentDivs = tableBody.querySelectorAll('.timeline-comment');
    commentDivs.forEach(div => {
        const currentText = div.textContent;
        div.textContent = ''; // 一旦空にする
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentText;
        input.placeholder = 'コメント';
        input.className = 'comment-input'; // CSSスタイリング用
        
        div.appendChild(input);
    });

    // 3. マウス・タッチイベントを設定する
    setupTimelineInteractions(tableBody);
}

/**
 * セルの見た目を状態文字に合わせて変更する（共通処理）
 */
function updateCellVisual(cell, status) {
    // クラスをリセット
    cell.classList.remove('status-ok', 'status-ng', 'status-maybe');
    
    if (status === 'p') {
        cell.classList.add('status-ok');
    } else if (status === 'u') {
        cell.classList.add('status-ng');
    } else if (status === 'm') {
        cell.classList.add('status-maybe');
    }
}

/**
 * 操作ロジック（PCドラッグ＆スマホタッチ）
 */
function setupTimelineInteractions(container) {
    let isDrawing = false;
    let startStatus = ''; 

    // --- PC (Mouse) ---
    container.addEventListener('mousedown', (e) => {
        const cell = e.target.closest('.timeline-bars > div');
        if (!cell) return;
        
        isDrawing = true;
        e.preventDefault(); 
        startStatus = getNextStatus(cell.dataset.status);
        applyStatus(cell, startStatus);
    });

    container.addEventListener('mouseover', (e) => {
        if (!isDrawing) return;
        const cell = e.target.closest('.timeline-bars > div');
        if (cell) applyStatus(cell, startStatus);
    });

    document.addEventListener('mouseup', () => isDrawing = false);

    // --- Mobile (Touch) ---
    container.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const cell = element ? element.closest('.timeline-bars > div') : null;
        if (cell) {
            isDrawing = true;
            startStatus = getNextStatus(cell.dataset.status);
            applyStatus(cell, startStatus);
        }
    }, { passive: false });

    container.addEventListener('touchmove', (e) => {
        if (!isDrawing) return;
        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const cell = element ? element.closest('.timeline-bars > div') : null;
        
        if (cell) {
            e.preventDefault(); // スクロール防止
            applyStatus(cell, startStatus);
        }
    }, { passive: false });

    container.addEventListener('touchend', () => isDrawing = false);
}

// 状態のローテーション
function getNextStatus(current) {
    if (current === "p") return "m";
    if (current === "m") return "u";
    if (current === "u") return "p";
    return "m";
}

// 状態適用
function applyStatus(cell, status) {
    cell.dataset.status = status;
    updateCellVisual(cell, status);
}
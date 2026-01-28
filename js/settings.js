document.addEventListener('DOMContentLoaded', async()=>{
    const deleteBtn = document.getElementById('btn-delete')
    deleteBtn.addEventListener('click', ()=>deleteSheet())

    const createBtn = document.getElementById('btn-create')
    createBtn.addEventListener('click', ()=>createSheet())

    const saveBtn = document.getElementById('btn-save')
    saveBtn.addEventListener('click', ()=>saveSettings())

    const addMemBtn = document.getElementById('btn-add-member')
    addMemBtn.addEventListener('click',()=>addMember())

    const table = document.getElementById('member-table')
    table.addEventListener('click',(e)=>{
        if (e.target && e.target.classList.contains('btn-delete-member')){
            const deleteMemBtn = e.target
            deleteMember(deleteMemBtn)
        }
    })

    const isVisited = sessionStorage.getItem('isVisited')
    if(!isVisited || JSON.parse(isVisited) !== true){
        await load()
    }

    await loadSettings()
    
    //ローディング画面の削除
    const loader = document.getElementById('loading-screen');
    loader.classList.add('loaded');
})

async function loadSettings() {
    try{
        const result = {
            targetMtg: sessionStorage.getItem('targetMtg'),
            startTime: sessionStorage.getItem('startTime'),
            endTime: sessionStorage.getItem('endTime'),
            stepTime: sessionStorage.getItem('stepTime'),
            targetSSList: sessionStorage.getItem('targetSSList'),
            attendees: sessionStorage.getItem('attendees')
        }
        Object.keys(result).forEach(key => {
            result[key] = JSON.parse(result[key])
        })

        //日調リスト作成
        const targetMtgElements = document.getElementsByClassName('target-mtg')
        for (const element of targetMtgElements){
            for (const target of result.targetSSList){
                if(target === 'テンプレ'){continue}
                const optionElement = document.createElement('option')
                optionElement.textContent = target
                optionElement.value = target
                element.appendChild(optionElement)
            }
        }

        //各種設定欄デフォルト設定
        const targetMtgElement = document.getElementById('target-mtg-select')
        const startTimeElement = document.getElementById('startTime-input')
        const endTimeElement = document.getElementById('endTime-input')
        const stepTimeElement = document.getElementById('stepTime-input')
        const tbody = document.getElementById('member-table-body')

        targetMtgElement.value = result.targetMtg
        startTimeElement.value = result.startTime
        endTimeElement.value = result.endTime
        stepTimeElement.value = result.stepTime

        const attendees = result.attendees
        for (const person of attendees){
            const template = document.getElementById('member-row-template')
            const newTr = template.content.cloneNode(true).firstElementChild

            const origin = newTr.querySelector('.select-origin')
            const name = newTr.querySelector('.input-name')
            const need = newTr.querySelector('.select-need')

            origin.value = person.origin
            name.value = person.name
            if (person.need.includes('gkc') && person.need.includes('gkuc')){
                need.value = '両方'
            }
            if (!person.need){
                need.value = 'なし'
            }
            
            tbody.appendChild(newTr)
        }        
    } catch(e){
        alertError(e)
    }
}

async function saveSettings() {
    try{
        disable()
        const action = "saveSettings"

        const targetMtg = document.getElementById('target-mtg-select').value
        const startTimeStr = document.getElementById('startTime-input').value
        const endTimeStr = document.getElementById('endTime-input').value
        const stepTimeStr = document.getElementById('stepTime-input').value

        if (!startTimeStr || !endTimeStr || !stepTimeStr){
            alert('未入力の項目があります。')
            return
        }

        const startTime = Number(startTimeStr)
        const endTime = Number(endTimeStr)
        const stepTime = Number(stepTimeStr)

        if (!timeCheck(startTime) || !timeCheck(endTime) || startTime > endTime || !stepTimeCheck(startTime, endTime, stepTime)){
            alert('時間の記入欄が不正です。')
            return
        }

        const memberRows = document.getElementsByClassName('member-row')
        if (memberRows && !memberRowsCheck(memberRows)){
            alert('デフォルトの出席者の表に空欄が含まれます。')
            return
        }

        const attendees = []
        for (let j = 0; j < memberRows.length; j++){
            const rowData = []
            rowData.push(memberRows[j].querySelector('.select-origin').value)
            rowData.push(memberRows[j].querySelector('.input-name').value)
            rowData.push(memberRows[j].querySelector('.select-need').value)
            
            attendees.push({origin:rowData[0], name:rowData[1], need:rowData[2]})
        }

        const dataObj = {
            action:action,
            targetMtg:targetMtg,
            startTime:startTime,
            endTime:endTime,
            stepTime:stepTime,
            attendees:attendees
        }
        const result = await postGAS(dataObj)

        alert(`設定変更が完了しました。リロードします。`)
        sessionStorage.setItem('isVisited','false')
        location.reload()
    } catch(e){
        alertError(e)
    } finally{
        enable()
    }
}

function timeCheck(time){
    if (typeof time !== 'number' || isNaN(time) || time > 24 || time < 0){
        return false
    }
    return true
}
function stepTimeCheck(startTime, endTime, stepTime){
    if (typeof stepTime !== 'number'){
        return false
    }
    const duration = endTime + 1 - startTime
    const count = duration / stepTime
    if (Math.abs(count - Math.round(count)) > 0.0001){
        return false
    }
    return true
}

function deleteMember(deleteMemBtn) {
    disable()

    const memberRow = deleteMemBtn.closest('tr')

    memberRow.remove()
    enable()
}

function addMember(){
    disable()

    const tbody = document.getElementById('member-table-body')
    const template = document.getElementById('member-row-template')
    const newTr = template.content.cloneNode(true).firstElementChild

    newTr.querySelector('.select-origin').value = 'なし'
    newTr.querySelector('.input-name').value = ''
    newTr.querySelector('.select-need').value = 'なし'

    tbody.appendChild(newTr)

    enable()
}

async function deleteSheet(){
    try{
        disable()

        const action = "delete"
        const target = document.getElementById('target-delete').value
        const targetMtg = JSON.parse(sessionStorage.getItem('targetMtg'))

        if(!target){
            alert('削除対象が選択されていません。')
            return;
        }

        const targetSSList = JSON.parse(sessionStorage.getItem('targetSSList'))
        if (targetSSList.length <= 1){
            alert('最低一つの日調を残す必要があります。必要に応じてスプレッドシートの新規作成を行ってから削除してください。')
            return
        }
        const confirmResult = confirm(`本当に${target}を削除しますか？`)
        if (!confirmResult) return;
    
        const targetDelete = targetMtg === target ? true : false
        const dataObj = {action:action, target:target, targetDelete:targetDelete}
        const result = await postGAS(dataObj)
        if(targetDelete){
            alert('スプレッドシートの削除が完了しました。リロード後、表示対象を選択してください。')
        } else {
            alert('スプレッドシートの削除が完了しました。')
        }

        sessionStorage.setItem('isVisited','false')
        location.reload()
    } catch(e){
        alertError(e)
    } finally{
        enable()
    }
}

async function createSheet(){
    try{
        disable()

        const action = "create"
        const month = document.getElementById('month-create').value
        const str = document.getElementById('str-create').value

        if(!month || !str){
            alert('作成するシートに関する情報が不足しています。')
            return;
        }
        const name = `${month}月${str}半会議日程調整`
        const targetSSList = JSON.parse(sessionStorage.getItem('targetSSList'))
        if (targetSSList.includes(name)){
            alert(`${name}は既に作成されています。`)
            return;
        }

        const confirmResult = confirm(`${name}を作成しますか？`)
        if (!confirmResult) return;
    
        const dataObj = {action:action, month:month, str:str}
        const result = await postGAS(dataObj)

        prompt(`${name}の作成が完了しました。リロードします。\nSlack文面：`,result.SlackMsg)
        sessionStorage.setItem('isVisited','false')
        location.reload()
    } catch(e){
        alertError(e)
    } finally{
        enable()
    }
}
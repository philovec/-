document.addEventListener('DOMContentLoaded', ()=>{
    const deleteBtn = document.getElementById('btn-delete')
    deleteBtn.addEventListener('click', ()=>deleteSheet(deleteBtn))

    const createBtn = document.getElementById('btn-create')
    createBtn.addEventListener('click', ()=>createSheet(createBtn))

    const saveBtn = document.getElementById('btn-save')
    saveBtn.addEventListener('click', ()=>saveSettings(saveBtn))

    const addMemBtn = document.getElementById('btn-add-member')
    addMemBtn.addEventListener('click',()=>addMember(addMemBtn))

    const table = document.getElementById('member-table')
    table.addEventListener('click',(e)=>{
        if (e.target && e.target.classList.contains('btn-delete-member')){
            const deleteMemBtn = e.target
            deleteMember(deleteMemBtn)
        }
    })

    loadSettings()
})
async function loadSettings() {
    try{
        const action = "loadSettings"
        const dataObj = {action:action}
        const result = await postGAS(dataObj)

        if (result && result.status === "success"){
        } else if (result && result.status === "error"){
            alert(`GAS側のエラーが発生しました：${result.errorMsg}`)
            return
        } else {
            console.log(result)
            alert('GAS側で不明なエラーが発生しました。')
            return
        }

        //日調リスト作成
        const targetMtgElements = document.getElementsByClassName('target-mtg')
        for (const element of targetMtgElements){
            for (const targetMtg of result.targetSSList){
                const optionElement = document.createElement('option')
                optionElement.textContent = targetMtg
                element.appendChild(optionElement)
            }
        }

        //各種設定欄デフォルト設定
        const startTimeElement = document.getElementById('startTime-input')
        const endTimeElement = document.getElementById('endTime-input')
        const stepTimeElement = document.getElementById('stepTime-input')
        const tbody = document.getElementById('member-table-body')

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
    } finally{
        const loader = document.getElementById('loading-screen');
        loader.classList.add('loaded');
    }
}
async function saveSettings(saveBtn) {
    try{
        if(saveBtn) saveBtn.disabled = true;
        document.body.style.cursor = 'wait';
        const action = "saveSettings"

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

        if (!timeCheck(startTime) || !timeCheck(endTime) || startTime >= endTime || !stepTimeCheck(startTime, endTime, stepTime)){
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
            startTime:startTime,
            endTime:endTime,
            stepTime:stepTime,
            attendees:attendees
        }
        const result = await postGAS(dataObj)

        if (result && result.status === "success"){
            alert(`設定変更が完了しました。`)
            location.reload()
        } else if (result && result.status === "error"){
            alert(`GAS側のエラーが発生しました：${result.errorMsg}`)
            return
        } else {
            alert('GAS側で不明なエラーが発生しました。')
            return
        }
    } catch(e){
        alertError(e)
    } finally{
        if(saveBtn) saveBtn.disabled = false;
        document.body.style.cursor = 'default';
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
    const duration = endTime - startTime
    const count = duration / stepTime
    if (Math.abs(count - Math.round(count)) > 0.0001){
        return false
    }
    return true
}
function memberRowsCheck(memberRows){
    const memberRowsArray = Array.from(memberRows)
    const result = memberRowsArray.every((memberRow) => {
        const nameInput = memberRow.querySelector('.input-name')
        if (!memberRow || !nameInput.value.trim()){
            return false
        }
        return true
    })
    return result
}

function deleteMember(deleteMemBtn) {
    if(deleteMemBtn) deleteMemBtn.disabled = true;

    const memberRow = deleteMemBtn.closest('tr')

    memberRow.remove()
}

function addMember(addMemBtn){
    if(addMemBtn) addMemBtn.disabled = true;

    const tbody = document.getElementById('member-table-body')
    const template = document.getElementById('member-row-template')
    const newTr = template.content.cloneNode(true).firstElementChild

    newTr.querySelector('.select-origin').value = 'なし'
    newTr.querySelector('.input-name').value = ''
    newTr.querySelector('.select-need').value = 'なし'

    tbody.appendChild(newTr)

    addMemBtn.disabled = false;
}

async function deleteSheet(deleteBtn){
    try{
        if(deleteBtn) deleteBtn.disabled = true;
        document.body.style.cursor = 'wait';

        const action = "delete"
        const target = document.getElementById('target-delete').value

        if(!target){
            alert('削除対象が選択されていません。')
            return;
        } else if (target === 'テンプレ'){
            alert('テンプレートはUI経由では削除できません。')
            return;
        }
        const confirmResult = confirm(`本当に${target}を削除しますか？`)
        if (!confirmResult) return;
    
        const dataObj = {action:action, target:target}
        const result = await postGAS(dataObj)

        if (result && result.status === "success"){
            alert(`${target}の削除が完了しました。`)
            location.reload()
        } else if (result && result.status === "error"){
            alert(`GAS側のエラーが発生しました：${result.errorMsg}`)
            return
        } else {
            alert('GAS側で不明なエラーが発生しました。')
            return
        }
    } catch(e){
        alertError(e)
    } finally{
        if(deleteBtn) deleteBtn.disabled = false;
        document.body.style.cursor = 'default';
    }
}

async function createSheet(createBtn){
    try{
        if(createBtn) createBtn.disabled = true;
        document.body.style.cursor = 'wait';

        const action = "create"
        const month = document.getElementById('month-create').value
        const str = document.getElementById('str-create').value

        if(!month || !str){
            alert('作成するシートに関する情報が不足しています。')
            return;
        }
        const confirmResult = confirm(`${month}月${str}半の会議日調を作成しますか？`)
        if (!confirmResult) return;
    
        const dataObj = {action:action, month:month, str:str}
        const result = await postGAS(dataObj)

        if (result && result.status === "success" && result.SlackMsg){
            confirm(`${month}月${str}半の会議日調の作成が完了しました。\nSlack文面：\n${result.SlackMsg}`)
            location.reload()
        } else if (result && result.status === "error"){
            alert(`GAS側のエラーが発生しました：${result.errorMsg}`)
            return
        } else {
            alert('GAS側で不明なエラーが発生しました。')
            return
        }
    } catch(e){
        alertError(e)
    } finally{
        if(createBtn) createBtn.disabled = false;
        document.body.style.cursor = 'default';
    }
}

async function postGAS(dataObj){
    const url = 'https://script.google.com/macros/s/AKfycbw3El_rzMysep877arihZY08kKxvz65ak5yMFyJaT5j6M5CI8bfKtGSuTI0_oGB24tv/exec'
    const options = {
        method: "POST",
        body: JSON.stringify(dataObj),
        mode: "cors",
        headers: {"Content-Type": "text/plain"}
    }

    const request = await fetch(url,options)
    const result = await request.json()

    return result;
}

function alertError(e){
    alert(`JavaScriptエラーが発生しました：${e}`)
    console.error(e)
}
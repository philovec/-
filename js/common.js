async function load(){
    try{
        const action = "load"
        const dataObj = {action:action}
        const result = await postGAS(dataObj)

        Object.keys(result).forEach(key => {
            sessionStorage.setItem(key,JSON.stringify(result[key]))
        })
        sessionStorage.setItem('isVisited','true')
    } catch(e){
        alertError(e)
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

    if (result && result.status === "success"){
        return result
    } else if (result && result.status === "error"){
        throw Error(`GAS側のエラーが発生しました：${result.errorMsg}`)
    } else {
        console.log(result)
        throw Error('GAS側で不明なエラーが発生しました。')
    }
}

function alertError(e){
    alert(`JavaScriptエラーが発生しました：${e}`)
    console.error(e)
}

function disable(){
    const backToMenu = document.getElementById('back-to-menu')
    backToMenu.classList.add('disable')
    const buttons = document.getElementsByTagName('button')
    for (btn of buttons){
        btn.disabled = true
    }
    document.body.style.cursor = 'wait';
}

function enable(){
    const backToMenu = document.getElementById('back-to-menu')
    backToMenu.classList.remove('disable')
    const buttons = document.getElementsByTagName('button')
    if (buttons.length > 0){
    for (btn of buttons){
        btn.disabled = false
    }
    }
    document.body.style.cursor = 'default';
}

/*renderEachTableでは、templateは以下の形を想定
    <template>
        <tr>
            <td class="date"></td>
            <td class="timeline-cell">
                <div class="timeline-container">
                    <div class="timeline-bars"></div>
                    <div class="timeline-comment"></div>
                </div>
            </td>
        </tr>
    </template>
*/
function renderEachTable(name,template,tableBody){  
    const data = JSON.parse(sessionStorage.getItem('data'))[name]
    const targetStartTime = JSON.parse(sessionStorage.getItem('targetStartTime'))
    const targetEndTime = JSON.parse(sessionStorage.getItem('targetEndTime'))
    const targetStepTime = JSON.parse(sessionStorage.getItem('targetStepTime'))
    const dates = JSON.parse(sessionStorage.getItem('dates'))
    
    //タイムバー作成
    const timeRuler = document.createElement('div')
    timeRuler.className = 'time-ruler'
    const tickCount = (targetEndTime + 1 - targetStartTime) / targetStepTime

    for (let i = 0; i < tickCount; i++){
        let label = ""
        if(Math.abs(i % (1/ targetStepTime)) < 0.0001){
            label = Math.round(targetStartTime + i * targetStepTime)
        }
        const cell = document.createElement('div')
        cell.className = 'time-label'
        cell.textContent = label
        timeRuler.appendChild(cell)
    }

    //テーブル作成
    tableBody.innerHTML = ''
    for ( let i = 0; i < data.length; i++){
        const newTr = template.content.cloneNode(true).firstElementChild
        const newDate = newTr.querySelector('.date')
        const newTimelineContainer = newTr.querySelector('.timeline-container')
        const newTimeline = newTr.querySelector('.timeline-bars')
        const newComment = newTr.querySelector('.timeline-comment')

        newDate.textContent = dates[i]
        newTimelineContainer.insertBefore(timeRuler.cloneNode(true), newTimeline)

        const comment = data[i].comment
        newComment.textContent = comment
        
        for (let j = 0; j < data[i].content.length; j++){
            const cell = document.createElement('div')
            cell.textContent = data[i].content[j]
            newTimeline.appendChild(cell)
        }
        tableBody.appendChild(newTr)
    }
}
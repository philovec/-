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

function loadResult(){
    const result = {
            targetStartTime: sessionStorage.getItem('targetStartTime'),
            targetEndTime: sessionStorage.getItem('targetEndTime'),
            targetStepTime: sessionStorage.getItem('targetStepTime'),
            targetSheetNameList: sessionStorage.getItem('targetSheetNameList'),
            dates: sessionStorage.getItem('dates'),
            data: sessionStorage.getItem('data')
        }

    Object.keys(result).forEach(key => {
        result[key] = JSON.parse(result[key])
    })
    const targetStartTime = result.targetStartTime
    const targetEndTime = result.targetEndTime
    const targetStepTime = result.targetStepTime
    const targetSheetNameList = result.targetSheetNameList
    const dates = result.dates

    const nameSelectElement = document.getElementById('name-search')
    const gkcTableBody = document.getElementById('gkc-table-body')
    const gkcNumberTableBody = document.getElementById('gkc-number-table-body')
    const gkucTableBody = document.getElementById('gkuc-table-body')
    const gkucNumberTableBody = document.getElementById('gkuc-number-table-body')
    const template = document.getElementById('result-template')

    const tableBodies = {gkc:gkcTableBody, gkuc:gkucTableBody}
    const numberTableBodies = {gkc:gkcNumberTableBody, gkuc:gkucNumberTableBody}

    //各人のシート名表示
    for (const target of targetSheetNameList){
        const optionElement = document.createElement('option')
        optionElement.textContent = target
        optionElement.value = target
        nameSelectElement.appendChild(optionElement)
    }

    //タイムバー作成
    const timeRuler = document.createElement('div')
    const tickCount = (targetEndTime + 1 - targetStartTime) / targetStepTime

    for (let i = 0; i < tickCount; i++){
        let label =""
        if(Math.abs(i % (1/ targetStepTime)) < 0.0001){
            label = Math.round(targetStartTime + i * targetStepTime)
        }
        const cell = document.createElement('div')
        cell.textContent = label
        timeRuler.appendChild(cell)
    }

    //テーブル作成
    ['gkc','gkuc'].forEach(mtg =>{
        [tableBodies,numberTableBodies].forEach(tab =>{
            const mtgData = result.data[mtg]

            for (let i = 0; i < dates.length; i++){
                const newTr = template.content.cloneNode(true).firstElementChild
                const newDate = newTr.querySelector('.date')
                const newTimelineContainer = newTr.querySelector('.timeline-container')
                const newTimeResult = newTr.querySelector('.result-bars')
                const newComment = newTr.querySelector('.result-comment')

                newDate.textContent = result.dates[i]
                newTimelineContainer.insertBefore(timeRuler.cloneNode(true), newTimeResult)

                const comment = mtgData[i].comment
                newComment.textContent = comment
                
                const OKNGList = mtgData[i].content.OKNG
                const numberList =mtgData[i].content.number
                for (let j = 0; j < OKNGList.length; j++){
                    const cell = document.createElement('div')
                    if(tab === tableBodies){
                        if(OKNGList[j]){
                            cell.textContent = "◯"
                        } else {
                            cell.textContent = ""
                        }
                    } else {
                        cell.textContent = numberList[j]
                    }
                    newTimeResult.appendChild(cell)
                }
                tab[mtg].appendChild(newTr)
            }
        })})
}

async function getPersonalData(personalDataBtn){
    try{
        if(personalDataBtn) personalDataBtn.disabled = true;
        document.body.style.cursor = 'wait';

        const action = "getPersonalData"
        const name = document.getElementById('name-search').value
        const dataObj = {action:action, name:name}

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
        const data = result.personalData

        const targetStartTime = JSON.parse(sessionStorage.getItem('targetStartTime'))
        const targetEndTime = JSON.parse(sessionStorage.getItem('targetEndTime'))
        const targetStepTime = JSON.parse(sessionStorage.getItem('targetStepTime'))
        const dates = JSON.parse(sessionStorage.getItem('dates'))
        
        //タイムバー作成
        const timeRuler = document.createElement('div')
        const tickCount = (targetEndTime + 1 - targetStartTime) / targetStepTime

        for (let i = 0; i < tickCount; i++){
            let label =""
            if(Math.abs(i % (1/ targetStepTime)) < 0.0001){
                label = Math.round(targetStartTime + i * targetStepTime)
            }
            const cell = document.createElement('div')
            cell.textContent = label
            timeRuler.appendChild(cell)
        }

        //テーブル作成
        const template = document.getElementById('result-template')
        const tableBodies = document.getElementById('each-table-body')
        for ( let i = 0; i < data.length; i++){
            const newTr = template.content.cloneNode(true).firstElementChild
            const newDate = newTr.querySelector('.date')
            const newTimelineContainer = newTr.querySelector('.timeline-container')
            const newTimeResult = newTr.querySelector('.result-bars')
            const newComment = newTr.querySelector('.result-comment')

            newDate.textContent = dates[i]
            newTimelineContainer.insertBefore(timeRuler.cloneNode(true), newTimeResult)

            const comment = data[i].comment
            newComment.textContent = comment
            
            for (let j = 0; j < data[i].responce.length; j++){
                const cell = document.createElement('div')
                cell.textContent = data[i].responce[j]
                newTimeResult.appendChild(cell)
            }
            console.log(newTr)
            tableBodies.appendChild(newTr)
        }
    } catch(e){
        alertError(e)
    } finally{
        if(personalDataBtn) personalDataBtn.disabled = false;
        document.body.style.cursor = 'default';
    }

}
        
document.addEventListener('DOMContentLoaded', ()=> {
    const personalDataBtn = document.getElementById('btn-name-search')
    personalDataBtn.addEventListener('click', () => getPersonalData(personalDataBtn))

    loadResult()
})
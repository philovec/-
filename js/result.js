async function loadResult(){
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
    const template = document.getElementById('timeline-template')

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
    };

    //テーブル作成
    ['gkc','gkuc'].forEach(mtg =>{
        [tableBodies,numberTableBodies].forEach(tab =>{
            const mtgData = result.data[mtg]

            for (let i = 0; i < dates.length; i++){
                const newTr = template.content.cloneNode(true).firstElementChild
                const newDate = newTr.querySelector('.date')
                const newTimelineContainer = newTr.querySelector('.timeline-container')
                const newTimeResult = newTr.querySelector('.timeline-bars')
                const newComment = newTr.querySelector('.timeline-comment')

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

function getPersonalData(){
    try{
        disable()
        const name = document.getElementById('name-search').value
        const template = document.getElementById('timeline-template')
        const tableBody = document.getElementById('each-table-body')
        renderEachTable(name,template,tableBody)
    } catch(e){
        alertError(e)
    } finally{
        enable()
    }
}
  
async function recalculate(recalculateBtn) {
    try{
        disable()
        document.body.style.cursor = 'wait';

        const action = "recalculate"
        const dataObj = {action:action}

        const result = await postGAS(dataObj)
        
        alert('集計が完了しました。リロードします。')
        sessionStorage.setItem('isVisited','false')
        location.reload()
    } catch(e){
        alertError(e)
    } finally{
        enable()
    }
}

document.addEventListener('DOMContentLoaded', async()=> {
    const personalDataBtn = document.getElementById('btn-name-search')
    personalDataBtn.addEventListener('click', () => getPersonalData())

    const recalculateBtn = document.getElementById('btn-recalculate')
    recalculateBtn.addEventListener('click', ()=> {recalculate()})
    
    const isVisited = sessionStorage.getItem('isVisited')
    if(!isVisited || JSON.parse(isVisited) !== true){
        await load()
    }

    await loadResult()
    //ローディング画面の削除
    const loader = document.getElementById('loading-screen');
    loader.classList.add('loaded');
})
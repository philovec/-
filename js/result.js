async function loadResult(){
    const result = {
            targetStartTime: sessionStorage.getItem('targetStartTime'),
            targetEndTime: sessionStorage.getItem('targetEndTime'),
            targetStepTime: sessionStorage.getItem('targetStepTime'),
            targetSheetNameList: sessionStorage.getItem('targetSheetNameList'),
            dates: sessionStorage.getItem('dates'),
            data: sessionStorage.getItem('data'),
            targetAttendees: sessionStorage.getItem('targetAttendees'),
            targetQuorumC: sessionStorage.getItem('targetQuorumC'),
            targetQuorumUC: sessionStorage.getItem('targetQuorumUC'),
            targetMtgTimeC: sessionStorage.getItem('targetMtgTimeC'),
            targetMtgTimeUC: sessionStorage.getItem('targetMtgTimeUC')
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
    const tbody = document.getElementById('member-table-body')
    const quorumCInput = document.getElementById('quorum-gkc-input')
    const quorumUCInput = document.getElementById('quorum-gkuc-input')
    const mtgTimeCInput = document.getElementById('mtgtime-gkc-input')
    const mtgTimeUCInput = document.getElementById('mtgtime-gkuc-input')

    const tableBodies = {gkc:gkcTableBody, gkuc:gkucTableBody}
    const numberTableBodies = {gkc:gkcNumberTableBody, gkuc:gkucNumberTableBody}

    //集計オプション
    const targetAttendees = result.targetAttendees
    for (const person of targetAttendees){
        const MemberTemplate = document.getElementById('member-row-template')
        const newTr = MemberTemplate.content.cloneNode(true).firstElementChild

        const origin = newTr.querySelector('.select-origin')
        const name = newTr.querySelector('.input-name')
        const need = newTr.querySelector('.select-need')

        origin.value = person.origin
        name.value = person.name
        if (person.need.includes('gkc') && person.need.includes('gkuc')){
            need.value = '両方'
        }else if (!person.need){
            need.value = 'なし'
        } else {
            need.value = person.need
        }

        tbody.appendChild(newTr)
    }
    quorumCInput.value = result.targetQuorumC
    quorumUCInput.value = result.targetQuorumUC
    mtgTimeCInput.value = result.targetMtgTimeC
    mtgTimeUCInput.value = result.targetMtgTimeUC

    //各人のシート名表示
    for (const target of targetSheetNameList){
        const optionElement = document.createElement('option')
        optionElement.textContent = target
        optionElement.value = target
        nameSelectElement.appendChild(optionElement)
    }

    //投稿状況表示
    const postStatusElement = document.getElementById('post-status')
    const postStatus = sessionStorage.getItem('postStatus')
    postStatusElement.textContent = postStatus

    //タイムバー作成
    const timeRuler = document.createElement('div')
    const tickCount = (targetEndTime + 1 - targetStartTime) / targetStepTime
    timeRuler.className = 'time-ruler'

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

        //回答したかの確認
        const responseInfoElement = document.getElementById('response-info')
        const respondentList = sessionStorage.getItem('respondentList')
        if(respondentList.includes(name)){
            responseInfoElement.textContent = '回答済み'
        } else {
            responseInfoElement.textContent = '未回答'
        }
    } catch(e){
        alertError(e)
    } finally{
        enable()
    }
}
  
async function recalculate() {
    try{
        disable()
        document.body.style.cursor = 'wait';

        const action = "recalculate"
        const attendees = JSON.parse(sessionStorage.getItem('attendees'))

        const memberRows = document.getElementsByClassName('member-row')
        if (memberRows && !memberRowsCheck(memberRows)){
            alert('出席者の表に空欄が含まれます。')
            return
        }

        const targetQuorumC = document.getElementById('quorum-gkc-input').value
        const targetQuorumUC = document.getElementById('quorum-gkuc-input').value
        const targetMtgTimeC = document.getElementById('mtgtime-gkc-input').value
        const targetMtgTimeUC = document.getElementById('mtgtime-gkuc-input').value

        if (!targetQuorumC|| !targetMtgTimeC || !targetQuorumUC || !targetMtgTimeUC){
            alert('定足数または会議時間が未入力です。')
            return
        }

        const targetAttendees = []
        for (let j = 0; j < memberRows.length; j++){
            const rowData = []
            rowData.push(memberRows[j].querySelector('.select-origin').value)
            const name = memberRows[j].querySelector('.input-name').value
            const need = memberRows[j].querySelector('.select-need').value
            
            if(!attendees.includes(name)){
                const response = confirm(`${name}さんはデフォルト回答者（設定モード）に含まれませんが、続行しますか？`)
                if(!response){return}
            }
            rowData.push(name)

            if(need === '両方'){
                rowData.push('gkc,gkuc')
            } else {
                rowData.push(need)
            }
            targetAttendees.push({origin:rowData[0], name:rowData[1], need:rowData[2]})
        }

        const dataObj = {
            action:action, 
            targetQuorumC:targetQuorumC,
            targetQuorumUC:targetQuorumUC,
            targetMtgTimeC:targetMtgTimeC,
            targetMtgTimeUC:targetMtgTimeUC,
            targetAttendees:targetAttendees
        }

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

function deleteMtg(deleteMtgBtn) {
    disable()

    const memberRow = deleteMtgBtn.closest('tr')

    memberRow.remove()
    enable()
}

function addMtg(){
    disable()

    const tbody = document.getElementById('table-body')
    const template = document.getElementById('table-template')
    const newTr = template.content.cloneNode(true).firstElementChild

    tbody.appendChild(newTr)

    enable()
}

function addMember(){
    disable()

    const tbody = document.getElementById('member-table-body')
    const template = document.getElementById('member-row-template')
    const newTr = template.content.cloneNode(true).firstElementChild

    tbody.appendChild(newTr)

    enable()
}

function deleteMember(deleteMemberBtn) {
    disable()

    const memberRow = deleteMemberBtn.closest('tr')

    memberRow.remove()
    enable()
}

async function postToShuae(){
    try{
        disable()

        const tableRows = document.getElementsByClassName('mtg-settings')
        const postStatus = document.getElementById('post-status')

        const action = "postToShuae"
        const datetime = {gkc:{date:[], time:[], faceToFace:[]}, gkuc:{date:[], time:[], faceToFace:[]}}
        const gkcdate = datetime.gkc.date
        const gkucdate = datetime.gkuc.date
        const gkcTime = datetime.gkc.time
        const gkucTime = datetime.gkuc.time
        const gkcFaceToFace = datetime.gkc.faceToFace
        const gkucFaceToFace = datetime.gkuc.faceToFace

        for (let i = 0; i < tableRows.length; i++){
            const mtgKind = tableRows[i].querySelector('.kind-select').value
            const mtgDate = tableRows[i].querySelector('.date-mtg').value
            const mtgTime = tableRows[i].querySelector('.time-mtg').value

            if (!mtgKind || !mtgDate || !mtgTime){
                alert('入力欄の全部または一部が未入力です。')
                return
            }

            if(mtgKind.includes('gkc')){
                gkcdate.push(mtgDate)
                gkcTime.push(mtgTime)
                if(mtgKind.includes('対面')){
                    gkcFaceToFace.push(true)
                } else {
                    gkcFaceToFace.push(false)
                }
            } else if(mtgKind.includes('gkuc')){
                gkucdate.push(mtgDate)
                gkucTime.push(mtgTime)
                if(mtgKind.includes('対面')){
                    gkucFaceToFace.push(true)
                } else {
                    gkucFaceToFace.push(false)
                }
            }
        }

        if (postStatus.textContent.includes('投稿済み')){
            if(!confirm('既に投稿済みですが再投稿しますか？')){return}
        } else {
            if(!confirm('shuae投稿しますか？')){return}
        }

        const dataObj = {action:action, datetime:datetime}
        console.log(dataObj)
        const result = await postGAS(dataObj)
        sessionStorage.setItem('postStatus', '投稿済み')

        prompt(`shuae投稿が完了しました。リロードします。\nSlack文面：`,result.SlackMsg)
        sessionStorage.setItem('isVisited','false')
        location.reload()
    } catch(e) {
        alertError(e)
    } finally{
        enable()
    }

}

document.addEventListener('DOMContentLoaded', async()=> {
    const personalDataBtn = document.getElementById('btn-name-search')
    personalDataBtn.addEventListener('click', () => getPersonalData())

    const addMemberBtn = document.getElementById('btn-member-add')
    addMemberBtn.addEventListener('click', () => {addMember()})

    const memberTable = document.getElementById('member-table')
    memberTable.addEventListener('click',(e)=>{
        if (e.target && e.target.classList.contains('btn-delete-member')){
            const deleteMemberBtn = e.target
            deleteMember(deleteMemberBtn)
        }
    })

    const recalculateBtn = document.getElementById('btn-recalculate')
    recalculateBtn.addEventListener('click', ()=> {recalculate()})
    
    const addMtgBtn = document.getElementById('btn-add')
    addMtgBtn.addEventListener('click', ()=> {addMtg()})

    const table = document.getElementById('table')
    table.addEventListener('click',(e)=>{
        if (e.target && e.target.classList.contains('btn-delete')){
            const deleteMtgBtn = e.target
            deleteMtg(deleteMtgBtn)
        }
    })

    const postToShuaeBtn = document.getElementById('btn-post')
    postToShuaeBtn.addEventListener('click', ()=> {postToShuae()})

    const isVisited = sessionStorage.getItem('isVisited')
    if(!isVisited || JSON.parse(isVisited) !== true){
        await load()
    }

    await loadResult()
    //ローディング画面の削除
    const loader = document.getElementById('loading-screen');
    loader.classList.add('loaded');
})
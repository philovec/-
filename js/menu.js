test()
async function test() {
    

console.time("timer")
const btnForm = document.getElementById('btn-form')
const btnResult = document.getElementById('btn-result')
const btnSettings = document.getElementById('btn-settings')

btnForm.addEventListener('click',()=>{
    window.location.href = '../html/user-form.html'
})
btnResult.addEventListener('click',()=>{
    window.location.href = '../html/result.html'
})
btnSettings.addEventListener('click',()=>{
    window.location.href = '../html/settings.html'
})
await load()
console.timeEnd("timer")
}
async function load(){
    try{
        const action = "load"
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

        Object.keys(result).forEach(key => {
            sessionStorage.setItem(key,JSON.stringify(result[key]))
        })
    } catch(e){
        alertError(e)
    } finally{
        const loader = document.getElementById('loading-screen');
        loader.classList.add('loaded');
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
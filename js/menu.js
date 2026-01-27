document.addEventListener('DOMContentLoaded', async ()=> {
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

    const isVisited = sessionStorage.getItem('isVisited')
    if(!isVisited || JSON.parse(isVisited) !== true){
        await load()
    }
    //ローディング画面の削除
    const loader = document.getElementById('loading-screen');
    loader.classList.add('loaded');
})
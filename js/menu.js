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
const mic = document.getElementById('img-micro');
const componentStart = document.getElementById('gameStart');
const buttonPlay = document.getElementById('button-play');

buttonPlay.addEventListener('click', () => {

    mic.style.display = 'none';
    buttonPlay.style.display = 'none';
    componentStart.style.display = 'block';

    localStorage.setItem('starting', true)
})



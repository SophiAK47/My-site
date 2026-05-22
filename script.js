const gameBoard = document.getElementById('game-board');
const startBtn = document.getElementById('start-btn');
const msgDisplay = document.getElementById('game-message');
const roundDisplay = document.getElementById('round-val');
const popup = document.getElementById('feedback-popup');
const popupEmoji = document.getElementById('feedback-emoji');
const popupText = document.getElementById('feedback-text');

// Visual layer container elements
const gameContainer = document.querySelector('.game-container');
const fxLayer = document.createElement('div');
fxLayer.classList.add('fx-layer');
gameContainer.appendChild(fxLayer);

/* --- AUDIO TRACK CONFIGURATION --- */
// 1. Shuffling Phase: Kahoot 10-Second Countdown Music
const bgMusic = new Audio('https://myinstants.com/media/sounds/kahoot-lobby-music-10-sec-timer.mp3');
bgMusic.volume = 0.5;

// 2. Normal Round Win: Standard Correct Answer Sound Effect
const soundCorrectRound = new Audio('https://myinstants.com/media/sounds/correct-answer.mp3');
soundCorrectRound.volume = 0.5;

// 3. Round 10 Ultimate Win Sound: Victory Fanfare Sfx
const soundRound10Victory = new Audio('https://assets.mixkit.co/active_storage/sfx/2020/2020-84.wav');
soundRound10Victory.volume = 0.6;

// 4. Final Game Victory Outro Background: DJ Khaled - "All I Do Is Win"
const soundGrandWin = new Audio('https://myinstants.com/media/sounds/all-i-do-is-win-chorus.mp3');
soundGrandWin.volume = 0.6;

// 5. Game Over Phase: Brawl Stars Defeat Theme OST
const soundLose = new Audio('https://myinstants.com/media/sounds/brawl-stars-defeat.mp3');
soundLose.volume = 0.6;

// Mechanical click audio asset for wrapper transitions
const soundShuffle = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav');
soundShuffle.volume = 0.2;

let round = 1;
let numShells = 3;
let ballIndex = 0; 
let shellElements = [];
let isShuffling = false;
let canPick = false;

const winPhrases = [
  "Nice!",
  "Not too bad",
  "It’s too early to celebrate",
  "Win!"
];

const ball = document.createElement('div');
ball.classList.add('ball');
gameBoard.appendChild(ball);

function initRound() {
  shellElements.forEach(s => s.remove());
  shellElements = [];
  fxLayer.innerHTML = '';
  
  numShells = Math.min(3 + Math.floor((round - 1) / 2), 6); 
  roundDisplay.textContent = round;
  
  ballIndex = Math.floor(Math.random() * numShells);
  
  for (let i = 0; i < numShells; i++) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('shell-wrapper');
    wrapper.dataset.currentPos = i; 
    
    const shell = document.createElement('div');
    shell.classList.add('walnut-shell');
     
    wrapper.appendChild(shell);
    gameBoard.appendChild(wrapper);
    shellElements.push(wrapper);
  }
  
  positionShellsImmediately();
  hideBall();
}

function positionShellsImmediately() {
  const boardWidth = gameBoard.clientWidth;
  const shellWidth = 70;
  const availableSpace = boardWidth - shellWidth;
  const step = availableSpace / (numShells - 1);
  
  shellElements.forEach((shell) => {
    const pos = parseInt(shell.dataset.currentPos);
    shell.style.left = `${pos * step}px`;
  });
}

function updateBallPosition() {
  const winningShell = shellElements.find(shell => parseInt(shell.dataset.currentPos) === ballIndex);
  if (winningShell) {
    const leftPos = parseFloat(winningShell.style.left) + 35;
    ball.style.left = `${leftPos}px`;
  }
}

function showBall() {
  updateBallPosition();
  ball.style.display = 'block';
}

function hideBall() {
  ball.style.display = 'none';
}

async function startShuffle() {
  if (isShuffling) return;
  
  // Clean background audios
  soundCorrectRound.pause();
  soundCorrectRound.currentTime = 0;
  soundRound10Victory.pause();
  soundRound10Victory.currentTime = 0;
  soundGrandWin.pause();
  soundGrandWin.currentTime = 0;
  soundLose.pause();
  soundLose.currentTime = 0;
  
  isShuffling = true;
  canPick = false;
  startBtn.disabled = true;
  msgDisplay.textContent = "Keep your eyes on the walnut...";
  
  const winningShell = shellElements.find(shell => parseInt(shell.dataset.currentPos) === ballIndex);
  winningShell.classList.add('lifted');
  showBall();
  
  await sleep(1500);
  
  winningShell.classList.remove('lifted');
  await sleep(500);
  hideBall();
  
  // Kahoot Countdown music initializes precisely as movement loops trigger
  bgMusic.currentTime = 0;
  bgMusic.play().catch(e => console.log("Audio pipeline interaction required.", e));
  
  let speedCurve = 1200 - (Math.log2(round) * 350);
  const currentSpeed = Math.max(speedCurve, 340);
  
  const totalSwaps = 5 + round; 
  
  for (let i = 0; i < totalSwaps; i++) {
    soundShuffle.currentTime = 0;
    soundShuffle.play().catch(e => {});
    await swapTwoRandomShells(currentSpeed);
  }
  
  // Cut Kahoot loop instantly when shuffling steps stop
  bgMusic.pause();
  
  msgDisplay.textContent = "Where is the ball? Tap your choice!";
  isShuffling = false;
  canPick = true;
}

function swapTwoRandomShells(duration) {
  return new Promise((resolve) => {
    let posA = Math.floor(Math.random() * numShells);
    let posB = Math.floor(Math.random() * numShells);
    while (posA === posB) {
      posB = Math.floor(Math.random() * numShells);
    }
     
    const shellA = shellElements.find(shell => parseInt(shell.dataset.currentPos) === posA);
    const shellB = shellElements.find(shell => parseInt(shell.dataset.currentPos) === posB);
     
    const coordA = shellA.style.left;
    const coordB = shellB.style.left;
     
    shellA.style.transition = `left ${duration}ms ease-in-out`;
    shellB.style.transition = `left ${duration}ms ease-in-out`;
     
    shellA.style.left = coordB;
    shellB.style.left = coordA;
     
    shellA.dataset.currentPos = posB;
    shellB.dataset.currentPos = posA;
     
    if (ballIndex === posA) {
      ballIndex = posB;
    } else if (ballIndex === posB) {
      ballIndex = posA;
    }
     
    setTimeout(() => {
      shellA.style.transition = 'transform 0.3s ease';
      shellB.style.transition = 'transform 0.3s ease';
      resolve();
    }, duration + 20);
  });
}

gameBoard.addEventListener('click', (e) => {
  const clickedWrapper = e.target.closest('.shell-wrapper');
  if (!clickedWrapper || !canPick) return;
  
  canPick = false;
  
  const winningShell = shellElements.find(shell => parseInt(shell.dataset.currentPos) === ballIndex);
  winningShell.classList.add('lifted');
  showBall();
  
  const clickedPos = parseInt(clickedWrapper.dataset.currentPos);
  
  if (clickedPos === ballIndex) {
    if (round === 10) {
      // Play the Round 10 Victory Banner Chime Sound Effect
      soundRound10Victory.currentTime = 0;
      soundRound10Victory.play().catch(e => {});

      // Play "All I Do Is Win" backing tracking for final victory outro background scene
      soundGrandWin.currentTime = 0;
      soundGrandWin.play().catch(e => {});

      msgDisplay.textContent = "CONGRATULATIONS!";
      triggerPopup("🏆", "VICTORY!"); 
      spawnCoinsShower();
       
      setTimeout(() => {
        closePopup();
        round = 1;
        initRound();
        startBtn.disabled = false;
      }, 7000);
    } else {
      // Correct standard chime asset triggers
      soundCorrectRound.currentTime = 0;
      soundCorrectRound.play().catch(e => {});

      const randomWinText = winPhrases[Math.floor(Math.random() * winPhrases.length)];
      msgDisplay.textContent = "Correct!";
      triggerPopup("🎉", randomWinText);
      round++;
      
      setTimeout(() => {
        closePopup();
        winningShell.classList.remove('lifted');
        initRound();
        startBtn.disabled = false;
      }, 2500);
    }
  } else {
    // Defeat sequence track trigger
    soundLose.currentTime = 0;
    soundLose.play().catch(e => {});

    msgDisplay.textContent = "Game Over!";
    triggerPopup("🫵", "LOST! BOO!");
    throwTomatoes();
     
    round = 1; 
    setTimeout(() => {
      closePopup();
      winningShell.classList.remove('lifted');
      initRound();
      startBtn.disabled = false;
    }, 5500);
  }
});

function triggerPopup(emoji, text) {
  popupEmoji.textContent = emoji;
  popupText.textContent = text;
  popup.classList.add('show');
}

function closePopup() {
  popup.classList.remove('show');
}

function spawnCoinsShower() {
  let coinCount = 60;
  for (let i = 0; i < coinCount; i++) {
    setTimeout(() => {
      const coin = document.createElement('div');
      coin.classList.add('coin');
      coin.style.left = Math.random() * 100 + '%';
      coin.style.animationDuration = (Math.random() * 2 + 1.5) + 's';
      const size = Math.random() * 10 + 15;
      coin.style.width = size + 'px';
      coin.style.height = size + 'px';
      fxLayer.appendChild(coin);
    }, i * 60);
  }
}

function throwTomatoes() {
  let tomatoCount = 5;
  for (let i = 0; i < tomatoCount; i++) {
    setTimeout(() => {
      const splat = document.createElement('div');
      splat.classList.add('tomato-splat');
      splat.style.left = (Math.random() * 80 + 10) + '%';
      splat.style.top = (Math.random() * 80 + 10) + '%';
      fxLayer.appendChild(splat);
    }, i * 300);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

startBtn.addEventListener('click', startShuffle);
window.addEventListener('resize', positionShellsImmediately);

initRound();

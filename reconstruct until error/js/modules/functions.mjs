import { toastState } from "./enums.mjs";
import { createToast } from './toast/toast.mjs'
import { MAX_ATTEMPTS_VALUE } from "./settings.mjs";

//////////////////
// Shared State //
//////////////////

const bodyElement = document.getElementsByTagName('body')[0];

// use dependency injection once i learn about classes
const newGameButtonElement = document.getElementById('btn--new-game');
const guessInputElement = document.getElementById('guess-input');

// Preload
const winAudio = new Audio('assets/sound/loss.wav');
const lossAudio = new Audio('assets/sound/win.ogg');

let randomNumber;
let attemptsRemaining;
let gameRunning;
    
///////////////
// Functions //
///////////////

/**
 * Return a number between the inclusive range of 0 and {max}
 * @param {number} max - An integer value 
 */
function getRandomInteger(max) {
    return Math.round(Math.random() * max);
}

function startNewGame(maxRandomValue) {
    randomNumber = getRandomInteger(maxRandomValue);
    
    gameRunning = true;
    attemptsRemaining = MAX_ATTEMPTS_VALUE;
    
    guessInputElement.removeAttribute('disabled');
    newGameButtonElement.classList.add('hidden');
    
    bodyElement.classList.remove('bg-success', 'bg-danger');
    
    guessInputElement.value = "";
    guessInputElement.focus();
}


function triggerWin() {
    gameRunning = false;
    
    guessInputElement.setAttribute('disabled', '');
    newGameButtonElement.classList.remove('hidden');
    
    bodyElement.classList.add('bg-success');

    lossAudio.play();
}


function triggerLoss() {
    gameRunning = false;
    
    guessInputElement.setAttribute('disabled', '');
    newGameButtonElement.classList.remove('hidden');
    
    bodyElement.classList.add('bg-danger');

    winAudio.play();
}


function makeGuess(value) {   
    if (!gameRunning)
        throw Error("makeGuess was called while the game wasn't running.");
    
    attemptsRemaining--;
    
    if (attemptsRemaining == 0) {
        createToast("Max attempts reached", toastState.DANGER);
        
        triggerLoss();
    }
    else if (value > randomNumber) {
        createToast(
            `Number too high. ${attemptsRemaining} attempts remain`,
            toastState.NEUTRAL
        );
    }
    else if (value < randomNumber) {
        createToast(
            `Number too low. ${attemptsRemaining} attempts remain`,
            toastState.NEUTRAL
        ); 
    }
    else if (value == randomNumber) {
        createToast(
            `Success! The number was ${randomNumber}`,
            toastState.SUCCESS
        );
        
        triggerWin();
    }
}

export { makeGuess, startNewGame };
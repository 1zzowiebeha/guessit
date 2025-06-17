import { popoverState } from "./enums.mjs";
import { MAX_ATTEMPTS_VALUE } from "./settings.mjs";

//////////////////
// Shared State //
//////////////////

const bodyElement = document.getElementsByTagName('body')[0];

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


function generateUniquePopoverID() {
    const uid = crypto.randomUUID();
    
    return uid.slice(0, 12);
}

/**
 * Show a popover to the user with the given message.
 * @param {string} message
 * @param {number} state - a popoverState enum index
 */
function createPopover(message, state) {
    const popoverID = generateUniquePopoverID();
    
    // aside
    const asideElement = document.createElement('aside');
    asideElement.setAttribute('id', `popover-${popoverID}`);
    asideElement.classList.add('notification', 'notification--success');
    asideElement.setAttribute('popover', 'manual');
    
    // paragraph
    const paragraphElement = document.createElement('p');
    paragraphElement.textContent = message;
    asideElement.appendChild(paragraphElement);
    
    // close (single-use toggle) button 
    const buttonElement = document.createElement('button');
    buttonElement.classList.add('btn', 'btn--popover');
    buttonElement.setAttribute('popovertarget', `popover-${popoverID}`);

    // span
    const spanElement = document.createElement('span');
    spanElement.classList.add('sr-only');
    spanElement.textContent = 'Close';
    buttonElement.appendChild(spanElement);
    
    // add all to body
    bodyElement.prepend(asideElement);
    
    // show it
    asideElement.showPopover();
}


function startNewGame(maxRandomValue) {
    randomNumber = getRandomInteger(maxRandomValue);
    
    gameRunning = true;
    attemptsRemaining = MAX_ATTEMPTS_VALUE;
}


function triggerWin() {
    gameRunning = false;
    // turn screen green
    // play a sound
}


function triggerLoss() {
    gameRunning = false;
    // turn screen red
    // play a sound
}


function makeGuess(value) {    
    if (!gameRunning)
        throw Error("makeGuess was called while the game wasn't running.");
    
    if (attemptsRemaining == 0) {
        createPopover("Max attempts reached", popoverState.DANGER);
        triggerLoss();
    }
    
    if (value > randomNumber) {
        createPopover(
            `Number too high. ${attemptsRemaining} attempts remain`,
            popoverState.NEUTRAL
        );
        
        attemptsRemaining--;
    }
    else if (value < randomNumber) {
        createPopover(
            `Number too low. ${attemptsRemaining} attempts remain`,
            popoverState.NEUTRAL
        );
        
        attemptsRemaining--;    
    }
    else {
        createPopover(`Success! The number was ${randomNumber}`, popoverState.SUCCESS);
        triggerWin();
    }
}

export { makeGuess, startNewGame };
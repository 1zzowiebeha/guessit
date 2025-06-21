import { toastState } from "./enums.mjs";
import { MAX_ATTEMPTS_VALUE } from "./settings.mjs";

//////////////////
// Shared State //
//////////////////

const bodyElement = document.getElementsByTagName('body')[0];

let randomNumber;
let attemptsRemaining;
let gameRunning;

let popoverArray = [];

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


function generateUniqueToastID() {
    const uid = crypto.randomUUID();
    
    return uid.slice(0, 12);
}

function removeFromArray(element, array) {
    let arrayIndex = array.indexOf(element);
    
    let leftArray = array.splice(0, arrayIndex + 1);
    let rightArray = array.splice(arrayIndex, array.length)
    
    // 
    if (leftArray.length == 1) leftArray = null;
    if (rightArray.length == 1) rightArray = null;
    
    return leftArray.concat(rightArray);
}

/**
 * Show a popover to the user with the given message.
 * @param {string} message
 * @param {number} state - a popoverState enum index
 */
function createToast(message, state) {
    const popoverID = generateUniqueToastID();
    
    // aside
    const asideElement = document.createElement('aside');
    asideElement.setAttribute('id', `toast-${popoverID}`);
    asideElement.classList.add('toast', 'toast--success');
    asideElement.setAttribute('popover', 'manual');
    
    // paragraph
    const paragraphElement = document.createElement('p');
    paragraphElement.textContent = message;
    asideElement.appendChild(paragraphElement);
    
    // close (single-use toggle) button 
    const buttonElement = document.createElement('button');
    buttonElement.classList.add('btn', 'btn--toast');
    buttonElement.setAttribute('popovertarget', `toast-${popoverID}`);

    // span
    const spanElement = document.createElement('span');
    spanElement.classList.add('sr-only');
    spanElement.textContent = 'Close';
    buttonElement.appendChild(spanElement);
    
    // add all to body
    bodyElement.prepend(asideElement);
    
    // assign an anchor id for future popovers to position themselves relative to
    asideElement.style.anchorName = `--anchor-{popoverID}`;
    
    if (popoverArray.length > 0) {
        
    }
    popoverArray.add(asideElement);
    
    // when the popover is closed, remove it from the list of popovers
    asideElement.addEventListener('cancel', (event) => {
        let deletedPopoverAsideElement = event.target;
        
        
        //aasd
        popoverArray.remove(popoverID);
    });
    
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
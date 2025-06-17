import { popoverState } from "./enums.mjs";
import { MAX_ATTEMPTS_VALUE } from "./settings.mjs";

//////////////////
// Shared State //
//////////////////

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


/**
 * Show a popover to the user with the given message.
 * @param {string} message
 * @param {number} state - a popoverState enum index
 */
function createPopover(message, state) {
    // todo heehehehe
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
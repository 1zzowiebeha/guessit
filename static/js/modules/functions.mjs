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
    let elementIndex = array.indexOf(element);
    
    // retrieve portions of the array that don't include the element to be removed
    let leftArray = array.splice(0, elementIndex + 1);
    let rightArray = array.splice(elementIndex + 1, array.length)
    
    // if element was the first or last element of the array, it will be spliced into
    // its own array. don't include it in the final result.
    if (leftArray.length == 1) leftArray = null;
    if (rightArray.length == 1) rightArray = null;
    
    return leftArray.concat(rightArray);
}

function reorderPopoverPositions() {
    debugger;
    for (let i = 0; i < popoverArray.length; i++) {
        const previousElement = popoverArray[i - 1];
        const currentElement = popoverArray[i];
        if (previousElement !== undefined) {
            // Popovers after the first popover will use anchor positioning instead
            // of absolute. They will also use a transform for a slight gap between them.
            currentElement.style.position = "static";
            // currentElement.style.position = "static";
            
            // how2 animate position changes for anchors
            
            // Position current popover relative to previous popover
            const previousAnchorName = previousElement.style.anchorName;
            // correct style keys for these css properties
            currentElement.style.positionAnchor = previousAnchorName;
            currentElement.style.insetBlockEnd = `achor(${previousAnchorName} bottom)`;
            currentElement.style.insetInlineStart = `achor(${previousAnchorName} left)`;
        }
    }
}

/**
 * Show a popover to the user with the given message.
 * @param {string} message
 * @param {number} state - a popoverState enum index
 */
function createToast(message, toastState) {
    const popoverID = generateUniqueToastID();
    
    //// (old method) why must we give it a parent before we can set outerHTML?
    
    // templates do permit block display elements to be placed within inline display elements.
    // it isn't completely HTML5 compliant.
    const template = document.createElement('template');
    const toastComponent = `
        <aside id="toast-${popoverID}" class="toast ${toastState}" style="anchor-name: --anchor-${popoverID}" popover="manual">
            <div class="flex-wrapper">
                <p>${message}.</p>
                
                <button class="btn btn--toast" popovertarget="toast-${popoverID}" popovertargetaction="hide">
                    <span class="sr-only">Close</span>
                </button>
            </div>
        </aside>
    `;
    
    // remove whitespace text nodes to prevent them from being assigned to the firstChild value.
    template.innerHTML = toastComponent.trim();
    
    // thank God for this
    const toastAsideElement = template.content.firstChild;
    
    bodyElement.prepend(toastAsideElement);
    
    // add to array for re-ordering
    popoverArray.push(toastAsideElement);

    // when the toast is closed, remove it from the array of toasts
    toastAsideElement.addEventListener('cancel', (event) => {
        const closedToastElement = event.target;
        
        removeFromArray(closedToastElement, popoverArray);
        reorderPopoverPositions();
    });
    
    // position the new popover in relation to its siblings
    reorderPopoverPositions();
    
    // show it
    toastAsideElement.showPopover();
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
        createToast("Max attempts reached", toastState.DANGER);
        triggerLoss();
    }
    
    if (value > randomNumber) {
        createToast(
            `Number too high. ${attemptsRemaining} attempts remain`,
            toastState.NEUTRAL
        );
        
        attemptsRemaining--;
    }
    else if (value < randomNumber) {
        createToast(
            `Number too low. ${attemptsRemaining} attempts remain`,
            toastState.NEUTRAL
        );
        
        attemptsRemaining--;    
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
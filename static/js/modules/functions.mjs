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

function arrayWithoutElement(element, array) {
    let elementIndex = array.indexOf(element);
    
    // Retrieve sections of the array to the left & right of the element.
    let leftArray = array.slice(0, elementIndex);
    let rightArray = array.slice(elementIndex + 1, array.length)
    
    return leftArray.concat(rightArray);
}

function reorderPopoverPositions() {
    for (let i = 0; i < popoverArray.length; i++) {
        const previousElement = popoverArray[i - 1];
        const currentElement = popoverArray[i];
        
        if (previousElement !== undefined) {

            // how2 animate position changes for anchors
            
            const previousAnchorName = previousElement.style.anchorName;
            
            // Set specific position points for the current popover
            currentElement.style.insetBlockEnd = `anchor(${previousAnchorName} top)`;
            currentElement.style.insetInlineEnd = `anchor(${previousAnchorName} right)`;
            
            // Position current popover relative to prior adjacent sibling popover
            currentElement.style.positionAnchor = previousAnchorName;
        
            // Create a bit of a gap between the current and prior popover via transform
            
            // Popovers after the first popover will use anchor positioning instead
            // of absolute. Opt out of absolute positioning:
            currentElement.style.position = "static";
        }
        
        // Toast # 1 of the array - use absolute positioning instead of relative to
        //      a previous toast
        else if (previousElement === undefined) {
            currentElement.style.position = "absolute";
            currentElement.style.positionAnchor = "";
            currentElement.style.insetBlockEnd = "";
            currentElement.style.insetInlineEnd = "";
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
    toastAsideElement.addEventListener('toggle', (event) => {
        // don't remove popovers when they toggle open
        if (event.newState == "closed") {
            const closedToastElement = event.target;
            
            popoverArray = arrayWithoutElement(closedToastElement, popoverArray);
            
            // position the shown/hidden popover in relation to its siblings
            reorderPopoverPositions();
        }
        // then the popover will be hidden via display.
    });
    
    
    // performance boost:
    // just add styles based on the most recently pushed list item. don't reorder for every popover
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
import { toastState } from "./enums.mjs";
import { MAX_ATTEMPTS_VALUE } from "./settings.mjs";

//////////////////
// Shared State //
//////////////////

const bodyElement = document.getElementsByTagName('body')[0];

// use dependency injection once i learn about classes
const newGameButtonElement = document.getElementById('btn--new-game');
const guessInputElement = document.getElementById('guess-input');

let randomNumber;
let attemptsRemaining;
let gameRunning;

let popoverArray = [];

// Preload
const winAudio = new Audio('static/assets/sound/loss.wav');
const lossAudio = new Audio('static/assets/sound/win.ogg');
    
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

function anchorPopover(popoverElementArg) {
    // 0 1 2
    const currentElementIndex = popoverArray.indexOf(popoverElementArg);
    const previousElementIndex = currentElementIndex - 1;
    
    // Array.indexOf() returns -1 if nothing is found
    if (currentElementIndex == -1)
        throw Error(`popoverElement "${JSON.stringify(popoverElementArg)}" not found in popoverArray.`);
    
    // The first popover has no popovers underneath it visually (a popover with index of -1 doesn't exist).
    // The first popover should be absolutely positioned instead of anchor positioned.
    if (previousElementIndex == -1) {
        // these are defaults; no need to set these for creation.
        popoverElementArg.style.position = "absolute";
        popoverElementArg.style.positionAnchor = "";
        popoverElementArg.style.insetBlockEnd = "";
        popoverElementArg.style.insetInlineEnd = "";
    }
    else {
        const previousElement = popoverArray[previousElementIndex];
        const previousElementAnchorName = previousElement.style.anchorName;
        
        // Opt out of absolute positioning (not sure if this helps or does nothing but it could be confusing)
        popoverElementArg.style.position = "static";
            
        // Position current popover relative to prior adjacent sibling popover
        popoverElementArg.style.positionAnchor = previousElementAnchorName;
        
        // Set specific position points for the current popover
        popoverElementArg.style.insetBlockEnd = `anchor(${previousElementAnchorName} top)`;
        popoverElementArg.style.insetInlineEnd = `anchor(${previousElementAnchorName} right)`;
    }
}

function reorderPopoverPositions() {
    for (let i = 0; i < popoverArray.length; i++) {
        console.log(popoverArray)
        debugger;
        const previousElement = popoverArray[i - 1];
        const currentElement = popoverArray[i];
        
        if (previousElement !== undefined) {

            // how2 animate position changes for anchors
            
            const previousAnchorName = previousElement.style.anchorName;
            
            // Position current popover relative to prior adjacent sibling popover
            currentElement.style.positionAnchor = previousAnchorName;
            
            
            // Set specific position points for the current popover
            // currentElement.style.insetBlockEnd = `calc(anchor(${previousAnchorName} top) + 10px);`;
            currentElement.style.insetBlockEnd = `anchor(${previousAnchorName} top);`;
            
            // test - does it work if we replace via regex instead of setting via style?
            // const regex = /calc\(anchor\.+ top\ \+ 10px\)/g;
            
            // const match = currentElement.getAttribute('style').match(regex);
            // const updatedStyle = currentElement.getAttribute('style').replace(
            //     regex, `calc(anchor(${previousAnchorName} top) + 10px)`
            // );
            
            currentElement.style.insetInlineEnd = `anchor(${previousAnchorName} right)`;
            
            // Create a bit of a gap between the current and prior popover via transform
            // currentElement.style.transform = 'translate(0, 1rem)';
            
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

function closeToast(toastElement) {
    debugger;
    popoverArray = arrayWithoutElement(toastElement, popoverArray);
                
    toastElement.remove();
        
    // position the shown/hidden popover in relation to its siblings
    reorderPopoverPositions();
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
                <p>I'm --anchor-${popoverID}</p>
                
                <button class="btn btn--toast" aria-details="Close toast with an id of toast-${popoverID}.">
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
    
    // A flicker occurs if we use popovertarget & popovertarget action.
    // This is because when we use anchor positioning on the popover, it
    //  messes with the default anchor positioning that takes place with an invoker (popovertarget).
    // When behavior like this is messed with, it completely breaks the behavior / is indeterminate.
    // We need to implement our own popovertarget/popovertargetaction functionality in this case.
    // (also hence the aria-details and aria-expanded attributes in the above component!)
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button#popovertarget
    const toastCloseButton = document.querySelector(`#toast-${popoverID} .btn--toast`);
    
    // Connect toast close button functionality
    toastCloseButton.addEventListener('click', () => closeToast(toastAsideElement));
    
    // add to array for re-ordering
    popoverArray.push(toastAsideElement);

    // When the toast is closed, remove from the popoverArray and reorder toasts
    // It must be beforetoggle, since toggle close (after popover is hidden) applies styling which causes
    //     a visual flicker to occur due to display none messing with the anchor positioning
    // toastAsideElement.addEventListener('beforetoggle', (event) => {
    //     // don't remove popovers when they toggle open
    //     if (event.newState == "closed") {
    //         const closedToastElement = event.target;
    //         // hide before we reorder everything, since if it is below
    //         //     reorderPopoverPositions(), it will position itself to the top left
    //         //     until the default toggle behavior occurs after this event hook function
    //         // closedToastElement.style.display = "none";
            
    //         // If we remove the element in beforetoggle, it crashes the page (bug? or null ref...)
                        
    //         popoverArray = arrayWithoutElement(closedToastElement, popoverArray);
    //     }
    // });
    
    // toastAsideElement.addEventListener('toggle', (event) => {
    //     if (event.newState == "closed") {
    //         const closedToastElement = event.target;
    //     }
    // });
    
    anchorPopover(toastAsideElement);
    
    // Show popover
    toastAsideElement.showPopover();
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
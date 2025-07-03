import { generateUniqueID, isString } from './helper_functions.mjs';

// Shared state, internal to this file
// Would be better suited for a "Popover" class.
// (I'll refactor this once I learn about JS OOP)
let visiblePopovers = [];
let closeAnimatingPopovers = [];
let closeAnimationCompletedPopovers = [];
let autoTimeoutData = [];

function isPopoverClosing(popoverElementArg) {
    return closeAnimatingPopovers.includes(popoverElementArg)
           || closeAnimationCompletedPopovers.includes(popoverElementArg);
}

/**
 * Add a new toast component to the DOM
 * and setup its functionality.
 */
function createToast(message = "Sample Text", toastModifierClass = "") {
    if (!isString(message))
        throw new Error("message argument must be a string.")
    if (!isString(toastModifierClass))
        throw new Error("toastModifierClass argument must be a string.")
    
    const uniqueID = generateUniqueID();
    
    const template = document.createElement('template');
    const toastComponent = `
        <div id="toast-${uniqueID}" class="toast" popover="manual">
            <div class="grid-wrapper">
                <p class="toast__text">Default text!</p>

                <button class="btn btn--toast">
                    <span class="sr-only">
                        Close
                    </span>
                </button>
            </div>
        </div>
    `;
    // remove whitespace text nodes to prevent them from being assigned to the firstChild value.
    template.innerHTML = toastComponent.trim();
    
    // thank God for this. creating elements and setting properties individually is too much to manage.
    const popoverElement = template.content.firstChild;
    
    if (toastModifierClass != "")
        // Add BEM modifier to popover
        popoverElement.classList.add(toastModifierClass);
    
    // Set toast's paragraph text
    template.content.querySelector('.toast__text').textContent = message;
    
    // Set popover's anchor name for other popovers to position themselves relative to this one
    popoverElement.style.anchorName = `--toast-${uniqueID}`;
    
    // Add popover close functionality to popover's close button
    const popoverCloseButton = template.content.querySelector(`#toast-${uniqueID} .btn--toast`);
    
    popoverCloseButton.addEventListener('click', () =>
        closePopover(popoverElement)
    );
    
    // Add popover to the top of the popover container
    const popoverContainer = document.getElementById('popover-container');
    popoverContainer.append(popoverElement);
    
    anchorPopover(popoverElement);
    
    // Add to the list of visible popovers for re-ordering purposes.
    visiblePopovers.push(popoverElement);
    
    popoverElement.showPopover();
    
    console.warn("createToast():");
    console.log({popoverElement});
    console.log({visiblePopovers});
    console.log({closeAnimatingPopovers});
    console.log({closeAnimationCompletedPopovers});
    
    // Automatically close after 6 seconds.
    // setTimeout is an asynchronous function!!!! that's why it's hard to debug
    let timeoutID;
    timeoutID = setTimeout(() => {        
        console.warn("Auto close after 6 seconds. Popover not yet in close state:");
        console.log({popoverElement});
        console.log({visiblePopovers});
        console.log({closeAnimatingPopovers});
        console.log({closeAnimationCompletedPopovers});
        
        closePopover(popoverElement);
    }, 6000)
    
    autoTimeoutData.push({timeoutID, popoverElement});
}

/**
 * Add anchor styling to a popover.
 * Intended for the most recently added popover.
 */
function anchorPopover(currentPopoverElement) {
    const priorPopoverElement = currentPopoverElement.previousElementSibling;

    if (priorPopoverElement !== null) {
        // Get prior adjacent sibling's anchor name
        const priorPopoverAnchorName = priorPopoverElement.style.anchorName;

        // Override absolute positioning style for `toast` style class
        currentPopoverElement.style.position = "static";

        // Position current popover relative to prior adjacent sibling popover's anchor name
        currentPopoverElement.style.positionAnchor = priorPopoverAnchorName;

        // Set specific position points for the current popover. Add a 10px vertical gap between popovers.
        currentPopoverElement.style.insetBlockEnd = `calc(anchor(${priorPopoverAnchorName} top) + 10px)`;
        currentPopoverElement.style.insetInlineEnd = `anchor(${priorPopoverAnchorName} right)`;
    }
    // No prior sibling toast element. Ensure the first toast in the DOM is
    //      positioned absolutely for all the other adjacent popovers to chain anchors from.
    // Note: This code will apply to the first toast in the DOM even if it
    //      remains in its place. So a minute performance increase is possible unless JS
    //      views this redundancy as a NOP.
    else {
        // Set absolute position. Default inset constituents apply by default to
        //  absolute `toast` class style rules.
        currentPopoverElement.style.position = "absolute";

        // No anchor for this fella.
        currentPopoverElement.style.positionAnchor = "";

        // No relative position details for the first toast.
        currentPopoverElement.style.insetBlockEnd = "";
        currentPopoverElement.style.insetInlineEnd = "";
    }
}

/**
 * Play the close animation on a popover.
 * Garbage collect animated popovers once all animations have completed.
 */
function closePopover(popoverElementArg) {  
    // Don't mess up state by closing a popover twice.
    // (This could occur if both closeAllPopovers() and a manual close invoke sequentially)
    // (Or if an async task occurs right when closeAllPopovers() invokes closePopover()).
    if( isPopoverClosing(popoverElementArg) )
        return;
    
    const popoverElementAutoTimeoutData = autoTimeoutData.find(
        (timeoutData) => timeoutData.popoverElement.id == popoverElementArg.id
    );
    
    // If an auto-close is scheduled for this popover, cancel the task
    // ... to avoid race conditions and duplicate data.
    // (idk exactly why visible the visiblePopovers array would still have the popover.)
    // (i'll need to think deeper about it)
    if (popoverElementAutoTimeoutData !== undefined) {
        clearTimeout(popoverElementAutoTimeoutData.timeoutID);
        
        // Remove cleared async task from the array
        autoTimeoutData = autoTimeoutData.filter(
            (timeoutData) => timeoutData !== popoverElementAutoTimeoutData
        );
    }
    
    console.log(popoverElementArg, " not found within closeAnimatingPopovers nor closeAnimationCompletedPopovers");
    console.warn("closePopover(). Popover not yet in close state:");
    console.log({popoverElementArg});
    console.log({visiblePopovers});
    console.log({closeAnimatingPopovers});
    console.log({closeAnimationCompletedPopovers});
            
    // We want to keep them around so that any dependencies for anchors
    //  don't disappear and cause parent popover anchors to break.
    closeAnimatingPopovers.push(popoverElementArg);
      
    // Play the closing animation
    popoverElementArg.classList.add("closing");
    
    // Somehow visible popovers aren't being removed from the array
    // ... when I add popovers onto ones that are in the process of closing...
    
    popoverElementArg.addEventListener('animationend', (event) => {
        if (event.animationName == "toast-hide") {
            // Close animation has finished for this popover.
            // Remove from the array that tracks popovers playing out their close animation.
            closeAnimatingPopovers = closeAnimatingPopovers.filter(
                (closingPopoverElement) => closingPopoverElement !== popoverElementArg
            );
            
            // Add popover to array of those that have completed their closing animation.
            closeAnimationCompletedPopovers.push(popoverElementArg);
            
            // All popovers have finished playing out their close animation.
            // We can safely garbage collect closed popovers without premature animation cutoff.
            // Synchronous / Callback architecture prevents race conditions here.
            if (closeAnimatingPopovers.length == 0) {
                // Remove popovers from the visible array if they've completed their animation.
                visiblePopovers = visiblePopovers.filter(
                    (visiblePopoverElement) => !closeAnimationCompletedPopovers.includes(visiblePopoverElement)
                );
            
                reorderVisiblePopovers();
                
                // Garbage collect hidden popovers
                closeAnimationCompletedPopovers.map((hiddenPopoverElement) => {
                    // Hide the popovers only after we reorder visible popovers.
                    
                    // If this logic occurs beforehand, then the anchor positioning for the visible popovers will
                    //  ... break, since popovers higher in the chain depend on ones lower in the DOM chain
                    //  ... for positioning. The popovers above the removed popover will statically position
                    //  ... in the corner of the page due to a lack of a position-anchor.
                    hiddenPopoverElement.hidePopover();
                    hiddenPopoverElement.remove();
                })
                
                // Clear both arrays.
                closeAnimatingPopovers = [];
                closeAnimationCompletedPopovers = [];
            }
        }
    });
}

function closeAllPopovers() {
    for (const popoverElement of visiblePopovers) {
        // Cancel all async tasks to prevent race conditions & duplicate data
        autoTimeoutData.map((timeoutData) => clearTimeout(timeoutData.timeoutID));
        autoTimeoutData = []; // Clear timeout data
        
        console.warn("closeAllPopovers(). Popover not yet in close state:");
        console.log({popoverElement});
        console.log({visiblePopovers});
        console.log({closeAnimatingPopovers});
        console.log({closeAnimationCompletedPopovers});
        closePopover(popoverElement);
    }
}

/**
 * Reorder visible popovers to close gaps.
 */
function reorderVisiblePopovers() {
    for (let i = 0; i < visiblePopovers.length; i++) {
        const previousPopoverElement = visiblePopovers[i - 1];
        const currentPopoverElement = visiblePopovers[i];

        // Perhaps something is breaking due to popovertarget's anchor behavior:
        // https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button#popovertarget

        // Current iteration of the array is for a toast later in the DOM, after the
        //  first absolute positioned toast. Anchor position these toasts
        //  onto the previous toast in the DOM to achieve positioning relative to another toast.
        if (previousPopoverElement !== undefined) {
            const previousAnchorName = previousPopoverElement.style.anchorName;

            // Position current popover relative to prior adjacent sibling popover
            currentPopoverElement.style.positionAnchor = previousAnchorName;

            // Set specific position points for the current popover
            currentPopoverElement.style.insetBlockEnd = `calc(anchor(${previousAnchorName} top) + 10px)`;
            currentPopoverElement.style.insetInlineEnd = `anchor(${previousAnchorName} right)`;

            // Popovers after the first popover will use anchor positioning instead
            // of absolute. Opt out of absolute positioning for clarity:
            currentPopoverElement.style.position = "static";
        }

        // Current iteration of the popovers array is for the first toast.
        // Use absolute posiitoning instead of anchor positioning relative to another toast.
        else if (previousPopoverElement === undefined) {
            currentPopoverElement.style.position = "absolute";
            currentPopoverElement.style.positionAnchor = "";
            currentPopoverElement.style.insetBlockEnd = "";
            currentPopoverElement.style.insetInlineEnd = "";
        }
    }
}

export { createToast, closeAllPopovers };
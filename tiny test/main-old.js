let visiblePopovers = [];
let closingPopovers = [];
let closeAnimationCompletedPopovers = [];


function reorderPopovers() {
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

/**
 * Add anchor styling to popovers above the last in the DOM.
 * The last popover in the DOM hierarchy is positioned absolute in the bottom right.
 * It has no previous siblings.
 */
function anchorPopover(currentPopoverElement) {
    const priorPopoverElement = currentPopoverElement.previousElementSibling;

    if (priorPopoverElement !== null) {
        // Get prior adjacent sibling's anchor name
        const priorPopoverAnchorName = priorPopoverElement.style.anchorName;

        // Override absolute positioning style for .toast
        currentPopoverElement.style.position = "static";

        // Position current popover relative to prior adjacent sibling popover's anchor name
        currentPopoverElement.style.positionAnchor = priorPopoverAnchorName;

        // Set specific position points for the current popover
        currentPopoverElement.style.insetBlockEnd = `calc(anchor(${priorPopoverAnchorName} top) + 10px)`;
        currentPopoverElement.style.insetInlineEnd = `anchor(${priorPopoverAnchorName} right)`;
    }
    // No prior sibling toast element. Ensure the first toast in the DOM is
    //      positioned absolutely for all the other adjacent popovers to chain anchors from.
    // Note: This code will run on the first element the first time the toasts are anchored.
    //  These styles apply to toasts by default, so it is a bit redundant but works for future reorders.
    else {
        // Override absolute positioning style for .toast
        currentPopoverElement.style.position = "absolute";

        // No anchor for this fella.
        currentPopoverElement.style.positionAnchor = "";

        // No relative position details for the first toast.
        currentPopoverElement.style.insetBlockEnd = "";
        currentPopoverElement.style.insetInlineEnd = "";
    }
}

// function getClosingAnimatedPopovers() {
//     for (const popover of visiblePopovers) {
//         console.log(popover.getAnimations());
//     }
    
//     return visiblePopovers.filter(
//         (popover) => popover
//             .getAnimations()
//             .filter(
//                 (animation) => (console.log(animation.animationName), animation.animationName == "toast-out")
//             ).length == 1
//     );
// }

// function getSecondsFloatFromAnimationDuration(duration_string) {
    
//     // blah
//     const matches = duration_string.match(/(([\d\.]+)((?:ms)|(?:s)))|auto/);
//     console.log(duration_string);
    
//     if (!matches) return 2000;
    
//     if (matches.includes('ms')) {
//         return 2;
//     }
//     return 2;
// }

function closePopover(popoverElementArg) {  
    // Add to closingPopovers list to keep track of
    //  when all popover close animations complete so we can garbage collect.
    // We want to keep them around so that any dependencies for anchors
    //  don't disappear and cause parent popover anchors to break.
    // We could optimize this through some other means, but for now we'll try this.
    closingPopovers.push(popoverElementArg);
      
    // Play the closing animation
    popoverElementArg.classList.add("closing");
    
    popoverElementArg.addEventListener('animationend', (event) => {
        if (event.animationName == "toast-hide") {
            // Remove popover from those in the process of playing out
            //  their close animation.
            closingPopovers = closingPopovers.filter(
                (closingPopoverElement) => closingPopoverElement !== popoverElementArg
            );
            
            // Add popover to those that have completed their popover animation.
            closeAnimationCompletedPopovers.push(popoverElementArg);
            
            // All popovers have finished playing their close animation.
            // We can safely garbage collect without
            //  breaking any parent popovers dependent on child popovers
            //  for anchor positioning.
            if (closingPopovers.length == 0) {
                // Remove the popoverElementArg from the visiblePopovers array
                //  for re-ordering purposes
                visiblePopovers = visiblePopovers.filter(
                    (visiblePopoverElement) => !closeAnimationCompletedPopovers.includes(visiblePopoverElement)
                );
            
                reorderPopovers();
                
                // Garbage collect hidden popovers
                closeAnimationCompletedPopovers.map((hiddenPopoverElement) => {
                    // Hide the popovers only after we reorder visible popovers.
                    
                    // If this logic occurs before, then the anchor positioning for the visible popovers will
                    //  ... break, since popovers higher in the chain depend on ones lower in the DOM chain
                    //  ... for positioning. The popovers above the removed popover will statically position
                    //  ... in the corner of the page.
                    hiddenPopoverElement.hidePopover();
                    hiddenPopoverElement.remove();
                })
                
                // Clear both arrays.
                closingPopovers = [];
                closeAnimationCompletedPopovers = [];
            }
        }
    });
}

/**
 * Return the first 12 characters of a UUID as a string
 */
function generateUniqueToastID() {
    const uid = crypto.randomUUID();
    
    return uid.slice(0, 12);
}

/**
 * Add a new toast component to the DOM
 * and setup its functionality.
 */
function newPopover() {
    const uniqueID = generateUniqueToastID();
    
    const template = document.createElement('template');
    const toastComponent = `
        <div id="toast-${uniqueID}" class="toast" popover="manual">
            <div class="grid-wrapper">
                <p>Notification!</p>

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
}

/**
 * Assign close functionality to popover close buttons,
 * Add initial anchor positioning to popovers after the first
 *  absolutely positioned popover.
 * Assign component creation functionality to new popover button.
 */
function main() {
    const popoverElementNodeList = document.getElementsByClassName('toast');

    // why "Uncaught TypeError: Cannot read properties of null (reading 'addEventListener')" ?
    const newPopoverButton = document.getElementById('btn--new-popover');
    newPopoverButton.addEventListener('click', newPopover);
}

// the reason the first version of this behavior doesn't work might be due to a logic error somewhere
// in all popover code lmao. scrap v1 and move to this.
main();
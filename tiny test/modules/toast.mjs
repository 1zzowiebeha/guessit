import { generateUniqueID } from './functions.mjs';

// Shared state, internal to this file
// Would be better suited for a "Popover" class.
// (I'll refactor this once I learn about JS OOP)
let visiblePopovers = [];
let closeAnimatingPopovers = [];
let closeAnimationCompletedPopovers = [];

/**
 * Add a new toast component to the DOM
 * and setup its functionality.
 */
function newPopover() {
    const uniqueID = generateUniqueID();
    
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
    // We want to keep them around so that any dependencies for anchors
    //  don't disappear and cause parent popover anchors to break.
    closeAnimatingPopovers.push(popoverElementArg);
      
    // Play the closing animation
    popoverElementArg.classList.add("closing");
    
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

export { newPopover };
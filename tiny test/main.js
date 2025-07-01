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

function getClosingAnimatedPopovers() {
    for (const popover of visiblePopovers) {
        console.log(popover.getAnimations());
    }
    
    return visiblePopovers.filter(
        (popover) => popover
            .getAnimations()
            .filter(
                (animation) => (console.log(animation.animationName), animation.animationName == "toast-out")
            ).length == 1
    );
}

function getSecondsFloatFromAnimationDuration(duration_string) {
    
    // blah
    const matches = duration_string.match(/(([\d\.]+)((?:ms)|(?:s)))|auto/);
    console.log(duration_string);
    
    if (!matches) return 2000;
    
    if (matches.includes('ms')) {
        return 2;
    }
    return 2;
}

function closePopover(popoverElementArg) {  
    // Add to closingPopovers list to keep track of
    //  when all popover close animations complete so we can garbage collect.
    // We want to keep them around so that any dependencies for anchors
    //  don't disappear and cause parent popover anchors to break.
    // We could optimize this through some other means, but for now we'll try this.
    closingPopovers.push(popoverElementArg);
      
    // Play the closing animation
    popoverElementArg.classList.add("closing");
    
    // bugs to sort out:
    // closing a lot of popovers at once has an issue
    // closing popovers at different times in succession causes them to overlap as they animate?.. hmm...
    // once all closing animations occur, then reorder
    // const animations = popoverElementArg.getAnimations().map(
    //     (animation) => animation.effect.getKeyframes()
    //     // .getComputedTiming().activeDuration
    // );
    // get total time of animation. subtract a few milliseconds
    // then delete so that we know it's the hide animation
    // maybe we can look into the animations and await the correct one's finish
    // and do that for all animations? maybe...
    // console.log(animations);
    // const animationDuration = popoverElementArg.style.animationDuration;
    // let secondsUntilGarbageCollection = Math.min(
    //     0, getSecondsFloatFromAnimationDuration(animationDuration) - 0.1
    // );
    
    // setTimeout(() => {
    //     // Remove the passed popoverElementArg from the visiblePopovers array
    //     //  for re-ordering purposes
    //     visiblePopovers = visiblePopovers.filter(
    //         (visiblePopoverElement) => visiblePopoverElement !== popoverElementArg
    //     );
    
    //     reorderPopovers();
        
    //     // If display is set to none (a product of hidePopover), then anchor-position no longer works,
    //     //     ... and the element will appear in the top left corner of the page.
    //     // Hide the popover only after we reorder visible popovers.
    //     popoverElementArg.hidePopover();

    //     popoverElementArg.remove();
    // }, secondsUntilGarbageCollection);
    
    
    
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
                
                // If display is set to none (a product of hidePopover), then anchor-position no longer works,
                //     ... and the element will appear in the top left corner of the page.
                // Hide the popover only after we reorder visible popovers.
                popoverElementArg.hidePopover();
    
                popoverElementArg.remove();
                
                // Clear both arrays.
                closingPopovers = [];
                closeAnimationCompletedPopovers = [];
            }
        }
    });
                // use the visiblePopovers array to re-order the visible popovers
                
                // We need to wait until the toasts dependent on the one that has ended its
                //  animation have completed, since if we delete the one lowest in the chain the other dependents.
                // If we close three one second after the previous, the first will wait for the second,
                //  the first will finish then wait to remove itself by waiting for the second,
                //  the second will finish which will remove the first but the second is waiting for the third,
                // so the second's anchor position will break causing a weird position issue until the third
                // is finished at which point the 2nd and third can be removed.
                // We should wait for all popovers to close? idk.... maybe just reorder but then remove
                // once all animations are complete for garbage collection, and to still allow
                // old popovers to animate at their last position? i'll need to think about how
                // that will work...
                
                // let adjacentFollowingToastSiblingElement = popoverElementArg.nextSibling;
                // if (adjacentFollowingToastSiblingElement.style.animation) {
                //     adjacentFollowingToastSiblingElement.addEventListener('animationend', () => {
                //         reorderPopovers();
                        
                //         // if display is set to none, then anchor-position no longer works.
                //         // hide the popover only after we reorder visible popovers.
                //         popoverElementArg.hidePopover();
            
                //         popoverElementArg.remove();
                //     });
                // }
                // else {
                //         reorderPopovers();
                        
                //         // if display is set to none, then anchor-position no longer works.
                //         // hide the popover only after we reorder visible popovers.
                //         popoverElementArg.hidePopover();
            
                //         popoverElementArg.remove();
                // }
                //  still animating out will have no place to anchor to
        //     }
        // }
}

function generateUniqueToastID() {
    const uid = crypto.randomUUID();
    
    return uid.slice(0, 12);
}

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

    for (let i = 0; i < popoverElementNodeList.length; i++) {
        const popoverElement = popoverElementNodeList[i];

        // Add popover close functionality to popover's close button
        const popoverCloseButton = document.querySelector(`#${popoverElement.id} .toast__button`);
        popoverCloseButton.addEventListener('click', () =>
            closePopover(popoverElement)
        );


        // Add anchor positioning to override old absolute positioning.
        // Takes effect only if the popover is not the first in the DOM,
        //  as the first popover is absolute positioned in the bottom right of the viewport.
        anchorPopover(popoverElement);

        // Show the popover
        popoverElement.showPopover();

        // Add to the list of visible popovers for re-ordering purposes.
        visiblePopovers.push(popoverElement);
    }

    // why "Uncaught TypeError: Cannot read properties of null (reading 'addEventListener')" ?
    const newPopoverButton = document.getElementById('btn--new-popover');
    newPopoverButton.addEventListener('click', newPopover);
}

// the reason the first version of this behavior doesn't work might be due to a logic error somewhere
main();
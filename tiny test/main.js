let visiblePopovers = [];

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
    debugger;
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



function closePopover(popoverElementArg) {
    
    // assign a new array that doesn't contain the passed popoverElementArg
    visiblePopovers = visiblePopovers.filter(
        (visiblePopoverElement) => visiblePopoverElement !== popoverElementArg
    );

    // use the visiblePopovers array to re-order the visible popovers
    reorderPopovers();
    
    // if display is set to none, then anchor-position no longer works.
    // hide the popover only after we reorder visible popovers.
    popoverElementArg.hidePopover();

    popoverElementArg.remove();
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
                <p>Don't crash me now! ${uniqueID}</p>

                <button class="toast__button">
                    Close
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
    const popoverCloseButton = template.content.querySelector(`#toast-${uniqueID} .toast__button`);
    
    popoverCloseButton.addEventListener('click', () =>
        closePopover(popoverElement)
    );
    
    // Add popover to the top of the popover container
    const popoverContainer = document.getElementById('popover-container');
    popoverContainer.append(popoverElement);
    
    anchorPopover(popoverElement);
    
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
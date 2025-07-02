import { newPopover } from './modules/toast.mjs';

const newPopoverButton = document.getElementById('btn--new-popover');
newPopoverButton.addEventListener('click', newPopover);
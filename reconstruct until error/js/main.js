import { createToast } from './modules/toast/toast.mjs';
import { makeGuess, startNewGame } from './modules/functions.mjs';

const newPopoverButton = document.getElementById('btn--new-popover');
newPopoverButton.addEventListener('click', () => createToast());


///////////////
// Variables //
///////////////

// Hidden until win / loss:
const newGameButton = document.getElementById("btn--new-game");

const formElement = document.getElementById("game-form");
const numberInputElement = document.getElementById("guess-input");

const MAX_RANDOM_VALUE = numberInputElement.getAttribute('max');

////////////////////////
// Main Functionality //
////////////////////////

startNewGame(MAX_RANDOM_VALUE);


////////////////////
// Event Handlers //
////////////////////

newGameButton.addEventListener('click', function () {
    startNewGame(MAX_RANDOM_VALUE)
});


formElement.addEventListener('submit', (event) => {
    event.preventDefault(); // no GET request

    const formData = new FormData(formElement);

    // "guessed-number"
    const numberInputName = numberInputElement.getAttribute("name");

    // type checkmight break
    if (numberInputName === null)
        throw new Error(JSON.stringify(numberInputElement) + " must have 'name' attribute.");

    if (formData.has(numberInputName)) {
        const numberInputValue = formData.get(numberInputName);

        if (numberInputValue > 100)
            throw new Error("User tampered with input field. Input value is greater than 100.");
        else if (numberInputValue < 0)
            throw new Error("User tampered with input field. Input value is less than 0.");

        makeGuess(numberInputValue);
    }
});
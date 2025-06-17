import { makeGuess, startNewGame } from './modules/functions.mjs';

(() => {
    ///////////////
    // Variables //
    ///////////////
    
    const MAX_RANDOM_VALUE = numberInputElement.getAttribute('max');
    
    // Hidden until win / loss:
    const newGameButton = document.getElementById("btn--new-game"); 
    
    const formElement = document.getElementById("game-form"); 
    const numberInputElement = document.getElementById("guess-input");
    
    
    ////////////////////////
    // Main Functionality //
    ////////////////////////
    
    startNewGame(MAX_RANDOM_VALUE);
    
    
    ////////////////////
    // Event Handlers //
    ////////////////////
    
    newGameButton.addEventListener('click', function() {
        startNewGame(MAX_RANDOM_VALUE)
    });
    
    
    formElement.addEventListener('submit', (event) => {
        event.preventDefault(); // no GET request
        
        const formData = new FormData(formElement);
        
        if (numberInputElement.getAttribute("name") === null)
            throw new Error(JSON.stringify(numberInputElement) + " must have 'name' attribute.");
        
        if (numberInputElement.getAttribute("name") in formData.keys()) {
            const numberInputValue = formData[numberInputElement.getAttribute("name")];
            
            if (numberInputElement > 100)
                throw new Error("User tampered with input field. Input value is greater than 100.");
            else if (numberInputElement < 0)
                throw new Error("User tampered with input field. Input value is less than 0.");
            
            makeGuess(numberInputValue);
        }
    });
    
})();

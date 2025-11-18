const gameArea = document.getElementById("game-area");


async function selectRandomWord() {
    return fetch('/assets/wordle/fiveletterwords.txt')
        .then(response => response.text())
        .then(content => {
            let word_list = content.split("\n");
            let random = Math.floor(Math.random() * word_list.length);
            let newWord = word_list[random].toUpperCase();
            return newWord;
        });
    
}

let word;
let lettersInWord;
let currentRow;
let currentCol;
let correctLetters;
let closeLetters;
let wrongLetters;
let solved;
let failed;

async function newWord() {
    word = await selectRandomWord();
    lettersInWord = Array.from(word);
    word = "STARE";
    resetGame();
    // console.log(word)
}

function resetGame() {
    newWordButton.blur();
    currentRow = 0;
    currentCol = 0;
    correctLetters = [];
    closeLetters = [];
    wrongLetters = [];
    solved = false;
    failed = false;
    updateKeyboard();
    updateSolvedText();

    // clear guesses
    for (let i = 0; i < cells.length; i++) {
        for (let j = 0; j < cells[i].length; j++) {
            cells[i][j].textContent = "";
            cells[i][j].className = "letter-cell";
        }
    }
}

newWord();

// setup guess cells
let cells = [];
for (let i = 0; i < 6; i++) {
    let rowElement = document.createElement("div");
    rowElement.classList.add("letter-cell-row");
    let row = [];

    for (let j = 0; j < 5; j++) {
        let element = document.createElement("div");
        element.id = `cell${i}${j}`;
        element.classList.add("letter-cell")
        rowElement.appendChild(element);
        row.push(element);
    }

    cells.push(row);
    gameArea.appendChild(rowElement);
}

function getNextCell() {
    return cells[currentRow][currentCol];
}

function sendLetter(letter) {
    if (failed || solved) {
        return;
    }

    if (currentCol < 5) {
        getNextCell().textContent = letter;
        currentCol++;
    }
}

function deleteLetter() {
    if (failed || solved) {
        return;
    }
    if (currentCol >= 1) {
        cells[currentRow][currentCol-1].textContent = "";
        currentCol--;
    }
}

function submitWord() {
    if (currentCol != 5) {
        return;
    }

    checkWord(currentRow);
    currentCol = 0;
    currentRow++;

    if (currentRow == 6) {
        failed = true;
    }
    updateSolvedText();
}

function checkWord(row) {
    let copy = JSON.parse(JSON.stringify(lettersInWord));
    let results = ["wrong", "wrong", "wrong", "wrong", "wrong"];
    for (let i = 0; i < 5; i++) {
        let cellValue = cells[row][i].textContent;
        let cellRef = cells[row][i];

        if (word[i] === cellValue) {
            results[i] = "correct";
            copy.splice(copy.indexOf(cellValue),1);

            correctLetters.push(cellValue);

            // remove from close if applicable
            if (closeLetters.includes(cellValue)) {
                closeLetters.splice(closeLetters.indexOf(cellValue), 1);
            }
        }
    }

    for (let i = 0; i < 5; i++) {
        let cellValue = cells[row][i].textContent;
        let cellRef = cells[row][i];
        if (cellRef.classList.length > 1) {
            continue;
        }

        if (copy.includes(cellValue) && results[i] != "correct") {
            results[i] = "close";
            copy.splice(copy.indexOf(cellValue),1);

            closeLetters.push(cellValue);

        } else if (!correctLetters.includes(cellValue)) {
            wrongLetters.push(cellValue);
        }
    }

    // check if solved
    solved = true;
    for (let i = 0; i < results.length; i++) {
        if (results[i] != "correct") {
            solved = false;
        }
    }

    // set classes
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            switch (results[i]) {
                case "correct":
                    cells[row][i].classList.add("correct-cell");
                    break;
                case "close":
                    cells[row][i].classList.add("close-cell");
                    break;
                // case "wrong":
                //     cells[row][i].classList.add("wrong-cell");
                //     break;
            }

            cells[row][i].classList.add("checked-cell");
        }, i * 300);
    }

    updateKeyboard();
}

document.addEventListener("keydown", (e) => {
    if (/^[a-zA-Z]$/.test(e.key)) {
        sendLetter(e.key.toUpperCase());
    } else if (e.key == "Backspace") {
        deleteLetter();
    } else if (e.key == "Enter") {
        submitWord();
    }
});

// add legend
let legend = document.createElement("div");
legend.id = "legend";
gameArea.appendChild(legend);

let legendCorrect = document.createElement("div");
legendCorrect.textContent = "Correct";
legendCorrect.id = "legend-correct";
legendCorrect.classList.add("legend-item");
legend.appendChild(legendCorrect);

let legendClose = document.createElement("div");
legendClose.textContent = "Correct but wrong spot";
legendClose.id = "legend-close";
legendClose.classList.add("legend-item");
legend.appendChild(legendClose);

// add keyboard
let keyboard = document.createElement("div");
keyboard.id = "keyboard";
gameArea.appendChild(keyboard);

let keyOrders = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
let rowLengths = [11, 10, 7];

let keyboardKeys = [];
for (let i = 0; i < 3; i++) {
    let keyboardRow = document.createElement("div");
    let keyboardRowArr = [];
    keyboardRow.classList.add("keyboard-row");
    for (let j = 0; j < rowLengths[i]; j++) {
        let element = document.createElement("div");
        element.classList.add("keyboard-key");
        if (i == 0 && j == 10) {
            element.innerHTML = "&#8612;";
            element.classList.add("backspace-keyboard-key");
            element.addEventListener("click", () => {
                deleteLetter();
            });
        } else if (i == 1 && j == 9) {
            element.textContent = "Enter";
            element.classList.add("enter-keyboard-key");
            element.addEventListener("click", () => {
                submitWord();
            });
        } else {
            element.textContent = keyOrders[i][j];
            element.addEventListener("click", () => {
                sendLetter(keyOrders[i][j]);
            });
        }
        keyboardRow.appendChild(element);
        keyboardRowArr.push(element);
    }
    gameArea.appendChild(keyboardRow);
    keyboardKeys.push(keyboardRowArr);
}

function updateKeyboard() {
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < rowLengths[i]; j++) {
            if ((i == 0 && j == 10) || (i == 1 && j == 9)) {
                continue;
            }

            let key = keyboardKeys[i][j]
            key.className = "keyboard-key";
            if (correctLetters.includes(key.textContent)) {
                key.classList.add("correct-cell");
            } else if (closeLetters.includes(key.textContent)) {
                key.classList.add("close-cell");
            } else if (wrongLetters.includes(key.textContent)) {
                key.classList.add("wrong-cell");
            }
        }
    }
}

// buttons
let buttonContainer = document.createElement("div");
buttonContainer.id = "button-container";
gameArea.appendChild(buttonContainer);

let newWordButton = document.createElement("button");
newWordButton.id = "new-word-button";
newWordButton.textContent = "New Word";
newWordButton.onclick = newWord;
buttonContainer.appendChild(newWordButton);

// solved
let solvedText = document.createElement("div");
solvedText.id = "solved-text";
gameArea.appendChild(solvedText);

function updateSolvedText() {
    if (solved) {
        let message = "";
        switch (currentRow) {
            case 1:
                message = "guess! GOAT!"
                break;
            case 2:
                message = "guesses! Genius."
                break;
            case 3:
                message = "guesses! Not bad."
                break;
            case 4:
                message = "guesses! Well done!"
                break;
            case 5:
                message = "guesses! Decent."
                break;
            case 6:
                message = "guesses! Phew."
                break;
        }
        solvedText.textContent = `Solved in ${currentRow} ${message}`;
        solvedText.classList.add("show-solved-text");

    } else if (failed) {
        solvedText.textContent = `The word was: ${word}`;
        solvedText.classList.add("show-solved-text");
    } else {
        solvedText.textContent = "";
        solvedText.classList.remove("show-solved-text");
    }
}
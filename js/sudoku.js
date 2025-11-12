const gameArea = document.getElementById("game-area");

// disable dragging
document.body.ondragstart = () => {
    return false;
};

const numberChoices = [1,2,3,4,5,6,7,8,9];
let selectedNumber = 1;
let errorsPresent = false;

let difficulties = {
    "easy": 30,
    "medium": 40,
    "hard": 50,
    "expert": 60
}

let puzzle = [
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0]
]

let solution = puzzle.slice();
let solved = false;
let solvedEl = document.getElementById("solved");

function zeroOutPuzzle() {
    for (let i = 0; i < puzzle.length; i++) {
        zeroOutRow(i)
    }
}

function zeroOutRow(row) {
    for (let j = 0; j < puzzle[row].length; j++) {
        puzzle[row][j] = 0;
    }
}

function removeErrorClass() {
    for(let i = 0; i < cells.length; i++) {
        for (let j = 0; j < cells[i].length; j++) {
            cells[i][j].error = false;
        }
    }

    errorsPresent = false;
}

function createRandomPuzzle(difficulty) {
    zeroOutPuzzle();
    disableReadOnly();
    fillGrid();

    solution = JSON.parse(JSON.stringify(puzzle));

    // remove cells
    let removedCells = [];
    let removeNumber = difficulties[difficulty];
    for (let i = 0; i < removeNumber; i++) {
        let removedCellX = getRandom(numberChoices)-1;
        let removedCellY = getRandom(numberChoices)-1;
        if (removedCells.some(([x,y]) => x == removedCellX && y === removedCellY)) {
            i--;
            continue;
        }

        removedCells.push([removedCellX, removedCellY]);


        puzzle[removedCellY][removedCellX] = 0;
    }

    refreshBoard();
    enableReadOnly();
    resetTimer();
    refreshBoard();
}

function enableReadOnly() {
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (cells[i][j].value != 0) {
                cells[i][j].readOnly = true;
            }
        }
    }
}

function disableReadOnly() {
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            cells[i][j].readOnly = false;
        }
    }
}

function fillGrid(row=0, col=0) {
    if (row == 9) return true;
    let nextRow = col == 8 ? row + 1 : row;
    let nextCol = col == 8 ? 0 : col + 1;

    let possibleChoices = shuffleArray(numberChoices.slice());

    for (let choice of possibleChoices) {
        puzzle[row][col] = choice;

        if (validPuzzle()) { // valid so far
            if (fillGrid(nextRow, nextCol)) {
                return true; // success
            }
        }
    }

    puzzle[row][col] = 0; // reset on failure
    return false; // trigger backtracking
}

function findUsedNumbers(cells) {
    let values = [];
    cells.forEach(cell => {
        values.push(puzzle[cell[0]][cell[1]]);
    });
    return values;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        // pick a random index from 0..i
        const j = Math.floor(Math.random() * (i + 1));
        // swap elements
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function validPuzzle() {
    removeErrorClass();
    // refreshBoard();
    
    for (let i = 0; i < 9; i++) {
        checkColumn(i);
        checkRow(i);
        checkBox(i);
    }

    refreshBoard();
    return !errorsPresent;
}

function checkBox(box) {
    let boxStarts = {
        0: [0,0],
        1: [0,3],
        2: [0,6],
        3: [3,0],
        4: [3,3],
        5: [3,6],
        6: [6,0],
        7: [6,3],
        8: [6,6],
    }

    let boxStart = boxStarts[box];
    let seen = [];
    let conflictingNums = [];
    for (let i = boxStart[0]; i < boxStart[0] + 3; i++) {
        for (let j = boxStart[1]; j < boxStart[1] + 3; j++) {
            if (puzzle[i][j] != 0) {
                if (seen.includes(puzzle[i][j])) {
                    conflictingNums.push(puzzle[i][j]);
                } else {
                    seen.push(puzzle[i][j]);
                }
            }
        }
    }

    for (let i = boxStart[0]; i < boxStart[0] + 3; i++) {
        for (let j = boxStart[1]; j < boxStart[1] + 3; j++) {
            if (conflictingNums.includes(puzzle[i][j])) {
                cells[i][j].error = true;
                errorsPresent = true;
            }
        }
    }
}

function checkColumn(col) {
    let seen = [];
    let conflictingNums = [];
    for (let i = 0; i < 9; i++) {
        if (puzzle[i][col] != 0) {
            if (seen.includes(puzzle[i][col])) {
                conflictingNums.push(puzzle[i][col]);
            } else {
                seen.push(puzzle[i][col]);
            }
        }
    }

    // check same col for conflicting nums
    for (let i = 0; i < 9; i++) {
        if (conflictingNums.includes(puzzle[i][col])) {
            cells[i][col].error = true;
            errorsPresent = true;
        }
    }
}

function checkRow(row) {
    let seen = [];
    let conflictingNums = [];
    for (let i = 0; i < 9; i++) {
        if (puzzle[row][i] != 0) {
            if (seen.includes(puzzle[row][i])) {
                conflictingNums.push(puzzle[row][i]);
            } else {
                seen.push(puzzle[row][i]);
            }
        }
    }

    // check same row for conflicting nums
    for (let i = 0; i < 9; i++) {
        if (conflictingNums.includes(puzzle[row][i])) {
            cells[row][i].error = true;
            errorsPresent = true;
        }
    }
}

function getRandom(options) {
    return options[Math.floor(Math.random() * options.length)];
}

class SudokuCell {
    constructor(initialValue, x, y) {
        this.value = initialValue;
        this.x = x;
        this.y = y;
        this.error = false;
        this.readOnly = false;
        this.boxX = Math.floor(this.x / 3);
        this.boxY = Math.floor(this.y / 3);
        this.box = (this.boxX+1) + this.boxY*3;

        this.el = document.createElement("div");
        this.el.classList.add("sudoku-cell");
        document.getElementById(`box${this.box}`).appendChild(this.el);

        this.el.addEventListener("click", () => this.clicked());
    }

    update() {
        if (!this.readOnly) {
            this.value = puzzle[this.y][this.x];
        }

        if (this.error) {
            this.el.classList.add("error-cell");
        } else {
            this.el.classList.remove("error-cell");
        }

        if (this.readOnly) {
            this.el.classList.add("read-only");
        } else {
            this.el.classList.remove("read-only");
        }

        if (this.value == 0) {
            this.el.textContent = "";
        } else {
            this.el.textContent = this.value;
        }
    }

    clicked() {
        if (!this.readOnly) {
            puzzle[this.y][this.x] = selectedNumber;
        }
        validPuzzle();
        refreshBoard();
    }
}


let cells;
let numButtons = [];
function setupBoardElements() {

    // mem row containers
    cells = [];
    for (let i = 0; i < 9; i++) {
        let cellRow = [];
        for (let j = 0; j < 9; j++) {
            let cell = new SudokuCell(0, j, i);
            cellRow.push(cell);
        }
        cells.push(cellRow);
    }

    // game buttons
    const numButtonContainer = document.createElement("div");
    numButtonContainer.classList.add("number-select-button-container");
    gameArea.appendChild(numButtonContainer);

    for (let i = 0; i < 10; i++) {
        let numButton = document.createElement("button");
        numButton.classList.add("number-select-button");
        numButton.textContent = i;
        numButton.addEventListener("click", () => {
            selectedNumber = i;
            setSelectedHighlight();
        });
        numButtonContainer.appendChild(numButton);
        numButtons.push(numButton);

        if (i == 0) {
            numButton.innerHTML = "<img src='/assets/icons/eraser_icon.svg'>"
        }
    }

    const puzzleButtonContainer = document.createElement("div");
    puzzleButtonContainer.id = "puzzle-button-container";
    gameArea.appendChild(puzzleButtonContainer);

    const clearPuzzleButton = document.createElement("button");
    clearPuzzleButton.id = "clear-puzzle-button";
    clearPuzzleButton.textContent = "Clear Puzzle";
    clearPuzzleButton.addEventListener("click", () => {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (!cells[i][j].readOnly) {
                    cells[i][j].value = 0;
                    puzzle[i][j] = 0;
                }
            }
        }
        validPuzzle();
    });
    puzzleButtonContainer.appendChild(clearPuzzleButton);

    const newPuzzleDifficulty = document.createElement("select");
    newPuzzleDifficulty.id = "new-puzzle-difficulty";
    newPuzzleDifficulty.innerHTML = "<option value='easy'>Easy</option><option value='medium'>Medium</option><option value='hard'>Hard</option><option value='expert'>Expert</option>"
    puzzleButtonContainer.appendChild(newPuzzleDifficulty);

    const newPuzzleButton = document.createElement("button");
    newPuzzleButton.id = "new-puzzle-button";
    newPuzzleButton.textContent = "New Puzzle";
    newPuzzleButton.addEventListener("click", () => createRandomPuzzle(newPuzzleDifficulty.value));
    puzzleButtonContainer.appendChild(newPuzzleButton);

}

function refreshBoard() {
    for (let i = 0; i < cells.length; i++) {
        for (let j = 0; j < cells[i].length; j++) {
            cells[i][j].update();
        }
    }

    if (isSolved()) {
        solvedEl.textContent = "Solved!";
    } else {
        solvedEl.textContent = "";
    }
}

function isSolved() {
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (puzzle[i][j] != solution[i][j]) {
                return false;
            }
        }
    }

    return true;
}

function setSelectedHighlight() {
    for(let i = 0; i < numButtons.length; i++) {
        numButtons[i].classList.remove("number-selected");
    }

    if (selectedNumber == 0) {
        gameArea.style.cursor = "not-allowed"
    } else {
        gameArea.style.cursor = "crosshair";
    }

    numButtons[selectedNumber].classList.add("number-selected");
}

document.addEventListener("keydown", e => {
    let dict = {
        "Digit0": 0,
        "Digit1": 1,
        "Digit2": 2,
        "Digit3": 3,
        "Digit4": 4,
        "Digit5": 5,
        "Digit6": 6,
        "Digit7": 7,
        "Digit8": 8,
        "Digit9": 9,
    }

    if (dict[e.code] >= 0) {
        selectedNumber = dict[e.code];
    }

    setSelectedHighlight();
});

const timer = document.getElementById("timer");
let currentTime = 0;
const timerDelay = 10;

function resetTimer() {
    currentTime = 0;
}

function updateTime() {
    if (!isSolved()) {
        currentTime += timerDelay;
    }

    let temp = currentTime;
    let minutes = Math.floor(temp / 60000);
    temp -= minutes * 60000;
    if (minutes < 10) {
        minutes = "0" + minutes;
    }

    let seconds = Math.floor(temp / 1000);
    temp -= seconds * 1000;
    if (seconds < 10) {
        seconds = "0" + seconds;
    }

    temp /= 10;
    if (temp < 10) {
        temp = "0" + temp;
    }

    timer.textContent = `${minutes}:${seconds}:${temp}`;
}

setInterval(updateTime, timerDelay);

setupBoardElements();
createRandomPuzzle("easy");
refreshBoard();
setSelectedHighlight();
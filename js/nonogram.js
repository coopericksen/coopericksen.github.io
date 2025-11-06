const gameArea = document.getElementById("game-area");
const gameBoard = document.getElementById("board");

document.body.addEventListener("mousedown", () => {
    isMouseDown = true;
});
document.body.addEventListener("mouseup", () => {
    isMouseDown = false;
});

// disable dragging
document.body.ondragstart = () => {
    return false;
};

let board = [];

let puzzle = [
    // 15x15

    // [0,0,0,0,0, 0,0,1,1,1, 0,0,0,0,0],
    // [0,1,1,1,1, 1,0,1,0,1, 0,0,0,0,0],
    // [0,1,0,1,0, 1,0,1,1,1, 0,1,1,1,1],
    // [0,1,1,1,1, 1,0,1,1,1, 0,1,0,1,0],
    // [0,1,0,1,1, 1,1,1,1,1, 0,1,1,1,1],

    // [1,1,1,1,1, 1,1,1,1,1, 1,1,0,1,1],
    // [1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1],
    // [1,1,1,1,0, 0,0,0,0,0, 0,0,0,0,1],
    // [0,1,0,0,0, 0,1,1,1,1, 1,1,1,0,0],
    // [0,0,0,1,1, 1,1,1,1,1, 1,1,1,1,1],

    // [0,0,1,1,1, 1,1,1,1,1, 1,1,1,1,1],
    // [0,0,0,1,1, 1,1,1,1,1, 1,1,1,1,1],
    // [0,0,0,0,1, 0,0,0,0,1, 0,0,1,0,0],
    // [0,0,0,0,1, 0,0,0,0,1, 0,0,1,0,0],
    // [1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1],
]
let puzzleName = "";

async function loadPuzzle(size) {
    let path = "";
    switch (size) {
        case "5x5":
            path = "/assets/nonogram/5x5puzzles.json";
            break;
        case "10x10":
            path = "/assets/nonogram/10x10puzzles.json";
            break;
        case "15x15":
            path = "/assets/nonogram/15x15puzzles.json";
            break;
    }

    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Failed to load JSON: ${path}`);
    }
    const file = await response.json();
    const puzzles = Object.keys(file);
    puzzleName = puzzles[Math.floor(Math.random() * puzzles.length)];
    // console.log(`Loading puzzle ${puzzleName}`);
    return file[puzzleName];
}

async function init(random=false) {
    if (!random) {
        puzzle = await loadPuzzle(selectedSize);
    } else {
        randomizePuzzle(selectedSize);
        puzzleName = "Random"
    }
    currentTime = 0;

    rows = puzzle.length;
    cols = puzzle[0].length;
    gameArea.width = rows * cellSize;
    gameArea.height = cols * cellSize;

    initializeBoard();
    leftCluesArr = [];
    topCluesArr = [];

    // create clue elements
    const leftCluesEl = document.getElementById("left-clues");
    leftCluesEl.innerHTML = "";
    // add row spots
    for (let i = 0; i < rows; i++) {
        tempEl = document.createElement("h1");
        tempEl.id = `left-clue-${i}`;
        tempEl.classList.add("clue-number-left");
        leftCluesEl.appendChild(tempEl);
    }

    const topCluesEl = document.getElementById("top-clues");
    topCluesEl.innerHTML = "";
    // add column spots
    for (let i = 0; i < cols; i++) {
        tempEl = document.createElement("h1");
        tempEl.id = `top-clue-${i}`;
        tempEl.classList.add("clue-number-top");
        topCluesEl.appendChild(tempEl);
    }

    createClues();
    checkSolvedClues();
    resetBoard();
}

// random puzzle
function randomizePuzzle(size) {
    switch (size) {
        case "5x5":
            size = 5;
            break;
        case "10x10":
            size = 10;
            break;
        case "15x15":
            size = 15;
            break;
    }
    puzzle = [];

    for (let i = 0; i < size; i++) {
        let temp = []
        for (let j = 0; j < size; j++) {
            temp.push(Math.round(Math.random()));
        }
        puzzle.push(temp);
    }
    rows = puzzle.length;
    cols = puzzle[0].length;
}

let rows;
let cols;
const cellSize = 40;
let isSolved = false;
let isMouseDown = false;
let currentAction = 1;
let onMobile = false;

class nonoCell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.state = board[this.y][this.x];
        this.element = document.createElement("div");
        this.element.style.width = `${cellSize}px`;
        this.element.style.height = `${cellSize}px`;
        this.element.style.cursor = "crosshair";
        this.element.style.touchAction = "manipulation";
        this.element.draggable = false;

        this.updateColors();

        this.element.addEventListener("mouseover", () => {
            this.isHovering = true;
            if (isMouseDown) {
                this.mark(currentAction);
            }
        });
        this.element.addEventListener("mouseout", () => {
            this.isHovering = false;
        });

        this.element.addEventListener("mousedown", () => {
            if (!onMobile) {
                currentAction = (this.state == 2) ? 0 : this.state + 1;
                this.mark(currentAction);
            }
        });

        // mobile
        this.element.addEventListener("touchstart", () => {
            onMobile = true;
            currentAction = (this.state == 2) ? 0 : this.state + 1;
            this.mark(currentAction);
        });

    }

    mark(newState) {

            // this.state = 1 - this.state;
            this.state = newState;

            board[this.y][this.x] = this.state;
            this.updateColors();

            // check if solved
            isSolved = true;
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    if ((board[i][j] == 0 && puzzle[i][j] == 1) || (board[i][j] == 2 && puzzle[i][j] == 1) || (board[i][j] == 1 && puzzle[i][j] == 0) || (board[i][j] == 1 && puzzle[i][j] == 2)) {
                        isSolved = false;
                    }
                }
            }

            setSolvedText();
            checkSolvedClues();
    }

    updateColors() {
        this.element.classList.remove("nonoCellOff");
        this.element.classList.remove("nonoCellOn");
        this.element.classList.remove("nonoCellXed");

        if (this.state == 2) {
            this.element.textContent = "X";
        } else {
            this.element.textContent = "";
        }

        switch (this.state) {
            case 0: 
                this.element.classList.add("nonoCellOff");
                break;
            case 1:
                this.element.classList.add("nonoCellOn");
                break;
            case 2:
                this.element.classList.add("nonoCellXed");
                break;
        }
    }
}

function setSolvedText() {
    document.getElementById("solved").textContent = (isSolved) ? `${puzzleName}-Solved!` : `${puzzleName}`;
}

let nonoCells = []
function initializeBoard() {
    gameBoard.innerHTML = "";
    // fill empty board 
    for (let i = 0; i < rows; i++) {
        temp = []
        for (let j = 0; j < cols; j++) {
            temp.push(0);
        }   
        board.push(temp);
    }

    // array and DOM

    for (let i = 0; i < rows; i++) {
        let tempNonoRow = document.createElement("div");
        tempNonoRow.style.display = "flex";
        for (let j = 0; j < cols; j++) {
            let tempNonoCell = new nonoCell(j, i);
            tempNonoRow.appendChild(tempNonoCell.element);
            nonoCells.push(tempNonoCell);
        }
        gameBoard.appendChild(tempNonoRow);
        tempNonoRow.classList.add("nonoCellRow");
        tempNonoRow.style.width = `${cols*cellSize}px`;
    }
}

function resetBoard() {
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            board[i][j] = 0;
        }
    }

    for (let i = 0; i < nonoCells.length; i++) {
        nonoCells[i].state = board[nonoCells[i].y][nonoCells[i].x];
        nonoCells[i].updateColors();
    }

    isSolved = false;
    setSolvedText();
    checkSolvedClues();
}

let leftCluesArr;
let topCluesArr;
function createClues() {
    let counter = 0;

    for (let i = 0; i < rows; i++) {
        counter = 0;
        for (let j = 0; j < cols; j++) {
            if (puzzle[i][j] == 1) {
                counter++;
            } else if  (counter > 0) {
                leftCluesArr.push([i, counter]);
                counter = 0;
            }
        }

        if (counter > 0) {
            leftCluesArr.push([i, counter]);
        }
    }

    for (let i = 0; i < cols; i++) {
        counter = 0;
        for (let j = 0; j < rows; j++) {
            if (puzzle[j][i] == 1) {
                counter++;
            } else if (counter > 0) {
                topCluesArr.push([i, counter]);
                counter = 0;
            }
        }

        if (counter > 0) {
            topCluesArr.push([i, counter]);
        }

    }

    leftCluesArr.forEach(el => {
        document.getElementById(`left-clue-${el[0]}`).textContent += ` ${el[1]}`;
    });

    topCluesArr.forEach(el => {
        document.getElementById(`top-clue-${el[0]}`).innerHTML += `<span>${el[1]}</span>`;
    })

    // if row/col has no clues
    for (let i = 0; i < rows; i++) {
        let tempEl = document.getElementById(`left-clue-${i}`);
        let tempEl2 = document.getElementById(`top-clue-${i}`);
        if (tempEl.textContent.length == 0) {
            tempEl.textContent = "X";
            tempEl.classList.add("clue-solved");
        }

        if (tempEl2.textContent.length == 0) {
            tempEl2.textContent = "X";
            tempEl2.classList.add("clue-solved");
        }
    }

    // console.log(leftCluesArr);
    // console.log(topCluesArr);
}


function checkSolvedClues() {

    // check for solved left clues
    for (let i = 0; i < rows; i++) {
        let array = [];
        let array2 = [];

        leftCluesArr.forEach(clue => {
            if (clue[0] == i) {
                array2.push(clue);
            }
        })
        let counter = 0;

        for (let j = 0; j < cols; j++) {
            if (board[i][j] == 1) {
                counter++;
            } else if  (counter > 0) {
                array.push([i, counter]);
                counter = 0;
            }
        }

        if (counter > 0) {
            array.push([i, counter]);
        }

        // check if generated clues match original clues
        match = true;

        if (array.length != array2.length) {
            match = false;
        } else {
            for (let j = 0; j < array.length; j++) {
                if (array[j][1] != array2[j][1]) {
                    match = false;
                }
            }
        }

        if (match) {
            // add xs to completed row
            for (let j = 0; j < cols; j++) {
                if (board[i][j] == 0) {
                    board[i][j] = 2;
                }
            }

            for (let j = 0; j < nonoCells.length; j++) {
                nonoCells[j].state = board[nonoCells[j].y][nonoCells[j].x];
                nonoCells[j].updateColors();
            }

            document.getElementById(`left-clue-${i}`).classList.add("clue-solved");

        } else if (document.getElementById(`left-clue-${i}`).textContent != "X" && document.getElementById(`left-clue-${i}`).classList.contains("clue-solved")) {

            // remove xs from row
            for (let j = 0; j < cols; j++) {
                if (board[i][j] == 2) {
                    board[i][j] = 0;
                }
            }

            for (let j = 0; j < nonoCells.length; j++) {
                nonoCells[j].state = board[nonoCells[j].y][nonoCells[j].x];
                nonoCells[j].updateColors();
            }
            currentAction = 0;

            document.getElementById(`left-clue-${i}`).classList.remove("clue-solved");
        }

    }

    // check for solved top clues
    for (let i = 0; i < cols; i++) {
        let array = [];
        let array2 = [];

        topCluesArr.forEach(clue => {
            if (clue[0] == i) {
                array2.push(clue);
            }
        })
        let counter = 0;

        for (let j = 0; j < rows; j++) {
            if (board[j][i] == 1) {
                counter++;
            } else if  (counter > 0) {
                array.push([i, counter]);
                counter = 0;
            }
        }

        if (counter > 0) {
            array.push([i, counter]);
        }

        // check if generated clues match original clues
        match = true;

        if (array.length != array2.length) {
            match = false;
        } else {
            for (let j = 0; j < array.length; j++) {
                if (array[j][1] != array2[j][1]) {
                    match = false;
                }
            }
        }

        if (match) {

            // add xs to completed column
            for (let j = 0; j < cols; j++) {
                if (board[j][i] == 0) {
                    board[j][i] = 2;
                }
            }

            for (let j = 0; j < nonoCells.length; j++) {
                nonoCells[j].state = board[nonoCells[j].y][nonoCells[j].x];
                nonoCells[j].updateColors();
            }

            document.getElementById(`top-clue-${i}`).classList.add("clue-solved");

        } else if (document.getElementById(`top-clue-${i}`).textContent != "X" && document.getElementById(`top-clue-${i}`).classList.contains("clue-solved")) {

            // remove xs from column
            for (let j = 0; j < rows; j++) {
                if (board[j][i] == 2) {
                    board[j][i] = 0;
                }
            }

            for (let j = 0; j < nonoCells.length; j++) {
                nonoCells[j].state = board[nonoCells[j].y][nonoCells[j].x];
                nonoCells[j].updateColors();
            }
            currentAction = 0;

            document.getElementById(`top-clue-${i}`).classList.remove("clue-solved");

        }
    }
}


const timer = document.getElementById("timer");
let currentTime = 0;
const timerDelay = 10;

function updateTime() {
    if (!isSolved) {
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

let selectedSize = "5x5";
init();

function selectedSizeChanged() {
    selectedSize = document.getElementById("size-selection").value;
}
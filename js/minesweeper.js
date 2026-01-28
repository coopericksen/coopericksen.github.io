const game_area = document.getElementById("game-area");

// defaults
let game_rows = 15;
let game_cols = 15;
cell_size = 40;
let mine_probability = 0.2;

let is_first_click = true;
let is_flag_key_down = false;

let alive = true;
let won = false;

let mine_count = 0;
let flag_count = 0;
const mine_counter = document.getElementById("mine-counter");
const flag_counter = document.getElementById("flag-counter");

const dimension_x = document.getElementById("dimension-x");
const dimension_y = document.getElementById("dimension-y");

dimension_x.addEventListener("change", () => {
    if (dimension_x.value < 5) {
        dimension_x.value = 5;
    } else if (dimension_x.value >= 50) {
        dimension_x.value = 50;
    }
    game_rows = dimension_x.value;
    let total_area = 400 + Math.floor(game_rows/10) * 120;
    cell_size = total_area / dimension_x.value;
    createBoardCells();
    resetBoard();
});

dimension_y.addEventListener("change", () => {
    if (dimension_y.value < 5) {
        dimension_y.value = 5;
    } else if (dimension_y.value >= 50) {
        dimension_y.value = 50;
    }
    game_cols = dimension_y.value;
    let total_area = 400 + Math.floor(game_rows/10) * 120;
    cell_size = total_area / dimension_x.value;
    createBoardCells();
    resetBoard();
});

const mine_probability_slider = document.getElementById("mine-probability-slider");
const mine_probability_label = document.getElementById("mine-probability-label");

mine_probability_slider.addEventListener("input", () => {
    mine_probability_label.textContent = `Mine Probability: ${mine_probability_slider.value}`;
});

mine_probability_slider.addEventListener("change", () => {
    mine_probability = mine_probability_slider.value;
    resetBoard();
});

const reset_button = document.getElementById("reset-button");
reset_button.onclick = resetBoard;

function setEmojiState(state) {
    let choices;
    switch (state) {
        case "alive": 
            choices = ["&#128536;", "&#128527;", "&#128539;"];
            reset_button.innerHTML = choices[Math.floor(Math.random() * choices.length)];
            break;
        case "dead": 
            choices = ["&#128545;", "&#128565;", "&#128529;"];
            reset_button.innerHTML = choices[Math.floor(Math.random() * choices.length)];
            break;
        case "win": 
            choices = ["&#128520;", "&#128526;", "&#128521;", "&#128515;"];
            reset_button.innerHTML = choices[Math.floor(Math.random() * choices.length)];
            break;
    }
}
setEmojiState("alive");

// disable dragging
document.body.ondragstart = () => {
    return false;
};

let is_mouse_down = false;
document.body.addEventListener("mousedown", () => {
    is_mouse_down = true;
});
document.body.addEventListener("mouseup", () => {
    is_mouse_down = false;
});

class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.revealed = false;
        this.mine = false;
        this.number = 0;
        this.is_hovering = false;
        this.flagged = false;

        this.el = document.createElement("div");
        this.el.classList.add("cell");
        this.el.style.width = `${cell_size}px`;
        this.el.style.height = `${cell_size}px`;

        this.el.addEventListener("mouseover", (e) => {
            this.is_hovering = true;
            if (is_mouse_down) {
                if (is_first_click) {
                    setupMines();
                    this.mine = false;
                    calculateNumbers();
                    is_first_click = false;
                }

                if (is_flag_key_down || e.buttons == 2) {
                    this.flag();
                } else {
                    this.sweep();
                }
            }
        });

        this.el.addEventListener("mouseout", () => {
            this.is_hovering = false;
        });

        this.el.addEventListener("mousedown", (e) => {
            if (e.button == 0 && !is_flag_key_down) {
                if (is_first_click) {
                    setupMines();
                    this.mine = false;
                    calculateNumbers();
                    is_first_click = false;
                }
                this.sweep();
            } else if (e.button == 2 || is_flag_key_down) {
                this.flag();
            }
        });

        this.el.addEventListener("contextmenu", (e) => {
            e.preventDefault();
        })
    }

    flag() {
        this.flagged = !this.flagged;

        if (!this.revealed && !won) {
            flag_count += this.flagged ? 1 : -1; // increment/decrement flag counter if flag is added
            flag_counter.textContent = `Flags: ${flag_count}`;
        }

        if (this.revealed) {
            this.flagged = false;
        } else {
            this.el.innerHTML = this.flagged ? "&#x2691;" : "";
        }

        checkForWin();
    }

    sweep() {
        
        // fix flag count if flagged is revealed
        if (this.flagged) {
            this.flag();
        }

        this.revealed = true;
        
        this.el.classList.add(this.mine ? "cell-revealed-mine" : "cell-revealed-clear");

        if (this.number > 0) {
            this.el.textContent = this.number;
        } else if (!this.mine && alive) {
            revealZeroZone(this.x, this.y);
        }

        if (this.mine) {
            this.el.textContent = "*";
            revealAll();
            alive = false;
            setEmojiState("dead");
            mine_counter.classList.add("game-lost");
            flag_counter.classList.add("game-lost");
        }

        checkForWin();
    }
}

function checkForWin() {
    if (mine_count != flag_count) {
        return
    }

    for (let y = 0; y < game_cols; y++) {
        for (let x = 0; x < game_rows; x++) {
            let cell = board_cells[y][x];

            if (cell.mine && cell.revealed) {
                return;
            }

            if (!cell.revealed && !cell.mine) {
                return;
            }

            if (cell.mine && !cell.flagged) {
                return;
            }
        }
    }

    setEmojiState("win");
    mine_counter.classList.add("game-won");
    flag_counter.classList.add("game-won");
    won = true;
}

let board_cells = [];
const board = document.getElementById("board");
createBoardCells();

function createBoardCells() {
    board_cells.length = 0;
    board.innerHTML = "";

    for (let i = 0; i < game_cols; i++) {
        let board_row = [];
        let board_row_el = document.createElement("div");
        board_row_el.classList.add("board-row");

        for (let j = 0; j < game_rows; j++) {
            let cell = new Cell(j, i);
            board_row.push(cell);
            board_row_el.appendChild(cell.el);
        }

        board_cells.push(board_row);
        board.appendChild(board_row_el);
    }
}

function revealZeroZone(x, y, visited = new Set()) {
    // remember visited cells to avoid rechecking
    const key = `${x},${y}`;
    if (visited.has(key)) return;
    visited.add(key);

    let sweeps = [[x-1,y+1],[x,y+1],[x+1,y+1],[x-1,y],[x+1,y],[x-1,y-1],[x,y-1],[x+1,y-1]];

    for (const [sx, sy] of sweeps) {
        if (sx < 0 || sy < 0 || sx >= game_rows || sy >= game_cols) {
            continue;
        }

        let cell = board_cells[sy][sx];
        if (cell.mine || cell.revealed) {
            continue;
        }

        cell.sweep();
        if (cell.number == 0) {
            revealZeroZone(sx, sy, visited);
        }
    };
}

function setupMines() {
    for (let i = 0; i < game_rows; i++) {
        for (let j = 0; j < game_cols; j++) {
            board_cells[j][i].mine = false;
            if (Math.random() < mine_probability) {
                board_cells[j][i].mine = true;
            }
        }
    }
}

function isCellMine(x, y) {
    if (x < 0 || y < 0 || x >= game_rows || y >= game_cols) {
        return false;
    };

    return board_cells[y][x].mine;
}

function calculateNumbers() {
    mine_count = 0;
    for (let y = 0; y < game_cols; y++) {
        for (let x = 0; x < game_rows; x++) {
            let cell = board_cells[y][x];
            if (cell.mine) {
                mine_count++;
                continue;
            }

            let number = 0;
            let sweeps = [[x-1,y+1],[x,y+1],[x+1,y+1],[x-1,y],[x+1,y],[x-1,y-1],[x,y-1],[x+1,y-1]];
            sweeps.forEach(sweep => {
                if (isCellMine(sweep[0], sweep[1])) {
                    number++;
                }
            });
            
            cell.number = number;
        }
    }

    mine_counter.textContent = `Mines: ${mine_count}`;
    flag_counter.textContent = `Flags: ${flag_count}`;
}

function revealAll() {
    for (let y = 0; y < game_cols; y++) {
        for (let x = 0; x < game_rows; x++) {
            let cell = board_cells[y][x];
            if (!cell.revealed) {
                cell.sweep();
            }
        }
    }

    is_first_click = false;
}

function resetBoard() {
    is_first_click = true;
    alive = true;
    won = false;
    setEmojiState("alive");

    mine_count = 0;
    flag_count = 0;
    mine_counter.textContent = `Mines: 0`;
    flag_counter.textContent = `Flags: ${flag_count}`;
    mine_counter.classList.remove("game-won");
    flag_counter.classList.remove("game-won");
    mine_counter.classList.remove("game-lost");
    flag_counter.classList.remove("game-lost");

    for (let y = 0; y < game_cols; y++) {
        for (let x = 0; x < game_rows; x++) {
            let cell = board_cells[y][x];
            cell.mine = false;
            cell.number = false;
            cell.revealed = false;
            cell.flagged = false;
            cell.el.classList.remove("cell-revealed-mine", "cell-revealed-clear");
            cell.el.textContent = "";
        }
    }
}

document.addEventListener("keydown", (e) => {
    // debug reveal all
    // if (e.code == "KeyE") { 
    //     e.preventDefault();
    //     revealAll();
    // }

    // debug reset
    // if (e.code == "KeyR") {
    //     e.preventDefault();
    //     resetBoard();
    // }

    if (e.code == "KeyF") {
        e.preventDefault();
        is_flag_key_down = true;
    }
});

document.addEventListener("keyup", (e) => {
    if (e.code == "KeyF") {
        e.preventDefault();
        is_flag_key_down = false;
    }
})
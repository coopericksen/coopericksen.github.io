const canvas = document.getElementById("game-canvas");
const context = canvas.getContext("2d");

const game_width = 800;
const game_height = 800;
canvas.width = game_width;
canvas.height = game_height;

const game_rows = 20;
const game_cols = 20;
const cell_width = canvas.width / game_rows;
const cell_height = canvas.height / game_cols;

let game_over = false;
let paused = false;
let score = 0;

let highscores = JSON.parse(localStorage.getItem("snake-highscores"));
if (highscores == null) {
    highscores = [0, 0, 0];
    localStorage.setItem("snake-highscores", JSON.stringify(highscores));
}

let lastUpdateTime = 0;
const snakeSpeed = 100;

class Snake {
    constructor(startx, starty) {
        this.x = startx;
        this.y = starty;
        this.startx = startx;
        this.starty = starty;
        this.color_head = "#702963";
        this.color_body1 = "#0f0";
        this.color_body2 = "#080";
        this.vx = 0;
        this.vy = 0;
        this.body = [];
        this.ready = true;
    }

    update() {
        if (game_over) {
            this.vx = 0;
            this.vy = 0;
        }

        this.x += this.vx;
        this.y += this.vy;
        this.ready = true;

        // crashed into self
        this.body.forEach((part) => {
            if (this.x == part[0] && this.y == part[1]) {
                game_over = true;
            }
        });

        this.render();

        // body chases head
        if (!game_over) {
            for (let i = this.body.length-1; i > 0; i--) {
                this.body[i] = this.body[i - 1];
            } 
            if (this.body.length) {
                this.body[0] = [this.x, this.y];
            }
        }

        // out of bounds
        if (this.x < 0) {
            this.x = 0;
            game_over = true;
        } else if (this.x >= game_rows) {
            this.x = game_rows-1;
            game_over = true;
        } else if (this.y < 0) {
            this.y = 0;
            game_over = true;
        } else if (this.y >= game_cols) {
            this.y = game_cols-1;
            game_over = true;
        }

        // eat food
        if (this.x == food.x && this.y == food.y) {
            this.body.push([food.x, food.y]);
            food.move();
            score++;
        }

    }

    render() {
        // render head
        context.fillStyle = this.color_head;
        context.fillRect(this.x * cell_width, this.y * cell_height, cell_width, cell_height);
        context.fillStyle = "#fff";
        context.beginPath();
        context.ellipse(this.x * cell_width + cell_width/2, this.y * cell_height + cell_height/2, cell_width/4, cell_height/4, 0, 0, 2*Math.PI);
        context.fill();
        context.fillStyle = "#000";
        context.beginPath();
        context.ellipse(this.x * cell_width + cell_width/2, this.y * cell_height + cell_height/2, cell_width/9, cell_height/9, 0, 0, 2*Math.PI);
        context.fill();

        // render body
        for (let i = 0; i < this.body.length; i++) {
            context.fillStyle = (i % 2 == 0) ? this.color_body1 : this.color_body2;
            context.fillRect(this.body[i][0] * cell_width, this.body[i][1] * cell_height, cell_width, cell_height);
        };
    }
}

class Food {
    constructor(startx, starty) {
        this.x = startx;
        this.y = starty;
        this.startx = startx;
        this.starty = starty;
        this.color = "#f00";
    }

    move() {
        let valid = false;
        while (!valid) {
            this.x = Math.floor(Math.random() * game_rows);
            this.y = Math.floor(Math.random() * game_cols);
            valid = !snake.body.some(part => part[0] === this.x && part[1] === this.y);
        }
    }

    render() {
        context.fillStyle = this.color;
        // context.fillRect(this.x * cell_width, this.y * cell_height, cell_width, cell_height);
        context.beginPath();
        context.ellipse(this.x * cell_width + cell_width/2, this.y * cell_height + cell_height/2, cell_width / 2, cell_height / 2, 0, 0, 2 * Math.PI);
        context.fill();
    }
}

var snake = new Snake(7, 10);
var food = new Food(12, 10);

function checkHighScores() {
    highscores.push(score);
    highscores.sort((a, b) => b - a); // sort descending
    highscores = highscores.slice(0, 3);
    localStorage.setItem("snake-highscores", JSON.stringify(highscores));
}

let highscoresUpdated = false;

function updateCanvas() {
    // render background
    context.fillStyle = "black";
    context.fillRect(0, 0, game_width, game_height);

    if (game_over) {
        if (!highscoresUpdated) {
            checkHighScores();
            highscoresUpdated = true;
        }

        context.fillStyle = "#fff";
        context.textAlign = "center";
        context.font = "50px monospace";
        context.fillText("GAME OVER", canvas.width/2, canvas.height/2);

        context.font = "20px monospace";
        context.fillText("Press 'r' to reset.", canvas.width/2, canvas.height/2 + 50);

        snake.vx = 0;
        snake.vy = 0;
    } else {
        snake.update();
        food.render();
        
        if (snake.vx == 0 && snake.vy == 0) {
            context.fillStyle = "#fff";
            context.textAlign = "center";
            context.font = "25px monospace";
            context.fillText(`WASD or Arrow Keys`, canvas.width/2, canvas.width/2 - 70);
            context.font = "20px monospace";
            context.fillText("Press 'p' to pause", canvas.width/2, canvas.height/2 - 40);

            // render scores
            context.fillStyle = "#fff";
            context.textAlign = "center";
            context.font = "25px monospace";
            context.fillText("HIGH SCORES", game_width/2, game_height/2 + 100);
            context.fillText(`1: ${highscores[0]}`, game_width/2, game_height/2 + 140);
            context.fillText(`2: ${highscores[1]}`, game_width/2, game_height/2 + 180);
            context.fillText(`3: ${highscores[2]}`, game_width/2, game_height/2 + 220);
        }
    }

    context.fillStyle = "#fff";
    context.textAlign = "center";
    context.font = "50px monospace";
    context.fillText(`Score: ${score}`, canvas.width/2, 50);

};

document.addEventListener('keydown', (e) => {
    if (e.code == "KeyR") {
        highscoresUpdated = false;
        snake.x = snake.startx;
        snake.y = snake.starty;
        food.x = food.startx;
        food.y = food.starty;
        score = 0;
        while (snake.body.length) {
            snake.body.pop();
        }
        game_over = false;
    }

    if (e.code == "KeyP") {
        paused = !paused;
        renderedPause = false;
    }
    if (e.code == "ArrowUp" || e.code == "KeyW" || e.code == "ArrowDown" || e.code == "KeyS" || e.code == "ArrowLeft" || e.code == "KeyA" || e.code == "ArrowRight" || e.code == "KeyD") {
        e.preventDefault();
    }

    if (snake.ready) {
        snake.ready = false;
        if (e.code == "ArrowUp" || e.code == "KeyW") {
            if (snake.vy == 0) {
                snake.vx = 0;
                snake.vy = -1;
            }
        } else if (e.code == "ArrowDown" || e.code == "KeyS") {
            if (snake.vy == 0) {
                snake.vx = 0;
                snake.vy = 1;
            }
        } else if (e.code == "ArrowLeft" || e.code == "KeyA") {
            if (snake.vx == 0) {
                snake.vx = -1;
                snake.vy = 0;
            }
        } else if (e.code == "ArrowRight" || e.code == "KeyD") {
            if (snake.vx == 0) {
                snake.vx = 1;
                snake.vy = 0;
            }
        }
    }
});

let renderedPause = false;

function gameLoop(timestamp) {
    if (paused) {
        requestAnimationFrame(gameLoop);
        if (!renderedPause) {
            context.fillStyle = "#fff";
            context.font = "30px monospace";
            context.fillText("PAUSED", canvas.width/2, canvas.height/2);
            context.font = "20px monospace";
            context.fillText("Press p to unpause.", canvas.width/2, canvas.height/2 + 30);
            renderedPause = true;
        }
        return;
    }

    if (!lastUpdateTime) lastUpdateTime = timestamp;
    const delta = timestamp - lastUpdateTime;

    if (delta > snakeSpeed) {
        updateCanvas();
        lastUpdateTime = timestamp;
    }
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
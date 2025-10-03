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

function updateCanvas() {
    // render background
    context.fillStyle = "black";
    context.fillRect(0, 0, game_width, game_height);

    if (game_over) {
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
        }
    }

    context.fillStyle = "#fff";
    context.textAlign = "center";
    context.font = "50px monospace";
    context.fillText(`Score: ${score}`, canvas.width/2, 50);

};

document.addEventListener('keydown', (e) => {
    if (e.code == "KeyR") {
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

    if (snake.ready) {
        snake.ready = false;
        if (e.code == "ArrowUp" || e.code == "KeyW") {
            snake.vx = 0;
            snake.vy = -1;
            e.preventDefault();
        } else if (e.code == "ArrowDown" || e.code == "KeyS") {
            snake.vx = 0;
            snake.vy = 1;
            e.preventDefault();
        } else if (e.code == "ArrowLeft" || e.code == "KeyA") {
            snake.vx = -1;
            snake.vy = 0;
            e.preventDefault();
        } else if (e.code == "ArrowRight" || e.code == "KeyD") {
            snake.vx = 1;
            snake.vy = 0;
            e.preventDefault();
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
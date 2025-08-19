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
let score = 0;

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
    }

    update() {
        if (game_over) {
            this.vx = 0;
            this.vy = 0;
        }

        if (!game_over) {
            this.x += this.vx;
            this.y += this.vy;
        }


        this.render();

        // crashed into self
        this.body.forEach((part) => {
            if (this.x == part[0] && this.y == part[1]) {
                game_over = true;
            }
        });

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
        this.body.forEach((part) => {
            context.fillStyle = (this.body.indexOf(part) % 2 == 0) ? this.color_body1 : this.color_body2;
            context.fillRect(part[0] * cell_width, part[1] * cell_height, cell_width, cell_height);
        });
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
        this.x = Math.floor(Math.random() * game_rows);
        this.y = Math.floor(Math.random() * game_cols);
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
        context.font = "80px Inter";
        context.fillText("Game Over", canvas.width/2, canvas.height/2);

        context.font = "30px Inter";
        context.fillText("Press R to reset.", canvas.width/2, canvas.height/2 + 50);

        snake.vx = 0;
        snake.vy = 0;
    } else {
        snake.update();
        food.render();
        
        if (snake.vx == 0 && snake.vy == 0) {
            context.fillStyle = "#fff";
            context.textAlign = "center";
            context.font = "25px Inter";
            context.fillText(`WASD or Arrow Keys`, canvas.width/2, canvas.width/2 - 50);
        }
    }

    context.fillStyle = "#fff";
    context.textAlign = "center";
    context.font = "50px Inter";
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

    if (e.code == "ArrowUp" || e.code == "KeyW") {
        if (snake.vy != 1) {
            snake.vx = 0;
            snake.vy = -1;
        }
        e.preventDefault();
    } else if (e.code == "ArrowDown" || e.code == "KeyS") {
        if (snake.vy != -1) {
            snake.vx = 0;
            snake.vy = 1;
        }
        e.preventDefault();
    } else if (e.code == "ArrowLeft" || e.code == "KeyA") {
        if (snake.vx != 1) {
            snake.vx = -1;
            snake.vy = 0;
        }
        e.preventDefault();
    } else if (e.code == "ArrowRight" || e.code == "KeyD") {
        if (snake.vx != -1) {
            snake.vx = 1;
            snake.vy = 0;
        }
        e.preventDefault();
    }
});

setInterval(updateCanvas, 100);
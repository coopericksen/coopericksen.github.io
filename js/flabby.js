const canvas = document.getElementById("game-canvas");
const context = canvas.getContext("2d");

const game_width = 600;
const game_height = 800;
canvas.width = game_width;
canvas.height = game_height;

const gravity = -0.5;
const pipe_gap = (game_width + 50)/3;
let score = 0;

class Flabby {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.yv = 0;
        this.width = 20;
        this.height = 20;
        this.jumpStrength = -30;
        this.dead = false;
    }

    render() {
        context.fillStyle = (this.dead) ? "#ff0000" : "#ffff00";

        // body
        context.beginPath();
        context.fillRect(this.x-this.width/2, this.y-this.height/2, this.width, this.height);

        // eye
        context.fillStyle = "#000";
        context.beginPath();
        context.fillRect(this.x+this.width/5, this.y-6, 3, 3);

        // wing
        context.beginPath();
        context.moveTo(this.x-this.width/3, this.y+3);
        context.lineTo(this.x, (this.yv < 0) ? this.y+this.height/3 : this.y-2);
        context.lineTo(this.x+this.width/3, this.y+3);
        context.stroke();

        // beak
        context.fillStyle = "#ffaa00";

        context.beginPath();
        context.moveTo(this.x + this.width/2, this.y-this.height/4);
        context.lineTo(this.x + this.width/2 + 4, this.y);
        context.lineTo(this.x + this.width/2, this.y+this.height/4);
        context.closePath();

        context.fill();
        context.stroke();
    }

    update() {
        this.y += this.yv;
        // floor and ceiling
        if (this.y > game_height) {
            this.y = game_height - this.height/2;
            this.dead = true;
            console.log("floor")
            paused = true;
        }
        if (this.y < 0) {
            this.y = 0 + this.height/2;
            this.dead = true;
            paused = true;
            console.log("ceil")
        }

        this.yv -= gravity;
        if (this.yv < -5) {
            this.yv = -5;
        }

        this.checkCollision();

        this.render();
    }

    checkCollision() {
        pipes.forEach(pipe => {

            let collidingX = (this.x + this.width/2 >= pipe.x - pipe.width/2 && this.x - this.width/2 <= pipe.x + pipe.width/2);
            let collidingX_end = (this.x + this.width/2 >= pipe.x - pipe.width/2 - pipe.end_width && this.x - this.width/2 <= pipe.x + pipe.width/2 + pipe.end_width);

            let collidingY = (this.y + this.height/2 >= pipe.y + pipe.gap || this.y - this.height/2 <= pipe.y - pipe.gap);
            let collidingY_end = ((this.y + this.height/2 >= pipe.y + pipe.gap && this.y - this.height/2 <= pipe.y + pipe.gap + pipe.end_height) || (this.y - this.height/2 <= pipe.y - pipe.gap && this.y + this.height/2 >= pipe.y - pipe.gap - pipe.end_height));

            if ((collidingX && collidingY) || (collidingX_end && collidingY_end)) {
                this.dead = true;
                paused = true;
            }
        });
    }
}

let flabby = new Flabby(game_width/3, game_height/2);

class Pipe {
    constructor(startx) {
        this.x = startx;
        this.sety();
        this.width = 50;
        this.gap = 80;
        this.end_width = 10;
        this.end_height = 20;
        this.speed = 3;
        this.color = "#00dd00";
        this.point_awarded = false;
    }

    sety() {
        this.y = game_height/2 + (Math.random() > 0.5 ? -1 : 1) * (Math.random() * 200);
    }

    render() {
        context.fillStyle = this.color;
        context.beginPath();

        context.rect(this.x-this.width/2, this.y-this.gap-this.end_height, this.width, -(this.y - this.gap - this.end_height));
        context.rect(this.x-this.width/2, this.y+this.gap+this.end_height, this.width, game_height - (this.y + this.gap + this.end_height));

        // pipe ends
        context.rect(this.x-this.width/2-this.end_width, this.y-this.gap, this.width + this.end_width*2, -this.end_height)
        context.rect(this.x-this.width/2-this.end_width, this.y+this.gap, this.width + this.end_width*2, this.end_height)

        context.fill();
        context.stroke();
    }

    update() {
        this.x -= this.speed;
        if (this.x < 0) {
            this.x = game_width + 50;
            this.sety();
            this.point_awarded = false;
            this.color = ((score + 3) % 10 == 0) ? "#ff0" : "#00dd00";
        }

        if (this.x <= flabby.x && !this.point_awarded) {
            score++;
            this.point_awarded = true;
        }

        this.speed = score/15 + 3;

        this.render();
    }
}

let pipe = new Pipe(game_width);
let pipe2 = new Pipe(game_width+pipe_gap);
let pipe3 = new Pipe(game_width+pipe_gap*2);
let pipes = [pipe, pipe2, pipe3];

let jumpReady = true;
document.addEventListener('keydown', (e) => {
    // jump code
    if (e.code == "Space" || e.code == "KeyJ") {
        e.preventDefault();
        if (jumpReady) {
            if (flabby.y > -flabby.jumpStrength) {
                flabby.yv = flabby.jumpStrength;
            }
            jumpReady = false;
            if (!flabby.dead && paused) {
                paused = false;
            }

            if (flabby.dead) {
                resetGame();
                flabby.render();
            }
        }
    }

    // reset
    if (e.code == "KeyR") {
        resetGame();
        flabby.render();
    }

});

function resetGame() {
    for (let i = 0; i < pipes.length; i++) {
        pipes[i].x = game_width + pipe_gap*i;
        pipes[i].color = "#00dd00";
    }

    paused = true;
    flabby.dead = false;
    flabby.y = game_height/2;
    flabby.yv = 0;
    score = 0;
    updateCanvas();

    context.fillStyle = "#000";
    context.textAlign = "center";
    context.font = "50px monospace";
    context.fillText("FLABBY BIRD", game_width/2, 50);
}

document.addEventListener('keyup', (e) => {
    if (e.code == "Space" || e.code == "KeyJ") {
        jumpReady = true;
    }
});

function updateCanvas() {
    context.clearRect(0, 0, game_width, game_height);
    context.fillStyle = "#ccf";
    context.fillRect(0, 0, game_width, game_height);
}

let paused = true;

function gameLoop(timestamp) {
    if (!paused) {
        updateCanvas();
        pipes.forEach(pipe => pipe.update());
        flabby.update();
        context.fillStyle = "#000";
        context.textAlign = "center";
        context.font = "50px monospace";
        context.fillText(score, game_width/2, 50);
    } else {
        context.fillStyle = "#000";
        context.font = "20px monospace";
        context.fillText("Press Space/J to start; R to reset", game_width/2, game_height/2 - 80);
    }

    requestAnimationFrame(gameLoop);
}

updateCanvas();
resetGame();
flabby.render();
requestAnimationFrame(gameLoop);
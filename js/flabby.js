const canvas = document.getElementById("game-canvas");
const context = canvas.getContext("2d");

const game_width = 600;
const game_height = 800;
canvas.width = game_width;
canvas.height = game_height;

const gravity = -0.5;
let score = 0;
let topscores = JSON.parse(localStorage.getItem("flabby-topscores"));
if (topscores == null) {
    topscores = [0, 0, 0];
    localStorage.setItem("flabby-topscores", JSON.stringify(topscores));
}

let pipes_moving = true;

class Flabby {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.yv = 0;
        this.width = 20;
        this.height = 20;

        this.jumpStrength = -30;

        this.dead = false;
        this.has_shield = false;
    }

    render() {

        // shield
        if (this.has_shield) {
            context.fillStyle = "#99f"; 
            context.beginPath();
            context.arc(this.x, this.y, 20, 0, 2*Math.PI);
            context.fill();
            context.stroke();
        }

        // body
        context.fillStyle = (this.dead) ? "#ff0000" : "#ffff00";
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
        context.fillStyle = "#aa8800";

        context.beginPath();
        context.moveTo(this.x + this.width/2, this.y-this.height/4);
        context.lineTo(this.x + this.width/2 + 4, this.y);
        context.lineTo(this.x + this.width/2, this.y+this.height/4);
        context.closePath();

        context.fill();
        // context.stroke();

    }

    update() {
        this.y += this.yv;

        // floor and ceiling
        if (this.y > game_height) {
            this.y = game_height - this.height/2;
            this.dead = true;
            paused = true;

            if (this.has_shield) {
                this.has_shield = false;
                this.dead = false;
                paused = false;
                this.safetyReset();
            }
        }
        if (this.y < 0) {
            this.y = 0 + this.height/2;
            this.dead = true;
            paused = true;

            if (this.has_shield) {
                this.has_shield = false;
                this.dead = false;
                paused = false;
                this.safetyReset();
            }
        }

        this.yv -= gravity;
        if (this.yv < -5) {
            this.yv = -5;
        }

        this.checkCollision();

        this.render();
    }

    distanceFrom(x, y) {
        return Math.sqrt(Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2));
    }

    closestPipe() {
        let min_distance = 999999;
        let ref_index;

        for (let i = 0; i < pipes.length; i++) {
            let distance = pipes[i].x - this.x;
            if (distance < min_distance && distance > 0) {
                ref_index = i;
                min_distance = distance;
            }
        }

        return pipes[ref_index];
    }

    safetyReset() {
        this.y = this.closestPipe().y;
        this.yv = this.jumpStrength/2;
    }

    checkCollision() {
        pipes.forEach(pipe => {

            let collidingX = (this.x + this.width/2 >= pipe.x - pipe.width/2 && this.x - this.width/2 <= pipe.x + pipe.width/2);
            let collidingX_end = (this.x + this.width/2 >= pipe.x - pipe.width/2 - pipe.end_width && this.x - this.width/2 <= pipe.x + pipe.width/2 + pipe.end_width);

            let collidingY = (this.y + this.height/2 >= pipe.y + pipe.gap || this.y - this.height/2 <= pipe.y - pipe.gap);
            let collidingY_end = ((this.y + this.height/2 >= pipe.y + pipe.gap && this.y - this.height/2 <= pipe.y + pipe.gap + pipe.end_height) || (this.y - this.height/2 <= pipe.y - pipe.gap && this.y + this.height/2 >= pipe.y - pipe.gap - pipe.end_height));

            if (((collidingX && collidingY) || (collidingX_end && collidingY_end))) {
                if (this.has_shield) {
                    this.has_shield = false;
                    this.safetyReset();
                } else {
                    this.dead = true;
                    paused = true;
                }

            }
        });


        if (this.distanceFrom(powerup.x, powerup.y) <= powerup.radius + 10) {
            this.has_shield = true;
            powerup.y = 1000;
            this.safetyReset();
        }
    }
}

let flabby = new Flabby(game_width/3, game_height/2);

class Pipe {
    constructor(id) {
        this.id = id;
        this.pipe_gap = 250;
        this.x = game_width + this.pipe_gap * this.id;

        this.sety();

        this.width = 50;
        this.gap = 80;
        this.end_width = 15;
        this.end_height = 20;

        this.speed = 3;
        this.color = "#00dd00";
        this.point_awarded = false;
    }

    sety() {
        this.y = game_height/2;
        this.y = game_height/2 + (Math.random() > 0.5 ? -1 : 1) * (Math.random() * 200);
        this.gap = Math.random() * 80 + 60;
    }

    render() {
        context.fillStyle = this.color;
        context.beginPath();

        context.rect(this.x-this.width/2, this.y-this.gap-this.end_height, this.width, -(this.y - this.gap - this.end_height));
        context.rect(this.x-this.width/2, this.y+this.gap+this.end_height, this.width, game_height - (this.y + this.gap + this.end_height));

        // pipe ends
        context.rect(this.x-this.width/2-this.end_width, this.y-this.gap, this.width + this.end_width*2, -this.end_height)
        context.rect(this.x-this.width/2-this.end_width, this.y+this.gap, this.width + this.end_width*2, this.end_height)

        // context.fillText(this.id, this.x, this.y);

        context.fill();
        context.stroke();
    }

    update() {
        if (pipes_moving) {
            this.x -= this.speed;
        }

        if (this.x < -(this.width/2 + this.end_width)) {
            let previous = this.id - 1;
            if (previous < 0) {
                previous = pipes.length - 1;
            }
            this.x = pipes[previous].x + this.pipe_gap;

            this.sety();
            this.point_awarded = false;

            // every 10th pipe
            this.color = ((score + 4) % 10 == 0) ? "#ffff00" : "#00dd00";

            // spawn powerup
            if (Math.random() > 0.8 && powerup.y == 1000 && !flabby.has_shield) {
                powerup.x = this.x + this.width/2 + this.end_width + 80;
                powerup.y = Math.random() * (game_height-60) + 30;
                console.log("spawned")
            }
        }

        if (this.x <= flabby.x && !this.point_awarded) {
            score++;
            this.point_awarded = true;
        }

        this.speed = 3 + Math.floor(score / 10)/2;

        this.render();
    }
}

let pipe0 = new Pipe(0);
let pipe1 = new Pipe(1);
let pipe2 = new Pipe(2);
let pipe3 = new Pipe(3);
let pipes = [pipe0, pipe1, pipe2, pipe3];

class Powerup {
    constructor() {
        this.x = game_width/2;
        this.y = 1000;
        this.width = 25;
        this.height = 30;
        this.radius = 20;

        this.speed = 3;
    }

    update() {
        this.x -= this.speed;

        if (this.x < 0) {
            this.y = 1000;
        }

        this.speed = 3 + Math.floor(score/10)/2;

        this.render();
    }

    render() {
        context.fillStyle = "#99f"; 
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
        context.fill();
        context.stroke();

        context.fillStyle = "#46A2B4";
        context.beginPath();
        context.moveTo(this.x - this.width/2, this.y - this.height/5);
        context.lineTo(this.x - this.width/4, this.y - this.height/3.5);
        context.lineTo(this.x, this.y - this.height/2);
        context.lineTo(this.x + this.width/4, this.y - this.height/3.5);
        context.lineTo(this.x + this.width/2, this.y - this.height/5);
        context.lineTo(this.x + this.width/2, this.y + 2);
        context.lineTo(this.x + this.width/4, this.y + 10);
        context.lineTo(this.x, this.y + this.height/2);
        context.lineTo(this.x - this.width/4, this.y + 10);
        context.lineTo(this.x - this.width/2, this.y + 2);
        context.closePath();
        context.fill();
        context.stroke();

    }
}

let powerup = new Powerup();

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

function checkTopScores() {
    topscores.push(score);
    topscores.sort((a, b) => b - a);
    topscores = topscores.slice(0, 3);
    localStorage.setItem("flabby-topscores", JSON.stringify(topscores));

    // render scores
    context.fillStyle = "#000";
    context.textAlign = "center";
    context.font = "25px monospace";
    context.fillText("TOP SCORES", game_width/2, game_height/2 + 90);
    context.fillText(`1: ${topscores[0]}`, game_width/2, game_height/2 + 130);
    context.fillText(`2: ${topscores[1]}`, game_width/2, game_height/2 + 160);
    context.fillText(`3: ${topscores[2]}`, game_width/2, game_height/2 + 190);
}

function resetGame() {
    for (let i = 0; i < pipes.length; i++) {
        pipes[i].x = game_width + pipes[i].pipe_gap * pipes[i].id;
        pipes[i].sety();
        pipes[i].color = "#00dd00";
        pipes[i].point_awarded = false;
    }

    paused = true;

    flabby.dead = false;
    flabby.y = game_height/2;
    flabby.yv = 0;
    flabby.has_shield = false;

    updateCanvas();
    checkTopScores();
    score = 0;

    powerup.y = 1000;

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
        powerup.update();
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
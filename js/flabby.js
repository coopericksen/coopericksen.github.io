const canvas = document.getElementById("game-canvas");
const context = canvas.getContext("2d");

const game_width = 600;
const game_height = 800;
canvas.width = game_width;
canvas.height = game_height;

const gravity = -0.5;
let score = 0;
let highscores = JSON.parse(localStorage.getItem("flabby-highscores"));
if (highscores == null) {
    highscores = [0, 0, 0];
    localStorage.setItem("flabby-highscores", JSON.stringify(highscores));
}

let pipeSpeed = 3;
let pipeSpeedMultiplier = 1;
let pipeGapMultiplier = 1;

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
            context.fillStyle = "#abf"
            context.beginPath();
            context.arc(this.x, this.y, this.width, 0, 2*Math.PI);
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
        if (this.y + this.height/2 > game_height) {
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
        if (this.y - this.height/2 < 0) {
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
            if (distance < min_distance && distance > -pipes[i].width/2) {
                ref_index = i;
                min_distance = distance;
            }
        }

        return pipes[ref_index];
    }

    safetyReset() {
        let closestPipe = this.closestPipe();
        this.y = closestPipe.y + closestPipe.gap/3;
        // this.yv = this.jumpStrength/2;
        this.yv = 0;
        paused = true;
        updateCanvas();
        pipes.forEach(pipe => pipe.render());
        powerup.render();
        this.render();
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
            switch (powerup.type) {
                case 0: // shield
                    this.has_shield = true;
                    break;
                case 1: // slow
                    pipeSpeedMultiplier = 0.5;
                    setTimeout(() => {
                        if (countRender <= 1 || pipeGapMultiplier != 1) {
                            pipeSpeedMultiplier = 1;
                            // console.log("restored speed")
                        }
                    }, 10000);

                    if (countRender == 0) {
                        countRender = 11;
                        countdownFrom();
                    } else {
                        countRender = 10;
                    }

                    break;
                case 2: // biggaps
                    pipeGapMultiplier = 2;
                    setTimeout(() => {
                        if (countRender <= 1 || pipeSpeedMultiplier != 1) {
                            pipeGapMultiplier = 1;
                            // console.log("restored gap");
                        }
                    }, 10000);

                    if (countRender == 0) {
                        countRender = 11;
                        countdownFrom();
                    } else {
                        countRender = 10;
                    }

                    break;
            }

            powerup.y = 1000;
            powerup.update();
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

        this.color = "#00dd00";
        this.point_awarded = false;
    }

    sety() {
        this.y = game_height/2;
        this.y = game_height/2 + (Math.random() > 0.5 ? -1 : 1) * (Math.random() * 200);

        this.gap = (Math.random() * 80 + 60) * pipeGapMultiplier;

        // check gap size
        let topLen = this.y;
        let bottomLen = game_height - this.y;

        if (this.gap >= topLen - 50) {
            this.gap = topLen - 50;
        }

        if (this.gap >= bottomLen - 50) {
            this.gap = bottomLen - 50;
        }
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
        this.x -= pipeSpeed * pipeSpeedMultiplier;

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
            if ((score + 4) % 100 == 0) {
                this.color = "#90a";
            }

            // spawn powerup
            if (Math.random() > 0.8 && powerup.y == 1000) {
                powerup.spawn(this);
            }
        }

        if (this.x <= flabby.x && !this.point_awarded) {
            score++;
            this.point_awarded = true;
        }

        pipeSpeed = 3 + Math.floor(score / 10)/4 - (Math.floor(score / 100) * 2);

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
        this.types = ["shield", "slow", "biggaps"];
        this.type = Math.floor(Math.random() * this.types.length);
    }

    update() {
        this.x -= pipeSpeed * pipeSpeedMultiplier;

        if (this.x + this.radius < 0) {
            this.y = 1000;
        }

        this.render();
    }

    render() {
        context.fillStyle = "#fff"; 
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
        context.fill();
        context.stroke();

        switch (this.type) {
            case 0: // shield
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
                break;
            case 1: // slow
                context.fillStyle = "#d90";
                context.beginPath();
                context.moveTo(this.x - this.width/2 - 3, this.y);
                context.lineTo(this.x - 3, this.y - this.height/3);
                context.lineTo(this.x - 3, this.y + this.height/3);
                context.closePath();
                context.fill();
                context.stroke();

                context.beginPath();
                context.moveTo(this.x - 2, this.y);
                context.lineTo(this.x+this.width/2 - 2, this.y - this.height/3);
                context.lineTo(this.x+this.width/2 - 2, this.y + this.height/3);
                context.closePath();
                context.fill();
                context.stroke();
                break;
            case 2: // biggaps
                // pipes
                context.fillStyle = "#00dd00";
                context.beginPath();
                context.rect(this.x - this.width/3, this.y - this.height/2, this.width*2/3, this.height/8);
                context.rect(this.x - this.width/3, this.y + this.height/2, this.width*2/3, -this.height/8);
                context.rect(this.x - 4, this.y - this.height/2 - 4, 8, 4);
                context.rect(this.x - 4, this.y + this.height/2 + 4, 8, -4);
                context.fill();
                context.stroke();
                // arrow body
                context.fillStyle = "#ff0";
                context.beginPath();
                context.rect(this.x - 2, this.y - this.height/5, 4, this.height*2/5);
                context.fill();
                context.stroke();
                // top arrow tri
                context.beginPath();
                context.moveTo(this.x - 4, this.y - this.height/5);
                context.lineTo(this.x, this.y - this.height/5 - 4);
                context.lineTo(this.x + 4, this.y - this.height/5);
                context.closePath();
                context.fill();
                context.stroke();
                // bottom arrow tri
                context.beginPath();
                context.moveTo(this.x - 4, this.y + this.height/5);
                context.lineTo(this.x, this.y + this.height/5 + 4);
                context.lineTo(this.x + 4, this.y + this.height/5);
                context.closePath();
                context.fill();
                context.stroke();

        }
    }

    spawn(pipe) {
        this.x = pipe.x + pipe.width/2 + pipe.end_width + 80;
        this.y = Math.random() * (game_height-80) + 40;
        this.type = Math.floor(Math.random() * this.types.length);
        // console.log(`spawned_${this.type}`);
    }
}

let powerup = new Powerup();

class Cloud {
    constructor() {
        this.x = 1000;
        this.y = 1000;
        this.puffs = [];
        this.puffCount = 5;
        this.hozScale = 1;

        this.randomize();
    }
    
    randomize() {
        this.x = game_width + 100 + Math.random() * 1000;
        this.y = 20 + Math.random() * (game_height - 40);

        this.puffCount = Math.floor(Math.random() * 3) + 3; // 3 to 5 puffs
        for (let i = 0; i < this.puffCount; i++) {
            this.puffs.push({
                offsetX: Math.random() * 60 - 30,
                offsetY: Math.random() * 20 - 10,
                radius: Math.random() * 20 + 10
            });
        }

        this.hozScale = Math.random() + 0.8;
    }

    update() {
        this.x -= (pipeSpeed * pipeSpeedMultiplier)/5;

        if (this.x + 100 < 0) {
            this.randomize();
        }
        this.render();
    }

    render() {
        // context.fillStyle = "#ffffff6f";
        const gradient = context.createRadialGradient(this.x, this.y, 10, this.x, this.y, 60);
        gradient.addColorStop(0, "rgba(255,255,255,0.8)");
        gradient.addColorStop(1, "rgba(255,255,255,0.2)");
        context.fillStyle = gradient;

        for (let i = 0; i < this.puffCount; i++) {
            context.save();
            context.scale(this.hozScale, 1);
            context.beginPath();
            context.arc(this.x + this.puffs[i].offsetX, this.y + this.puffs[i].offsetY, this.puffs[i].radius, 0, 2*Math.PI);
            context.closePath();
            context.fill();
            context.restore();
        }

    }
}


cloudCount = 15;
let clouds = [];
for (let i = 0; i < cloudCount; i++) {
    let cloud = new Cloud();
    clouds.push(cloud);
}


// input management -----------------------------------------------------------------

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

document.addEventListener('keyup', (e) => {
    if (e.code == "Space" || e.code == "KeyJ") {
        jumpReady = true;
    }
});

canvas.addEventListener("mousedown", (e) => {
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
});

canvas.addEventListener("mouseup", (e) => {
    jumpReady = true;
});

canvas.addEventListener("touchstart", (e) => {
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

});

canvas.addEventListener("touchend", (e) => {
    jumpReady = true;
});

// ----------------------------------------------------------------------------------

function checkHighScores() {
    highscores.push(score);
    highscores.sort((a, b) => b - a);
    highscores = highscores.slice(0, 3);
    localStorage.setItem("flabby-highscores", JSON.stringify(highscores));

}

function resetGame() {
    for (let i = 0; i < pipes.length; i++) {
        pipes[i].x = game_width + pipes[i].pipe_gap * pipes[i].id;
        pipes[i].sety();
        pipes[i].color = "#00dd00";
        pipes[i].point_awarded = false;
    }

    paused = true;
    pipeSpeedMultiplier = 1;
    pipeGapMultiplier = 1;
    countRender = 0;

    flabby.dead = false;
    flabby.y = game_height/2;
    flabby.yv = 0;
    flabby.has_shield = false;

    renderTitle = true;
    // updateCanvas();
    checkHighScores();
    score = 0;

    powerup.y = 1000;
}

function updateCanvas() {
    context.clearRect(0, 0, game_width, game_height);
    context.fillStyle = "#99f";
    context.fillRect(0, 0, game_width, game_height);
    // context.fillStyle = "#569d46";
    // context.fillRect(0, game_height - 15, game_width, 15);

    clouds.forEach(cloud => cloud.update());
}

let countRender = 0;
function countdownFrom() {
    countRender -= 1;
    if (countRender > 0) {
        setTimeout(countdownFrom, 1000);
    }
}

let renderTitle = true;
function renderText() {
    if (score > 0 || !paused) {
        // score counter
        context.textAlign = "center";
        context.font = "50px monospace";

        // drop shadow
        context.fillStyle = "#00000049";
        context.fillText(score, game_width/2-4, 55);

        context.fillStyle = "#000";
        context.fillText(score, game_width/2, 50);

        context.font = "12px monospace";
        context.textAlign = "right";
        context.fillText(`${pipeSpeed * pipeSpeedMultiplier}px/f`, game_width - 5, 20);
    }

    if (renderTitle) {
        // title
        context.font = "50px monospace";
        context.textAlign = "center";

        // drop shadow
        context.fillStyle = "#00000049";
        context.fillText("FLABBY BIRD", game_width/2-4, 55);

        context.fillStyle = "#00f";
        context.fillText("FLABBY BIRD", game_width/2, 50);

        // render highscores
        context.fillStyle = "#000";
        context.textAlign = "center";
        context.font = "25px monospace";
        context.fillText("HIGH SCORES", game_width/2, game_height/2 + 90);
        context.fillText(`1: ${highscores[0]}`, game_width/2, game_height/2 + 130);
        context.fillText(`2: ${highscores[1]}`, game_width/2, game_height/2 + 160);
        context.fillText(`3: ${highscores[2]}`, game_width/2, game_height/2 + 190);
    }

    if (countRender > 0) {
        context.font = "20px monospace";
        context.textAlign = "left";
        context.fillText(countRender, 10, 30);
    }
}

let paused = true;

function gameLoop(timestamp) {
    if (!paused) {
        renderTitle = false;
        updateCanvas();
        pipes.forEach(pipe => pipe.update());
        powerup.update();
        flabby.update();
        renderText();
    } else {
        updateCanvas();
        pipes.forEach(pipe => pipe.render());
        powerup.render();
        flabby.render();
        renderText();

        context.fillStyle = "#000";
        context.textAlign = "center";
        context.font = "20px monospace";
        if (flabby.dead) {
            context.fillText("Space/J or R to reset", game_width/2, game_height/2 - 80);
        } else {
            context.fillText("Space/J to flap wings", game_width/2, game_height/2 - 80);
        }
    }

    requestAnimationFrame(gameLoop);
}

updateCanvas();
resetGame();
flabby.render();
requestAnimationFrame(gameLoop);
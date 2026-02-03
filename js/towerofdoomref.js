const game_area = document.getElementById("game-area");
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const fullscreen_button = document.getElementById("fullscreen-button");

fullscreen_button.addEventListener("click", () => {
    game_area.requestFullscreen();
});

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const ASPECT_RATIO = GAME_WIDTH / GAME_HEIGHT;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

/*
    Dynamically resize canvas whenever
    player goes fullscreen or window size changes

    Size always matches aspect ratio as defined above
    while maximizing width to fill available space
*/

function resizeCanvas() {

    let new_width = window.innerWidth;
    let new_height = new_width / ASPECT_RATIO;

    if (new_height > window.innerHeight) { 
        new_height = window.innerHeight;
        new_width = new_height * ASPECT_RATIO; 
    }

    canvas.style.width = `${new_width}px`;
    canvas.style.height = `${new_height}px`;

    // console.log(new_width, new_height, new_width/new_height)

}

window.addEventListener("resize", resizeCanvas);
document.addEventListener("fullscreenchange", resizeCanvas);
document.addEventListener("DOMContentLoaded", resizeCanvas);

/*
    Classes

    * Player
    * Platform
    * Object
*/

class Player {
    constructor() {
        this.start_x = 55;
        this.start_y = canvas.height-50;

        this.x = this.start_x;
        this.y = this.start_y;
        this.xv = 0;
        this.yv = 0;

        this.is_a_down = false;
        this.is_d_down = false;
        this.x_axis = 0;

        this.is_jump_down = false;
        this.is_jump_ready = false;
        this.jump_released = true;
        this.is_wallreset_ready = true;
        this.wallreset_cooldown = 0.2;

        /*
            Jump Strength and Gravity must be
            signed according to canvas axis
            with '-' being up and '+' being down
        */
        this.jump_strength = -6;
        this.gravity = 0.3;

        this.speed = 3;
        this.friction = 0.3;
        this.air_resistance = 0;
        this.speed_cap = 20;

        this.width = 10;
        this.height = 10;
        this.radius = this.width/2;
        this.color = "#0070fa";

        this.checkpoint = null;
    }

    update(delta_time) {
        console.log(delta_time);
        /*
            Horizontal Input Handler

            Set x_axis based on 'a' and 'd' keypresses
            left: -1, right: 1, both/none: 0
        */

        if (this.is_a_down && !this.is_d_down) {
            this.x_axis = -1;
        } else if (this.is_d_down && !this.is_a_down) {
            this.x_axis = 1;
        } else {
            this.x_axis = 0;
        }

        if (this.x_axis != 0) {
            this.xv = this.x_axis * this.speed;
            if (Math.abs(this.xv) > this.speed_cap) {
                this.xv = Math.sign(this.xv) * this.speed_cap;
            }
        }

        /*
            Collision Check X

            * Loop over platforms
            * Resolve Collision
                * If no collision 
                    * Move x by xv
                * If left collision
                    * Move player to left of platform   
                    * Reset x velocity
                    * Reset jump if not on cooldown and jump has been released
                * If right collision
                    * Move player to right of platform   
                    * Reset x velocity
                    * Reset jump if not on cooldown and jump has been released
            
            * Slow xv to 0 based on friction
                * Friction is used when on ground
                * Air resistance when in air
        */
        

        let new_x = this.x + this.xv;
        let colliding_platform_x = null;
        let collision_type_x = null;

        for (const platform of level_platforms) {
            if (this.isCollidingWith(platform, new_x, this.y)) {

                // if platform is dangerous, reset player to start position
                if (platform.is_dangerous) {
                    this.resetToStartPosition();
                    break;
                } else {

                    if (platform.is_checkpoint) {
                        this.setCheckpoint(platform);
                    }

                    colliding_platform_x = platform;
                    collision_type_x = (this.xv >= 0) ? "left" : "right";
                    break;
                }
            }
        };

        if (!colliding_platform_x && (new_x >= this.radius && new_x <= canvas.width - this.radius)) {
            this.x += this.xv;
        } else if (collision_type_x == "left") {

            this.x = colliding_platform_x.x1 - this.radius;
            this.xv = 0;
            if (this.is_wallreset_ready && this.jump_released) {
                this.is_jump_ready = true;
                this.is_wallreset_ready = false;
                this.jump_released = false;
                setTimeout(() => {
                    this.is_wallreset_ready = true;
                }, this.wallreset_cooldown * 1000);
            }
            
        } else if (collision_type_x == "right") {

            this.x = colliding_platform_x.x2 + this.radius;
            this.xv = 0;
            if (this.is_wallreset_ready && this.jump_released) {
                this.is_jump_ready = true;
                this.is_wallreset_ready = false;
                this.jump_released = false;
                setTimeout(() => {
                    this.is_wallreset_ready = true;
                }, this.wallreset_cooldown * 1000);
            }

        }

        if (Math.abs(this.xv) <= this.friction) {
            this.xv = 0;
        } else {
            this.xv -= Math.sign(this.xv) * ((this.is_jump_ready) ? this.friction : this.air_resistance);
        }

        /*
            Collision Check Y

            * Apply gravity 
            * Jump if ready and key pressed

            * Loop over platforms
                * Store collided platform
                * Store type of collision
            * Resolve Collision           
                * If no collision
                    * Move y by yv
                * If ground collision
                    * Move player to top of platform
                    * Reset y velocity
                    * Enable jumping
                * If ceiling collision
                    * Move player to bottom of platform
                    * Reset y velocity

        */

        this.yv += this.gravity;

        // Cap y speed
        if (Math.abs(this.yv) > this.speed_cap) {
            this.yv = Math.sign(this.yv) * this.speed_cap;
        }

        if (this.is_jump_down && this.is_jump_ready) {
            this.yv = this.jump_strength;
            this.is_jump_ready = false;
        }

        let new_y = this.y + this.yv;
        let colliding_platform_y = null;
        let collision_type_y = null;

        for (const platform of level_platforms) {
            if (this.isCollidingWith(platform, this.x, new_y)) {
                if (platform.is_dangerous) {
                    this.resetToStartPosition();
                    break;
                } else {
                    if (platform.is_checkpoint) {
                        this.setCheckpoint(platform);
                    }

                    colliding_platform_y = platform;
                    collision_type_y = (this.yv >= 0) ? "ground" : "ceiling";
                    break;
                }
            }
        };

        if (!colliding_platform_y && (new_y >= this.radius && new_y <= canvas.height - this.radius)) {
            this.y = new_y;
        } else if (collision_type_y == "ground") {
            this.y = colliding_platform_y.y1 - this.radius;
            this.yv = 0;
            this.is_jump_ready = true;
        } else if (collision_type_y == "ceiling") {
            this.y = colliding_platform_y.y2 + this.radius;
            this.yv = 0;
        }

        this.render();
    }

    render() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
    }

    isCollidingWith(object, new_x=this.x, new_y=this.y) {
        /*
            Checks if player has entered bounds
            of object passed to this function
        */

        const is_within_x = (new_x + this.radius > object.x1 && new_x - this.radius < object.x2);
        const is_within_y = (new_y + this.radius > object.y1 && new_y - this.radius < object.y2);

        return is_within_x && is_within_y
    }

    resetToStartPosition() {
        console.log("resetting")
        this.x = this.start_x;
        this.y = this.start_y;
        this.xv = 0;
        this.yv = 0;
    }

    setCheckpoint(checkpoint) {
        if (this.checkpoint != checkpoint.checkpoint_id) {
            console.log("checkpoint set")
            this.start_x = checkpoint.checkpoint_x;
            this.start_y = checkpoint.checkpoint_y;
            this.checkpoint = checkpoint.checkpoint_id;
        }
    }
}

const player = new Player();

class Platform {
    constructor(x1, x2, y1, y2, is_dangerous=false, is_checkpoint=false, checkpoint_id=null) {
        this.x1 = x1;
        this.x2 = x2;
        this.y1 = y1;
        this.y2 = y2;
        this.centerX = (x1 + x2) / 2;
        this.centerY = (y1 + y2) / 2;

        this.width = x2 - x1;
        this.height = y2 - y1;

        if (is_dangerous) {
            this.color = "#D40C0C";
        } else if (is_checkpoint) {
            this.color = "#0f0";
            this.checkpoint_x = (this.x1 + this.x2)/2;
            this.checkpoint_y = this.y1 + 5;
            this.checkpoint_id = checkpoint_id;
        } else {
            this.color = "#007070";
        }

        this.is_dangerous = is_dangerous;
        this.is_checkpoint = is_checkpoint;
    }

    render() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x1, this.y1, this.width, this.height);
    }
}

const level = [
    // [canvas.width/2-300, canvas.height/2+100, canvas.width/2+300, canvas.height/2+120],
    // [canvas.width/2+100, canvas.height/2-40, canvas.width/2+120, canvas.height/2+100],
    // [canvas.width/2-200, canvas.height/2-80, canvas.width/2+300, canvas.height/2-60]

    /*
        [x1, x2, y1, y2, is_dangerous, is_checkpoint, checkpoint_id]
    */

    // Level border
    [0, canvas.width, 0, 20],
    [0, canvas.width, canvas.height-20, canvas.height],
    [0, 20, 0, canvas.height],
    [canvas.width-20, canvas.width, 0, canvas.height],


    // Level walls
    [20, 300, canvas.height-300, canvas.height-120],
    [300, 500, canvas.height-300, canvas.height-150],
    [500, canvas.width-200, canvas.height-300, canvas.height-180],

    [250, 500, canvas.height-60, canvas.height-20],
    [500, 550, canvas.height-30, canvas.height-20, is_dangerous=true],
    [550, 700, canvas.height-60, canvas.height-20],

    [750, 800, canvas.height-25, canvas.height-20, is_dangerous=false, is_checkpoint=true, checkpoint_id=0],

    [850, 1259, canvas.height-60, canvas.height-20],

];

let level_platforms = [];

for (let i = 0; i < level.length; i++) {
    let platformCoords = level[i];
    let platform = new Platform(platformCoords[0], platformCoords[1], platformCoords[2], platformCoords[3], platformCoords[4], platformCoords[5], platformCoords[6]);
    level_platforms.push(platform);
}

/*
    Main Game Loop

    * Clears entire frame
    * Update & Render player
        * Check player collisions with objects
        * Render final position
    * Render platform
    * Render Fps counter

*/

let last_timestamp = 0;
function gameLoop(timestamp) {
    const delta_time = timestamp - last_timestamp;
    last_timestamp = timestamp;
    const fps = 1000 / delta_time;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    player.update(delta_time / 1000);
    level_platforms.forEach(platform => {
        platform.render();
    })

    // ctx.fillStyle = "#0f0";
    // ctx.fillRect(0, 0, 5, canvas.height);
    // ctx.fillRect(0, 0, canvas.width, 5);
    // ctx.fillRect(0, canvas.height-5, canvas.width, 5);
    // ctx.fillRect(canvas.width-5, 0, 5, canvas.height);

    ctx.fillStyle = "#000";
    ctx.font = "12px sans serif";
    ctx.fillText(`FPS: ${fps.toFixed(0)}`, 6, 16);

    requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", (e) => {
    if (e.code == "Space") {
        e.preventDefault();
    }

    switch (e.code) {
        case "KeyW":
            player.is_jump_down = true;
            break;
        case "KeyA":
            player.is_a_down = true;
            break;
        case "KeyD":
            player.is_d_down = true;
            break;
    }
});

document.addEventListener("keyup", (e) => {
    switch (e.code) {
        case "KeyW":
            player.is_jump_down = false;
            player.jump_released = true;
            break;
        case "KeyA":
            player.is_a_down = false;
            break;
        case "KeyD":
            player.is_d_down = false;
            break;
    }
})

gameLoop();
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
document.addEventListener("fullscreenchange", resizeCanvas)

/*
    Classes

    * Player
    * Platform
    * Object
*/

class Player {
    constructor() {
        this.x = canvas.width/2;
        this.y = canvas.height/2;
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
        this.jump_strength = -10;
        this.gravity = 0.9;

        this.speed = 4;
        this.friction = 0.4;
        this.air_resistance = 0.1;

        this.width = 10;
        this.height = 10;
        this.radius = this.width/2;
        this.color = "#0070fa";
    }

    update() {
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
        console.log(this.x_axis)

        if (this.x_axis != 0) {
            this.xv = this.x_axis * this.speed;
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

        for (const platform of platforms) {
            if (this.isCollidingWith(platform, new_x, this.y)) {
                colliding_platform_x = platform;
                collision_type_x = (this.xv >= 0) ? "left" : "right";
                break;
            }
        };

        if (!colliding_platform_x) {
            this.x += this.xv;
        } else if (collision_type_x == "left") {

            this.x = colliding_platform_x.x1 - this.radius - 1;
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

            this.x = colliding_platform_x.x2 + this.radius + 1;
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
            console.log(Math.sign(this.xv) * this.friction)
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

        if (this.is_jump_down && this.is_jump_ready) {
            this.yv = this.jump_strength;
            this.is_jump_ready = false;
        }

        let new_y = this.y + this.yv;
        let colliding_platform_y = null;
        let collision_type_y = null;
        let closest_collision = Infinity;

        for (const platform of platforms) {
            if (this.isCollidingWith(platform, this.x, new_y)) {
                colliding_platform_y = platform;
                collision_type_y = (this.yv >= 0) ? "ground" : "ceiling";
                break;
            }
        };

        if (!colliding_platform_y) {
            this.y = new_y;
        } else if (collision_type_y == "ground") {
            this.y = colliding_platform_y.y1 - this.radius - 1;
            this.yv = 0;
            this.is_jump_ready = true;
        } else if (collision_type_y == "ceiling") {
            this.y = colliding_platform_y.y2 + this.radius + 1;
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

        const is_within_x = (new_x + this.radius >= object.x1 && new_x - this.radius <= object.x2);
        const is_within_y = (new_y + this.radius >= object.y1 && new_y - this.radius <= object.y2);

        if (is_within_x && is_within_y) {
            return true;
        }

        return false;
    }
}

const player = new Player();

class Platform {
    constructor(x1, y1, x2, y2) {
        this.x1 = x1;
        this.x2 = x2;
        this.y1 = y1;
        this.y2 = y2;
        this.centerX = (x1 + x2) / 2;
        this.centerY = (y1 + y2) / 2;

        this.width = x2 - x1;
        this.height = y2 - y1;
        this.color = "#000";
        console.log(this.width)
        console.log(this.height)
    }

    render() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x1, this.y1, this.width, this.height);
    }
}

const platform1 = new Platform(canvas.width/2-300, canvas.height/2+100, canvas.width/2+300, canvas.height/2+120);
const platform2 = new Platform(canvas.width/2+100, canvas.height/2-40, canvas.width/2+120, canvas.height/2+100);
const platform3 = new Platform(canvas.width/2-200, canvas.height/2-80, canvas.width/2+300, canvas.height/2-60);
let platforms = [platform1, platform2, platform3];

/*
    Main Game Loop

    * Clears entire frame
    * Render platform
    * Update & Render player
        * Check player collisions with objects
        * Render final position

*/

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f00"
    ctx.fillRect(0, 0, 5, canvas.height);
    ctx.fillRect(0, 0, canvas.width, 5);
    ctx.fillRect(0, canvas.height-5, canvas.width, 5);
    ctx.fillRect(canvas.width-5, 0, 5, canvas.height);

    player.update();
    platforms.forEach(platform => {
        platform.render();
    })

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

const WIDTH = 3000;
const HEIGHT = WIDTH;
const app = new PIXI.Application({ width: WIDTH, height: HEIGHT, backgroundColor: 0x333333, antialias: true });
document.body.appendChild(app.view);
// app.renderer.view.style.position = "absolute";
// app.renderer.view.style.display = "block";
// const size = Math.min(window.innerWidth, window.innerHeight)
// app.renderer.resize(size, size);
const BIRD_FRAME_LIST = [
    './sprites/frame-4.png',
    './sprites/frame-3.png',
    './sprites/frame-2.png',
    './sprites/frame-1.png',
];
function setup(...args) {
    console.log("Creating game");
    const game = new Game();
}
app.loader
    .add(BIRD_FRAME_LIST)
    .load(setup);
const ACCELERATION = 0.5;
const PIPES_SPEED = ACCELERATION * 30;
const ACCELERATION_UP = ACCELERATION * 50;
const FLAPSLOWDOWN = 3;
const PIPE_COLOR = 0xFF3300;
const ROTATION = 0.1; // for game over
const ACCELERATION_GAME_OVER = ACCELERATION * 50;
// SIZES
const PIPES_HOLE = HEIGHT / 4;
const PIPES_WIDTH = WIDTH / 10;
const BIRD_SIZE = WIDTH / 8;
const MARGIN = BIRD_SIZE / 8;
class Game {
    // assumes resources are loaded (to be called after setup)
    constructor() {
        // on construction assume elements are loaded
        // no MVC in the sense that sprites are the elements
        this.startTime = undefined;
        this.bird = undefined;
        this.speedY = undefined;
        this.started = undefined;
        this.gameOver = undefined;
        this.birdTextureCounter = undefined;
        this.pipes = undefined;
        this.holeStart = undefined;
        this.gameBox = new PIXI.Container();
        if (app.loader.loading) {
            console.warn("Called constructor of Game while still loading assets!");
        }
        app.stage.sortableChildren = true;
        app.stage.addChild(this.gameBox);
        this.gameBox.width = WIDTH;
        this.gameBox.height = HEIGHT;
        this.gameBox.sortableChildren = true;
        const background = new PIXI.Graphics();
        background.beginFill(0x000000);
        background.drawRect(0, 0, WIDTH, WIDTH);
        background.endFill;
        this.gameBox.addChild(background);
        // const mask = new PIXI.Graphics()
        // mask.beginFill(0x000000)
        // mask.drawRect(0, 0, WIDTH, WIDTH);
        // mask.endFill
        // app.stage.mask = mask
        this.resetBird();
        this.createPipes();
        app.ticker.add((delta) => this.update(delta));
        document.addEventListener('keydown', () => this.up());
        document.addEventListener('mousedown', () => this.up());
        document.addEventListener('touchstart', () => this.up());
        // const scale = Math.min(window.innerWidth / WIDTH, window.innerHeight / HEIGHT)
        // app.stage.scale.set(scale)
        // window.addEventListener("resize", function(event){ 
        //     const scale = Math.min(window.innerWidth / WIDTH, window.innerHeight / HEIGHT)
        //     app.stage.scale.set(scale)
        // });
    }
    resetBird() {
        if (this.bird !== undefined) {
            this.gameBox.removeChild(this.bird);
        }
        this.birdTextureCounter = BIRD_FRAME_LIST.length * FLAPSLOWDOWN - 1;
        this.bird = new PIXI.Sprite();
        this.bird.zIndex = 1000;
        this.updateTexture(1);
        this.bird.width = BIRD_SIZE;
        this.bird.height = BIRD_SIZE;
        this.bird.x = WIDTH / 6;
        this.bird.y = HEIGHT / 2;
        this.bird.anchor.set(0.5, 0.5);
        this.gameBox.addChild(this.bird);
        this.speedY = ACCELERATION_UP / 2;
        this.started = false;
        this.gameOver = false;
    }
    createPipes() {
        if (this.pipes !== undefined) {
            this.gameBox.removeChild(this.pipes);
        }
        const pipes = new PIXI.Graphics();
        pipes.beginFill(PIPE_COLOR);
        const holeStart = (HEIGHT - PIPES_HOLE) * Math.random();
        this.holeStart = holeStart;
        pipes.drawRect(0, 0, PIPES_WIDTH, holeStart);
        pipes.drawRect(0, holeStart + PIPES_HOLE, PIPES_WIDTH, HEIGHT - (holeStart + PIPES_HOLE));
        pipes.endFill;
        pipes.x = WIDTH;
        this.gameBox.addChild(pipes);
        this.pipes = pipes;
    }
    updateTexture(delta) {
        const textureId = BIRD_FRAME_LIST[Math.floor(this.birdTextureCounter / FLAPSLOWDOWN)];
        this.bird.texture = app.loader.resources[textureId].texture;
        if (this.birdTextureCounter < BIRD_FRAME_LIST.length * FLAPSLOWDOWN - 1 || this.gameOver) {
            this.birdTextureCounter += Math.round(delta);
            if (this.birdTextureCounter > BIRD_FRAME_LIST.length * FLAPSLOWDOWN - 1) {
                this.birdTextureCounter = BIRD_FRAME_LIST.length * FLAPSLOWDOWN - 1;
            }
        }
        this.birdTextureCounter %= BIRD_FRAME_LIST.length * FLAPSLOWDOWN;
    }
    update(delta) {
        console.log(delta);
        if (this.started) {
            this.bird.y += this.speedY * delta;
            this.speedY += ACCELERATION * delta;
            this.updateTexture(delta);
            this.pipes.x -= PIPES_SPEED * delta;
            if (this.pipes.x + this.pipes.width <= 0) {
                this.createPipes();
            }
            this.checkGameOver();
            if (this.gameOver) {
                this.bird.rotation += ROTATION;
            }
        }
        app.render();
    }
    up() {
        if (!this.gameOver) {
            this.started = true;
            this.speedY -= ACCELERATION_UP;
            this.birdTextureCounter = 0;
        }
    }
    checkGameOver() {
        if (this.gameOver) {
            // animation that ends if the bird goes BIRD_SIZE below bottom
            if (this.bird.y > HEIGHT + BIRD_SIZE) {
                this.resetBird();
                this.createPipes();
            }
        }
        else {
            // check if game is over
            const outOfBound = (this.bird.y - BIRD_SIZE / 2 + MARGIN < 0 || this.bird.y + BIRD_SIZE / 2 - MARGIN > HEIGHT);
            const collided = ((Math.abs(this.pipes.x + PIPES_WIDTH / 2 - this.bird.x) < BIRD_SIZE / 2 + PIPES_WIDTH / 2 - MARGIN) && (this.bird.y - BIRD_SIZE / 2 + MARGIN < this.holeStart ||
                this.bird.y + BIRD_SIZE / 2 - MARGIN > this.holeStart + PIPES_HOLE));
            if (outOfBound || collided) {
                this.gameOver = true;
                this.speedY = -ACCELERATION_GAME_OVER * this.bird.y / HEIGHT;
            }
        }
    }
}
// From https://github.com/kittykatattack/scaleToWindow
function scaleToWindow(canvas, backgroundColor) {
    var scaleX, scaleY, scale, center;
    //1. Scale the canvas to the correct size
    //Figure out the scale amount on each axis
    scaleX = window.innerWidth / canvas.offsetWidth;
    scaleY = window.innerHeight / canvas.offsetHeight;
    //Scale the canvas based on whichever value is less: `scaleX` or `scaleY`
    scale = Math.min(scaleX, scaleY);
    canvas.style.transformOrigin = "0 0";
    canvas.style.transform = "scale(" + scale + ")";
    //2. Center the canvas.
    //Decide whether to center the canvas vertically or horizontally.
    //Wide canvases should be centered vertically, and 
    //square or tall canvases should be centered horizontally
    if (canvas.offsetWidth > canvas.offsetHeight) {
        if (canvas.offsetWidth * scale < window.innerWidth) {
            center = "horizontally";
        }
        else {
            center = "vertically";
        }
    }
    else {
        if (canvas.offsetHeight * scale < window.innerHeight) {
            center = "vertically";
        }
        else {
            center = "horizontally";
        }
    }
    //Center horizontally (for square or tall canvases)
    var margin;
    if (center === "horizontally") {
        margin = (window.innerWidth - canvas.offsetWidth * scale) / 2;
        canvas.style.marginTop = 0 + "px";
        canvas.style.marginBottom = 0 + "px";
        canvas.style.marginLeft = margin + "px";
        canvas.style.marginRight = margin + "px";
    }
    //Center vertically (for wide canvases) 
    if (center === "vertically") {
        margin = (window.innerHeight - canvas.offsetHeight * scale) / 2;
        canvas.style.marginTop = margin + "px";
        canvas.style.marginBottom = margin + "px";
        canvas.style.marginLeft = 0 + "px";
        canvas.style.marginRight = 0 + "px";
    }
    //3. Remove any padding from the canvas  and body and set the canvas
    //display style to "block"
    canvas.style.paddingLeft = 0 + "px";
    canvas.style.paddingRight = 0 + "px";
    canvas.style.paddingTop = 0 + "px";
    canvas.style.paddingBottom = 0 + "px";
    canvas.style.display = "block";
    //4. Set the color of the HTML body background
    document.body.style.backgroundColor = backgroundColor;
    document.body.style.height = String(Math.round(canvas.offsetHeight / scaleY));
    //Fix some quirkiness in scaling for Safari
    var ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf("safari") != -1) {
        if (ua.indexOf("chrome") > -1) {
            // Chrome
        }
        else {
            // Safari
            //canvas.style.maxHeight = "100%";
            //canvas.style.minHeight = "100%";
        }
    }
    //5. Return the `scale` value. This is important, because you'll nee this value 
    //for correct hit testing between the pointer and sprites
    return scale;
}
scaleToWindow(app.view, 0x888888);
window.addEventListener("resize", function (event) {
    scaleToWindow(app.view, 0x888888);
});
//# sourceMappingURL=flappy.js.map
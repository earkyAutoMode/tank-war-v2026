const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const enemyCountEl = document.getElementById('enemy-count');
const overlay = document.getElementById('overlay');
const startScreen = document.getElementById('start-screen');
const messageEl = document.getElementById('message');
const finalScoreEl = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// 配置
const TILE_SIZE = 24;
const COLS = 26;
const ROWS = 26;
canvas.width = TILE_SIZE * COLS;
canvas.height = TILE_SIZE * ROWS;

let gameRunning = false;
let score = 0;
let level = 1;
let player, enemies, bullets, map, eagle;
const keys = {};

// 地图数据 (0: 空, 1: 砖墙, 2: 钢墙, 3: 基地)
const MAP_DATA = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,0,1,0,1,0,1,0,1,0,1,0,0,1,0,1,0,1,0,1,0,1,0,1,0],
    [0,1,0,1,0,1,0,1,0,1,0,1,0,0,1,0,1,0,1,0,1,0,1,0,1,0],
    [0,1,0,1,0,1,0,1,0,1,0,1,0,0,1,0,1,0,1,0,1,0,1,0,1,0],
    [0,1,0,1,0,1,0,1,0,1,0,1,2,2,1,0,1,0,1,0,1,0,1,0,1,0],
    [0,1,0,1,0,1,0,1,0,1,0,1,0,0,1,0,1,0,1,0,1,0,1,0,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,0,1,0,1,0,1,2,2,0,1,0,0,1,0,2,2,0,1,0,1,0,1,0,1],
    [0,1,0,1,0,1,0,1,0,0,0,1,0,0,1,0,0,0,0,1,0,1,0,1,0,1],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1,0,1,1,0,1,0,0,0,0,1,1,1,1,1,1,0,0,0,0,1,0,1,1,0,1],
    [2,0,2,2,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,2,2,0,2],
    [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
    [2,0,2,2,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,2,2,0,2],
    [1,0,1,1,0,1,0,0,0,0,0,1,1,1,1,0,0,0,0,0,1,0,1,1,0,1],
    [0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,0,1,0,1,0,1,0,0,0,1,1,1,1,0,0,0,0,1,0,1,0,1,0,1],
    [0,1,0,1,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,1],
    [0,1,0,1,0,1,0,1,0,1,0,0,0,0,0,0,1,0,1,1,0,1,0,1,0,1],
    [0,1,0,1,0,1,0,1,0,1,0,1,1,1,1,0,1,0,1,1,0,1,0,1,0,1],
    [0,1,0,1,0,1,0,1,0,1,0,1,0,0,1,0,1,0,1,1,0,1,0,1,0,1],
    [0,1,0,1,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,1,0,1,1,0,1,1,0,0,1,1,1,1,0,0,1,1,0,1,1,0,1,1,0],
    [0,1,1,0,1,1,0,1,1,0,1,3,3,3,3,1,0,1,1,0,1,1,0,1,1,0]
];

class Bullet {
    constructor(x, y, dir, isPlayer) {
        this.x = x;
        this.y = y;
        this.dir = dir; // 0: up, 1: right, 2: down, 3: left
        this.isPlayer = isPlayer;
        this.speed = 4;
        this.radius = 3;
    }

    update() {
        if (this.dir === 0) this.y -= this.speed;
        if (this.dir === 1) this.x += this.speed;
        if (this.dir === 2) this.y += this.speed;
        if (this.dir === 3) this.x -= this.speed;

        // 边界检测
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) return true;

        // 地图碰撞
        const tx = Math.floor(this.x / TILE_SIZE);
        const ty = Math.floor(this.y / TILE_SIZE);
        if (tx >= 0 && tx < COLS && ty >= 0 && ty < ROWS) {
            const tile = map[ty][tx];
            if (tile === 1) { // 砖墙
                map[ty][tx] = 0;
                return true;
            } else if (tile === 2) { // 钢墙
                return true;
            } else if (tile === 3) { // 基地
                gameOver(false);
                return true;
            }
        }

        // 坦克碰撞
        if (this.isPlayer) {
            for (let i = enemies.length - 1; i >= 0; i--) {
                const e = enemies[i];
                if (this.checkCollision(e)) {
                    enemies.splice(i, 1);
                    score += 100;
                    return true;
                }
            }
        } else {
            if (this.checkCollision(player)) {
                gameOver(false);
                return true;
            }
        }

        return false;
    }

    checkCollision(target) {
        return this.x > target.x && this.x < target.x + target.width &&
               this.y > target.y && this.y < target.y + target.height;
    }

    draw() {
        ctx.fillStyle = this.isPlayer ? '#fff' : '#f00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Tank {
    constructor(x, y, isPlayer) {
        this.x = x;
        this.y = y;
        this.isPlayer = isPlayer;
        this.width = TILE_SIZE - 2;
        this.height = TILE_SIZE - 2;
        this.dir = 0;
        this.speed = isPlayer ? 2 : 1.5;
        this.lastShot = 0;
        this.shotCooldown = 800;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.dir * Math.PI / 2);
        
        ctx.fillStyle = this.isPlayer ? '#ffd700' : '#4a4a4a';
        // 坦克主体
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        // 炮管
        ctx.fillStyle = this.isPlayer ? '#c00' : '#f00';
        ctx.fillRect(-2, -this.height / 2 - 6, 4, 10);
        
        ctx.restore();
    }

    move() {
        let nextX = this.x;
        let nextY = this.y;

        if (this.dir === 0) nextY -= this.speed;
        if (this.dir === 1) nextX += this.speed;
        if (this.dir === 2) nextY += this.speed;
        if (this.dir === 3) nextX -= this.speed;

        if (!this.checkWallCollision(nextX, nextY)) {
            this.x = nextX;
            this.y = nextY;
            return true;
        }
        return false;
    }

    checkWallCollision(nx, ny) {
        // 边界
        if (nx < 0 || nx + this.width > canvas.width || ny < 0 || ny + this.height > canvas.height) return true;

        // 地图块
        const points = [
            {x: nx, y: ny}, {x: nx + this.width, y: ny},
            {x: nx, y: ny + this.height}, {x: nx + this.width, y: ny + this.height}
        ];

        for (let p of points) {
            const tx = Math.floor(p.x / TILE_SIZE);
            const ty = Math.floor(p.y / TILE_SIZE);
            if (map[ty] && (map[ty][tx] === 1 || map[ty][tx] === 2 || map[ty][tx] === 3)) return true;
        }

        return false;
    }

    shoot() {
        const now = Date.now();
        if (now - this.lastShot > this.shotCooldown) {
            const bx = this.x + this.width / 2;
            const by = this.y + this.height / 2;
            bullets.push(new Bullet(bx, by, this.dir, this.isPlayer));
            this.lastShot = now;
        }
    }
}

class Enemy extends Tank {
    constructor(x, y) {
        super(x, y, false);
        this.moveCounter = 0;
        this.changeDirInterval = 50 + Math.random() * 50;
    }

    update() {
        if (!this.move()) {
            this.dir = Math.floor(Math.random() * 4);
        }
        if (this.moveCounter++ > this.changeDirInterval) {
            this.dir = Math.floor(Math.random() * 4);
            this.moveCounter = 0;
        }
        if (Math.random() < 0.02) this.shoot();
    }
}

function initGame() {
    score = 0;
    level = 1;
    bullets = [];
    map = JSON.parse(JSON.stringify(MAP_DATA));
    player = new Tank(9 * TILE_SIZE, 24 * TILE_SIZE, true);
    enemies = [
        new Enemy(0, 0),
        new Enemy(12 * TILE_SIZE, 0),
        new Enemy(25 * TILE_SIZE, 0)
    ];
    scoreEl.textContent = score;
    levelEl.textContent = level;
    enemyCountEl.textContent = enemies.length;
}

function update() {
    if (!gameRunning) return;

    // Player move
    if (keys['ArrowUp'] || keys['w']) { player.dir = 0; player.move(); }
    else if (keys['ArrowRight'] || keys['d']) { player.dir = 1; player.move(); }
    else if (keys['ArrowDown'] || keys['s']) { player.dir = 2; player.move(); }
    else if (keys['ArrowLeft'] || keys['a']) { player.dir = 3; player.move(); }

    if (keys[' ']) player.shoot();

    // Enemies update
    enemies.forEach(e => e.update());

    // Bullets update
    for (let i = bullets.length - 1; i >= 0; i--) {
        if (bullets[i].update()) bullets.splice(i, 1);
    }

    enemyCountEl.textContent = enemies.length;
    scoreEl.textContent = score;

    if (enemies.length === 0) {
        gameOver(true);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Map
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const tile = map[r][c];
            if (tile === 1) { // Brick
                ctx.fillStyle = '#a52a2a';
                ctx.fillRect(c * TILE_SIZE + 1, r * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                ctx.strokeStyle = '#000';
                ctx.strokeRect(c * TILE_SIZE + 2, r * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            } else if (tile === 2) { // Steel
                ctx.fillStyle = '#aaa';
                ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = '#fff';
                ctx.strokeRect(c * TILE_SIZE + 4, r * TILE_SIZE + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            } else if (tile === 3) { // Eagle (Base)
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.moveTo(c * TILE_SIZE + TILE_SIZE/2, r * TILE_SIZE);
                ctx.lineTo(c * TILE_SIZE + TILE_SIZE, r * TILE_SIZE + TILE_SIZE);
                ctx.lineTo(c * TILE_SIZE, r * TILE_SIZE + TILE_SIZE);
                ctx.fill();
            }
        }
    }

    player.draw();
    enemies.forEach(e => e.draw());
    bullets.forEach(b => b.draw());
}

function gameLoop() {
    update();
    draw();
    if (gameRunning) requestAnimationFrame(gameLoop);
}

function gameOver(win) {
    gameRunning = false;
    overlay.classList.remove('hidden');
    messageEl.textContent = win ? 'VICTORY!' : 'GAME OVER';
    messageEl.style.color = win ? '#0f0' : '#f00';
    finalScoreEl.textContent = score;
}

// Controls
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = keys[e.key] = false);

startBtn.onclick = () => {
    startScreen.classList.add('hidden');
    gameRunning = true;
    initGame();
    gameLoop();
};

restartBtn.onclick = () => {
    overlay.classList.add('hidden');
    gameRunning = true;
    initGame();
    gameLoop();
};

// 游戏常量
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = [
    null,
    'rgba(255, 89, 94, 0.9)',   // 珊瑚红
    'rgba(255, 202, 58, 0.9)',  // 明黄
    'rgba(72, 219, 251, 0.9)',  // 天蓝
    'rgba(29, 209, 161, 0.9)',  // 薄荷绿
    'rgba(162, 155, 254, 0.9)', // 淡紫
    'rgba(255, 159, 67, 0.9)',  // 橙色
    'rgba(255, 107, 107, 0.9)'  // 粉红
];

// 方块形状定义
const SHAPES = [
    null,
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], // I
    [[2, 0, 0], [2, 2, 2], [0, 0, 0]], // J
    [[0, 0, 3], [3, 3, 3], [0, 0, 0]], // L
    [[4, 4], [4, 4]], // O
    [[0, 5, 5], [5, 5, 0], [0, 0, 0]], // S
    [[0, 6, 0], [6, 6, 6], [0, 0, 0]], // T
    [[7, 7, 0], [0, 7, 7], [0, 0, 0]]  // Z
];

// 音频控制
let musicEnabled = true;
let soundEnabled = true;
let backgroundMusic = new Audio('assets/music/background.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5;

// 音效
const moveSound = new Audio('8-Bit Sound Library/Mp3/Menu_Navigate_00.mp3');
const rotateSound = new Audio('8-Bit Sound Library/Mp3/Menu_Navigate_01.mp3');
const dropSound = new Audio('8-Bit Sound Library/Mp3/Hit_00.mp3');
const clearSound = new Audio('8-Bit Sound Library/Mp3/Jingle_Achievement_00.mp3');
const gameoverSound = new Audio('8-Bit Sound Library/Mp3/Jingle_Lose_00.mp3');

// 设置音效音量
moveSound.volume = 0.3;
rotateSound.volume = 0.3;
dropSound.volume = 0.3;
clearSound.volume = 0.4;
gameoverSound.volume = 0.4;

// 游戏状态
let canvas = document.getElementById('tetris-canvas');
let ctx = canvas.getContext('2d');
let nextPieceCanvas = document.getElementById('next-piece-canvas');
let nextPieceCtx = nextPieceCanvas.getContext('2d');
let scoreElement = document.getElementById('score');
let levelElement = document.getElementById('level');
let linesElement = document.getElementById('lines');
let startButton = document.getElementById('start-button');
let pauseButton = document.getElementById('pause-button');
let musicToggleButton = document.getElementById('music-toggle');
let soundToggleButton = document.getElementById('sound-toggle');

// 游戏变量
let board = createBoard();
let score = 0;
let level = 1;
let lines = 0;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let paused = false;
let gameOver = false;
let currentPiece = null;
let nextPiece = null;

// 音频文件路径
const AUDIO_FILES = {
    background: 'assets/music/background.mp3',
    rotate: 'assets/sounds/rotate.mp3',
    move: 'assets/sounds/move.mp3',
    drop: 'assets/sounds/drop.mp3',
    clear: 'assets/sounds/clear.mp3',
    gameover: 'assets/sounds/gameover.mp3'
};

// 音量控制
let musicVolume = 0.5;
let soundVolume = 0.3;

// 初始化音量控制
function initVolumeControls() {
    const musicVolumeSlider = document.getElementById('music-volume');
    const soundVolumeSlider = document.getElementById('sound-volume');
    
    // 设置初始值
    musicVolumeSlider.value = musicVolume * 100;
    soundVolumeSlider.value = soundVolume * 100;
    
    // 音乐音量控制
    musicVolumeSlider.addEventListener('input', (e) => {
        musicVolume = e.target.value / 100;
        if (backgroundMusic) {
            backgroundMusic.volume = musicVolume;
        }
    });
    
    // 音效音量控制
    soundVolumeSlider.addEventListener('input', (e) => {
        soundVolume = e.target.value / 100;
    });
}

// 创建游戏板
function createBoard() {
    return Array.from({length: ROWS}, () => Array(COLS).fill(0));
}

// 创建新方块
function createPiece() {
    const pieceType = Math.floor(Math.random() * 7) + 1;
    return {
        type: pieceType,
        matrix: SHAPES[pieceType],
        pos: {x: Math.floor(COLS / 2) - Math.floor(SHAPES[pieceType][0].length / 2), y: 0}
    };
}

// 绘制方块
function drawBlock(ctx, x, y, color) {
    const blockX = x * BLOCK_SIZE;
    const blockY = y * BLOCK_SIZE;
    
    // 绘制主体
    ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // 绘制圆角矩形
    const radius = 4;
    ctx.beginPath();
    ctx.moveTo(blockX + radius, blockY);
    ctx.lineTo(blockX + BLOCK_SIZE - radius, blockY);
    ctx.quadraticCurveTo(blockX + BLOCK_SIZE, blockY, blockX + BLOCK_SIZE, blockY + radius);
    ctx.lineTo(blockX + BLOCK_SIZE, blockY + BLOCK_SIZE - radius);
    ctx.quadraticCurveTo(blockX + BLOCK_SIZE, blockY + BLOCK_SIZE, blockX + BLOCK_SIZE - radius, blockY + BLOCK_SIZE);
    ctx.lineTo(blockX + radius, blockY + BLOCK_SIZE);
    ctx.quadraticCurveTo(blockX, blockY + BLOCK_SIZE, blockX, blockY + BLOCK_SIZE - radius);
    ctx.lineTo(blockX, blockY + radius);
    ctx.quadraticCurveTo(blockX, blockY, blockX + radius, blockY);
    ctx.closePath();
    ctx.fill();
    
    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // 边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
}

// 绘制游戏板背景
function drawBoardBackground(ctx) {
    // 绘制渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(240, 240, 240, 0.3)');
    gradient.addColorStop(1, 'rgba(220, 220, 220, 0.3)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 添加网格线
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.2)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= COLS; i++) {
        ctx.beginPath();
        ctx.moveTo(i * BLOCK_SIZE, 0);
        ctx.lineTo(i * BLOCK_SIZE, canvas.height);
        ctx.stroke();
    }
    
    for (let i = 0; i <= ROWS; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * BLOCK_SIZE);
        ctx.lineTo(canvas.width, i * BLOCK_SIZE);
        ctx.stroke();
    }
}

// 修改绘制游戏板函数
function drawBoard() {
    drawBoardBackground(ctx);
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                drawBlock(ctx, x, y, COLORS[value]);
            }
        });
    });
}

// 修改绘制当前方块函数
function drawPiece(piece, context, offsetX = 0, offsetY = 0) {
    piece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                drawBlock(context, x + piece.pos.x + offsetX, y + piece.pos.y + offsetY, COLORS[value]);
            }
        });
    });
}

// 绘制下一个方块
function drawNextPiece() {
    nextPieceCtx.clearRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
    if (nextPiece) {
        const offsetX = (nextPieceCanvas.width / BLOCK_SIZE - nextPiece.matrix[0].length) / 2;
        const offsetY = (nextPieceCanvas.height / BLOCK_SIZE - nextPiece.matrix.length) / 2;
        nextPiece.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    drawBlock(nextPieceCtx, x + offsetX, y + offsetY, COLORS[value]);
                }
            });
        });
    }
}

// 清除画布
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 重置阴影效果
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

// 碰撞检测
function collide(piece, board) {
    const matrix = piece.matrix;
    const pos = piece.pos;
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            if (matrix[y][x] !== 0 &&
                (board[y + pos.y] === undefined ||
                 board[y + pos.y][x + pos.x] === undefined ||
                 board[y + pos.y][x + pos.x] !== 0)) {
                return true;
            }
        }
    }
    return false;
}

// 合并方块到游戏板
function merge(piece, board) {
    piece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + piece.pos.y][x + piece.pos.x] = value;
            }
        });
    });
}

// 旋转方块
function rotate(matrix, dir) {
    const result = matrix.map((row, i) =>
        row.map((val, j) => matrix[matrix.length - 1 - j][i])
    );
    return dir > 0 ? result : rotate(rotate(rotate(result)));
}

// 玩家旋转方块
function playerRotate(dir) {
    if (paused || gameOver) return;
    const pos = currentPiece.pos.x;
    let offset = 1;
    currentPiece.matrix = rotate(currentPiece.matrix, dir);
    while (collide(currentPiece, board)) {
        currentPiece.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > currentPiece.matrix[0].length) {
            currentPiece.matrix = rotate(rotate(rotate(currentPiece.matrix)));
            currentPiece.pos.x = pos;
            return;
        }
    }
    playSound('rotate');
}

// 玩家移动方块
function playerMove(dir) {
    if (paused || gameOver) return;
    currentPiece.pos.x += dir;
    if (collide(currentPiece, board)) {
        currentPiece.pos.x -= dir;
    } else {
        playSound('move');
    }
}

// 玩家下落方块
function playerDrop() {
    if (paused || gameOver) return;
    currentPiece.pos.y++;
    if (collide(currentPiece, board)) {
        currentPiece.pos.y--;
        merge(currentPiece, board);
        resetPiece();
        clearLines();
        updateScore();
        playSound('drop');
    }
    dropCounter = 0;
}

// 硬下落（直接落到底部）
function hardDrop() {
    if (paused || gameOver) return;
    while (!collide(currentPiece, board)) {
        currentPiece.pos.y++;
    }
    currentPiece.pos.y--;
    merge(currentPiece, board);
    resetPiece();
    clearLines();
    updateScore();
    playSound('drop');
}

// 清除完整的行
function clearLines() {
    let linesCleared = 0;
    outer: for (let y = board.length - 1; y >= 0; y--) {
        for (let x = 0; x < board[y].length; x++) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }
        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        y++;
        linesCleared++;
    }
    if (linesCleared > 0) {
        lines += linesCleared;
        linesElement.textContent = lines;
        level = Math.floor(lines / 10) + 1;
        levelElement.textContent = level;
        dropInterval = Math.max(100, 1000 - (level - 1) * 100);
        playSound('clear');
    }
}

// 更新分数
function updateScore() {
    score += 100;
    scoreElement.textContent = score;
}

// 重置方块
function resetPiece() {
    if (nextPiece === null) {
        currentPiece = createPiece();
        nextPiece = createPiece();
    } else {
        currentPiece = nextPiece;
        nextPiece = createPiece();
    }
    drawNextPiece();
    
    if (collide(currentPiece, board)) {
        gameOver = true;
        playSound('gameover');
        stopBackgroundMusic();
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        alert('游戏结束！你的得分是: ' + score);
    }
}

// 游戏循环
function update(time = 0) {
    if (gameOver) return;
    
    const deltaTime = time - lastTime;
    lastTime = time;
    
    if (!paused) {
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }
        
        clearCanvas();
        drawBoard();
        drawPiece(currentPiece, ctx);
    }
    
    requestAnimationFrame(update);
}

// 键盘控制
document.addEventListener('keydown', event => {
    if (gameOver) return;
    
    switch (event.keyCode) {
        case 37: // 左箭头
            playerMove(-1);
            break;
        case 39: // 右箭头
            playerMove(1);
            break;
        case 40: // 下箭头
            playerDrop();
            break;
        case 38: // 上箭头
            playerRotate(1);
            break;
        case 32: // 空格
            hardDrop();
            break;
        case 80: // P键
            togglePause();
            break;
        case 77: // M键
            toggleMusic();
            break;
    }
});

// 开始游戏
function startGame() {
    if (gameOver) {
        board = createBoard();
        score = 0;
        level = 1;
        lines = 0;
        gameOver = false;
        scoreElement.textContent = score;
        levelElement.textContent = level;
        linesElement.textContent = lines;
    }
    
    resetPiece();
    update();
    startButton.textContent = '重新开始';
    
    // 播放背景音乐
    if (musicEnabled) {
        playBackgroundMusic();
    }
}

// 暂停/继续游戏
function togglePause() {
    paused = !paused;
    pauseButton.textContent = paused ? '继续' : '暂停';
    
    if (paused) {
        stopBackgroundMusic();
    } else if (musicEnabled) {
        playBackgroundMusic();
    }
}

// 切换音乐
function toggleMusic() {
    musicEnabled = !musicEnabled;
    const musicButton = document.getElementById('music-toggle');
    if (musicEnabled) {
        musicButton.innerHTML = '<i class="fas fa-volume-up"></i> 音乐开';
        playBackgroundMusic();
    } else {
        musicButton.innerHTML = '<i class="fas fa-volume-mute"></i> 音乐关';
        stopBackgroundMusic();
    }
}

// 切换音效
function toggleSound() {
    soundEnabled = !soundEnabled;
    const soundButton = document.getElementById('sound-toggle');
    if (soundEnabled) {
        soundButton.innerHTML = '<i class="fas fa-bell"></i> 音效开';
    } else {
        soundButton.innerHTML = '<i class="fas fa-bell-slash"></i> 音效关';
    }
}

// 事件监听
startButton.addEventListener('click', () => {
    startGame();
});
pauseButton.addEventListener('click', togglePause);
if (musicToggleButton) {
    musicToggleButton.addEventListener('click', toggleMusic);
}
if (soundToggleButton) {
    soundToggleButton.addEventListener('click', toggleSound);
}

// 初始化游戏
resetPiece();

// 创建背景音乐
function createBackgroundMusic() {
    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic = null;
    }
    
    backgroundMusic = new Audio(AUDIO_FILES.background);
    backgroundMusic.loop = true;
    backgroundMusic.volume = musicVolume;
}

// 播放背景音乐
function playBackgroundMusic() {
    if (!musicEnabled) return;
    
    if (!backgroundMusic) {
        createBackgroundMusic();
    }
    
    if (backgroundMusic.paused) {
        backgroundMusic.play().catch(error => {
            console.error('播放背景音乐失败:', error);
        });
    }
}

// 停止背景音乐
function stopBackgroundMusic() {
    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }
}

// 创建音效
function createSound(type) {
    const sound = new Audio(AUDIO_FILES[type]);
    sound.volume = soundVolume;
    return sound;
}

// 播放音效
function playSound(type) {
    if (!soundEnabled) return;
    
    const sound = createSound(type);
    sound.play().catch(error => {
        console.error(`播放${type}音效失败:`, error);
    });
}

// 在游戏初始化时调用
function initGame() {
    initVolumeControls();
    startGame();
}

// 调用初始化函数
initGame(); 
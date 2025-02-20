console.log('游戏脚本开始加载');

class TetrisGame {
    constructor() {
        console.log('TetrisGame 构造函数被调用');
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.blockSize = 20;
        this.cols = 10;
        this.rows = 13;
        
        // 修改画布初始化
        this.initCanvas();
        
        // 游戏状态
        this.grid = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.score = 0;
        this.gameOver = false;
        this.currentPiece = null;
        
        // 修改俄罗斯方块的形状定义
        this.shapes = {
            I: [[0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]],
            L: [[0, 0, 1],
                [1, 1, 1],
                [0, 0, 0]],
            J: [[1, 0, 0],
                [1, 1, 1],
                [0, 0, 0]],
            O: [[1, 1],
                [1, 1]],
            Z: [[1, 1, 0],
                [0, 1, 1],
                [0, 0, 0]],
            S: [[0, 1, 1],
                [1, 1, 0],
                [0, 0, 0]],
            T: [[0, 1, 0],
                [1, 1, 1],
                [0, 0, 0]]
        };
        
        // 定义颜色
        this.colors = {
            I: '#4ECDC4', // 清新的青绿色
            L: '#FF6B6B', // 柔和的珊瑚红
            J: '#45B7D1', // 明亮的天蓝色
            O: '#FFE66D', // 温暖的黄色
            Z: '#95E1D3', // 薄荷绿
            S: '#A8E6CF', // 淡绿色
            T: '#B39DDB'  // 柔和的紫色
        };
        
        // 添加暂停状态
        this.isPaused = false;
        
        // 添加暂停按钮事件监听
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.togglePause();
        });
        
        // 添加键盘暂停控制（P键或ESC键）
        document.addEventListener('keydown', (e) => {
            if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
                this.togglePause();
            }
        });
        
        // 初始化控制
        this.initControls();
        this.initMobileControls();
        
        // 修改初始化分数系统
        this.loadHighScores();
        
        // 修改游戏速度相关属性
        this.baseSpeed = 800; // 调整基础速度为800ms
        this.currentSpeed = this.baseSpeed;
        this.level = 1;
        this.dropCounter = 0;
        this.lastTime = 0;
        this.isRunning = false; // 添加游戏运行状态标志

        // 修改模态框关闭事件
        document.getElementById('closeModal').addEventListener('click', () => {
            document.getElementById('gameOverModal').classList.add('hidden');
            document.getElementById('gameOverModal').style.display = 'none'; // 确保模态框隐藏
            document.getElementById('startBtn').style.display = 'none';
            document.getElementById('restartBtn').style.display = 'block';
            this.start(); // 重新开始游戏
        });
    }

    // 添加画布初始化方法
    initCanvas() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth - 32; // 减去padding
        
        // 计算合适的方块大小
        this.blockSize = Math.floor(Math.min(
            containerWidth / this.cols,
            (window.innerHeight * 0.5) / this.rows // 限制高度为视口高度的50%
        ));
        
        // 设置画布大小
        this.canvas.width = this.blockSize * this.cols;
        this.canvas.height = this.blockSize * this.rows;
    }

    // 初始化游戏控制
    initControls() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver || this.isPaused) return;
            
            if (!this.currentPiece) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    this.movePiece(0, 1);
                    break;
                case 'ArrowUp':
                    this.rotatePiece();
                    break;
                case ' ':
                    this.hardDrop();
                    break;
            }
        });
    }

    // 初始化移动端控制
    initMobileControls() {
        const controlButtons = ['leftBtn', 'rightBtn', 'downBtn', 'rotateBtn'];
        controlButtons.forEach(btnId => {
            document.getElementById(btnId).addEventListener('click', () => {
                if (this.gameOver || this.isPaused) return;
                
                if (this.currentPiece) {
                    switch(btnId) {
                        case 'leftBtn':
                            this.movePiece(-1, 0);
                            break;
                        case 'rightBtn':
                            this.movePiece(1, 0);
                            break;
                        case 'downBtn':
                            this.movePiece(0, 1);
                            break;
                        case 'rotateBtn':
                            this.rotatePiece();
                            break;
                    }
                }
            });
        });
    }

    // 开始游戏
    start() {
        console.log('游戏开始初始化'); // 调试日志
        
        this.initCanvas();
        
        this.gameOver = false;
        this.score = 0;
        this.level = 1;
        this.currentSpeed = this.baseSpeed;
        this.dropCounter = 0;
        this.lastTime = 0;
        this.isRunning = true;
        this.grid = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.currentPiece = null;
        
        // 生成第一个方块
        if (!this.spawnPiece()) {
            console.error('无法生成方块');
            return;
        }
        
        // 更新显示
        document.getElementById('level').textContent = this.level;
        document.getElementById('score').textContent = this.score;
        document.getElementById('highScore').textContent = this.getHighScore();
        
        // 隐藏游戏结束模态框
        const gameOverModal = document.getElementById('gameOverModal');
        if (gameOverModal) {
            gameOverModal.classList.add('hidden');
            gameOverModal.style.display = 'none';
        }
        
        // 确保游戏未暂停
        this.isPaused = false;
        
        console.log('开始游戏循环'); // 调试日志
        // 开始游戏循环
        this.gameLoop(performance.now());
    }

    // 游戏主循环
    gameLoop(currentTime) {
        console.log('游戏循环运行中'); // 调试日志
        
        if (!this.isRunning || this.gameOver || this.isPaused) {
            console.log('游戏状态:', {
                isRunning: this.isRunning,
                gameOver: this.gameOver,
                isPaused: this.isPaused
            });
            if (this.gameOver) {
                const modal = document.getElementById('gameOverModal');
                const finalScore = document.getElementById('finalScore');
                finalScore.textContent = this.score;
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
            }
            return;
        }

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        this.dropCounter += deltaTime;

        if (this.dropCounter > this.currentSpeed) {
            this.dropCounter = 0;
            if (!this.movePiece(0, 1)) {
                this.placePiece();
                this.clearLines();
                if (!this.spawnPiece()) {
                    this.gameOver = true;
                    this.saveScore();
                    return;
                }
            }
        }

        this.draw();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    // 更新游戏状态
    update() {
        if (!this.currentPiece) {
            this.spawnPiece();
            return;
        }

        if (!this.movePiece(0, 1)) {
            this.placePiece();
            this.clearLines();
            this.spawnPiece();
            
            if (this.checkGameOver()) {
                this.gameOver = true;
                this.saveScore();
            }
        }
    }

    // 绘制游戏画面
    draw() {
        if (!this.ctx) return;  // 添加安全检查
        
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格
        this.drawGrid();
        
        // 绘制当前方块
        if (this.currentPiece) {
            this.drawPiece();
        }
    }

    // 保存分数
    saveScore() {
        const scores = JSON.parse(localStorage.getItem('tetrisScores') || '[]');
        scores.push({
            score: this.score,
            date: new Date().toISOString()
        });
        scores.sort((a, b) => b.score - a.score);
        localStorage.setItem('tetrisScores', JSON.stringify(scores.slice(0, 10)));
        
        // 更新最高分显示
        document.getElementById('highScore').textContent = Math.max(...scores.map(s => s.score));
        
        // 显示游戏结束模态框
        const modal = document.getElementById('gameOverModal');
        const finalScore = document.getElementById('finalScore');
        finalScore.textContent = this.score;
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }

    // 加载最高分
    loadHighScores() {
        const scores = JSON.parse(localStorage.getItem('tetrisScores') || '[]');
        if (scores.length > 0) {
            document.getElementById('highScore').textContent = Math.max(...scores.map(s => s.score));
        }
    }

    // 更新排行榜显示
    updateLeaderboard() {
        const scores = JSON.parse(localStorage.getItem('tetrisScores') || '[]');
        if (scores.length > 0) {
            document.getElementById('highScore').textContent = Math.max(...scores.map(s => s.score));
        }
    }

    // 生成新方块
    spawnPiece() {
        const shapes = Object.keys(this.shapes);
        const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
        
        // 创建形状的深拷贝
        const shape = this.shapes[randomShape].map(row => [...row]);
        
        this.currentPiece = {
            shape: shape,
            type: randomShape,
            x: Math.floor((this.cols - shape[0].length) / 2),
            y: 0
        };
        
        // 检查是否可以放置新方块
        if (this.checkCollision(0, 0, this.currentPiece)) {
            this.gameOver = true;
            this.saveScore();
            return false;
        }
        return true;
    }

    // 检查碰撞
    checkCollision(offsetX = 0, offsetY = 0, piece = this.currentPiece) {
        const shape = piece.shape;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const newX = piece.x + x + offsetX;
                    const newY = piece.y + y + offsetY;
                    
                    if (newX < 0 || newX >= this.cols || newY >= this.rows) {
                        return true;
                    }
                    
                    if (newY >= 0 && this.grid[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // 移动方块
    movePiece(dx, dy) {
        if (!this.checkCollision(dx, dy)) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            return true;
        }
        return false;
    }

    // 旋转方块
    rotatePiece() {
        const shape = this.currentPiece.shape;
        const N = shape.length;
        const rotated = Array(N).fill().map(() => Array(N).fill(0));
        
        // 矩阵旋转
        for (let y = 0; y < N; y++) {
            for (let x = 0; x < N; x++) {
                rotated[x][N - 1 - y] = shape[y][x];
            }
        }
        
        const piece = {
            ...this.currentPiece,
            shape: rotated
        };
        
        if (!this.checkCollision(0, 0, piece)) {
            this.currentPiece = piece;
        }
    }

    // 快速下落
    hardDrop() {
        while (this.movePiece(0, 1)) {}
        this.placePiece();
        this.clearLines();
        this.spawnPiece();
    }

    // 放置方块
    placePiece() {
        const piece = this.currentPiece;
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    this.grid[piece.y + y][piece.x + x] = piece.type;
                }
            }
        }
    }

    // 清除完整的行
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.rows - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell)) {
                this.grid.splice(y, 1);
                this.grid.unshift(Array(this.cols).fill(0));
                linesCleared++;
                y++; // 重新检查当前行
            }
        }
        
        if (linesCleared > 0) {
            this.score += [0, 100, 300, 500, 800][linesCleared];
            document.getElementById('score').textContent = this.score;
            
            // 每清除10行提高一个等级
            const newLevel = Math.floor(this.score / 1000) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                this.currentSpeed = Math.max(100, this.baseSpeed * Math.pow(0.8, this.level - 1));
                document.getElementById('level').textContent = this.level;
            }
        }
    }

    // 检查游戏结束
    checkGameOver() {
        return this.grid[0].some(cell => cell);
    }

    // 绘制网格
    drawGrid() {
        if (!this.ctx) return;  // 添加安全检查
        
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                // 绘制网格线
                this.ctx.strokeStyle = '#f0f0f0';
                this.ctx.strokeRect(
                    x * this.blockSize,
                    y * this.blockSize,
                    this.blockSize,
                    this.blockSize
                );
                
                if (this.grid[y][x]) {
                    const baseColor = this.colors[this.grid[y][x]];
                    const gradient = this.ctx.createLinearGradient(
                        x * this.blockSize,
                        y * this.blockSize,
                        (x + 1) * this.blockSize,
                        (y + 1) * this.blockSize
                    );
                    gradient.addColorStop(0, baseColor);
                    gradient.addColorStop(1, this.adjustColor(baseColor, -20));
                    
                    this.drawRoundedRect(
                        x * this.blockSize,
                        y * this.blockSize,
                        this.blockSize,
                        this.blockSize,
                        4,
                        gradient
                    );
                }
            }
        }
    }

    // 绘制当前方块
    drawPiece() {
        if (!this.currentPiece || !this.ctx) return;
        
        const piece = this.currentPiece;
        const baseColor = this.colors[piece.type];
        
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const xPos = (piece.x + x) * this.blockSize;
                    const yPos = (piece.y + y) * this.blockSize;
                    
                    const gradient = this.ctx.createLinearGradient(
                        xPos, yPos,
                        xPos + this.blockSize,
                        yPos + this.blockSize
                    );
                    gradient.addColorStop(0, baseColor);
                    gradient.addColorStop(1, this.adjustColor(baseColor, -20));
                    
                    this.drawRoundedRect(
                        xPos,
                        yPos,
                        this.blockSize,
                        this.blockSize,
                        4,
                        gradient
                    );
                }
            }
        }
    }

    // 添加圆角矩形绘制方法
    drawRoundedRect(x, y, width, height, radius, fillStyle) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        
        this.ctx.fillStyle = fillStyle;
        this.ctx.fill();
    }

    // 添加颜色调整方法
    adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    // 添加暂停切换方法
    togglePause() {
        if (this.gameOver) return;
        
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pauseBtn');
        
        if (this.isPaused) {
            pauseBtn.textContent = '继续游戏';
            pauseBtn.classList.remove('from-yellow-500', 'to-yellow-600', 'hover:from-yellow-600', 'hover:to-yellow-700');
            pauseBtn.classList.add('from-green-500', 'to-green-600', 'hover:from-green-600', 'hover:to-green-700');
            this.drawPauseScreen();
        } else {
            pauseBtn.textContent = '暂停游戏';
            pauseBtn.classList.remove('from-green-500', 'to-green-600', 'hover:from-green-600', 'hover:to-green-700');
            pauseBtn.classList.add('from-yellow-500', 'to-yellow-600', 'hover:from-yellow-600', 'hover:to-yellow-700');
            requestAnimationFrame(time => this.gameLoop(time));
        }
    }

    // 添加暂停画面绘制方法
    drawPauseScreen() {
        // 半透明遮罩
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 暂停文本
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('游戏暂停', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.font = '16px Arial';
        this.ctx.fillText('按 P 键或点击按钮继续', this.canvas.width / 2, this.canvas.height / 2 + 30);
    }

    // 添加获取最高分方法
    getHighScore() {
        const scores = JSON.parse(localStorage.getItem('tetrisScores') || '[]');
        return scores.length > 0 ? Math.max(...scores.map(s => s.score)) : 0;
    }
}

// 添加窗口大小改变时的处理
window.addEventListener('resize', () => {
    if (window.game) {
        window.game.initCanvas();
        window.game.draw();
    }
});

// 立即执行的调试代码
console.log('准备初始化游戏');
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM已加载，开始初始化游戏');
    try {
        // 确保所有必要的DOM元素都存在
        const startBtn = document.getElementById('startBtn');
        const restartBtn = document.getElementById('restartBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const canvas = document.getElementById('gameCanvas');

        console.log('DOM元素检查：', {
            startBtn: !!startBtn,
            restartBtn: !!restartBtn,
            pauseBtn: !!pauseBtn,
            canvas: !!canvas
        });

        if (!canvas || !startBtn || !restartBtn || !pauseBtn) {
            throw new Error('找不到必要的DOM元素');
        }

        // 创建游戏实例
        window.game = new TetrisGame();
        console.log('游戏实例已创建');
        
        // 初始按钮状态设置
        restartBtn.style.display = 'none';
        pauseBtn.style.display = 'none';
        startBtn.style.display = 'block';

        // 绑定事件监听器
        startBtn.onclick = function() {
            console.log('开始按钮被点击');
            window.game.start();
            startBtn.style.display = 'none';
            restartBtn.style.display = 'block';
            pauseBtn.style.display = 'block';
        };
        
        restartBtn.onclick = function() {
            console.log('重新开始按钮被点击');
            window.game.start();
        };

        // 初始绘制游戏区域
        window.game.draw();
        console.log('初始化完成');
    } catch (error) {
        console.error('游戏初始化失败:', error);
    }
}); 
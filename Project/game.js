// 游戏配置
// 可以手动调整以下数值

// 游戏常量

(function () {
if (window.__RUNE_GAME_INITED__) return;
window.__RUNE_GAME_INITED__ = true;
const BOARD_SIZE = 9;
const ALTAR_POSITION = { x: 4, y: 4 }; // 中央灵枢位置（0-based索引）
const INITIAL_RUNES = { 1: 5, 2: 2, 3: 2, 4: 2 };
const INITIAL_ALTAR_HEALTH = 3; // 灵枢初始血量
const TOTAL_WAVES = 10;

// 音频元素
let bgMusic, buttonSound, bulletSound, altarDeathSound, placeRuneSound;

// 播放音效函数
function playSound(soundId) {
    const sound = document.getElementById(soundId);
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log('Audio play failed:', e));
    }
}

// 符文配置
const RUNE_CONFIG = {
    1: { name: '防御墙', health: 2, attack: false, range: 0, damage: 0, attackSpeed: 0 },
    2: { name: '高级防御墙', health: 4, attack: false, range: 0, damage: 0, attackSpeed: 0 },
    3: { name: '基础符文塔', health: 3, attack: true, range: 2, damage: 1, attackSpeed: 1000 },
    4: { name: '高级符文塔', health: 5, attack: true, range: 3, damage: 1, attackSpeed: 700 }
};

// 怪物配置
const MONSTER_CONFIG = {
    normal: { name: '普通怪', health: 2, damage: 1, speed: 500, drop: { 1: 0.8, 2: 0.2 } },
    elite: { name: '精英怪', health: 4, damage: 1, speed: 400, drop: { 2: 0.7, 3: 0.3 } },
    boss: { name: 'BOSS', health: 10, damage: 2, speed: 600, drop: { 2: 5, 3: 3, 4: 1 } }
};

// 波次配置
const WAVE_CONFIG = [
    { normal: 3, elite: 0, boss: 0 },    // 波次1
    { normal: 4, elite: 0, boss: 0 },    // 波次2
    { normal: 5, elite: 0, boss: 0 },    // 波次3
    { normal: 6, elite: 0, boss: 0 },    // 波次4
    { normal: 7, elite: 0, boss: 0 },    // 波次5
    { normal: 5, elite: 2, boss: 0 },    // 波次6
    { normal: 6, elite: 3, boss: 0 },    // 波次7
    { normal: 7, elite: 4, boss: 0 },    // 波次8
    { normal: 8, elite: 5, boss: 0 },    // 波次9
    { normal: 0, elite: 0, boss: 1 }     // 波次10
];

// 游戏状态
let gameState = {
    board: Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null)),
    runes: { ...INITIAL_RUNES },
    altarHealth: INITIAL_ALTAR_HEALTH, // 灵枢血量
    currentWave: 1,
    isWaveActive: false,
    monsters: [],
    selectedRune: null,
    gameOver: false,
    gameWon: false
};

// DOM元素
let gameBoard, runeList, waveDisplay, altarHealthDisplay, monsterCountDisplay, totalMonstersDisplay, startWaveButton, restartButton, exitButton, gameMessage;

// 当前波次总怪物数量
let totalMonsters = 0;

// 初始化游戏
function initGame() {
    // 获取DOM元素
    gameBoard = document.getElementById('game-board');
    runeList = document.getElementById('rune-list');
    waveDisplay = document.getElementById('wave');
    altarHealthDisplay = document.getElementById('altar-health'); // 灵枢血量显示
    monsterCountDisplay = document.getElementById('monster-count');
    totalMonstersDisplay = document.getElementById('total-monsters');
    startWaveButton = document.getElementById('start-wave');
    restartButton = document.getElementById('restart-game');
    exitButton = document.getElementById('exit-game');
    gameMessage = document.getElementById('game-message');
    
    // 初始化音频元素
    bgMusic = document.getElementById('bg-music');
    buttonSound = document.getElementById('button-sound');
    bulletSound = document.getElementById('bullet-sound');
    altarDeathSound = document.getElementById('altar-death-sound');
    placeRuneSound = document.getElementById('place-rune-sound');
    
    // 生成游戏棋盘
    generateBoard();
    
    // 初始化UI
    updateRuneList();
    updateGameInfo();
    
    // 添加事件监听器
    startWaveButton.addEventListener('click', () => {
        // 第一次点击时播放背景音乐
        if (bgMusic && bgMusic.paused) {
            bgMusic.volume = 0.3;
            bgMusic.play().catch(e => console.log('Background music play failed:', e));
        }
        playSound('button-sound');
        startWave();
        // 隐藏开始游戏按钮，因为后续波次会自动开始
        startWaveButton.style.display = 'none';
    });
    restartButton.addEventListener('click', () => {
        playSound('button-sound');
        restartGame();
    });
    exitButton.addEventListener('click', () => {
        playSound('button-sound');
        exitGame();
    });
    
    // 为所有按钮添加音频播放权限
    document.addEventListener('click', () => {
        // 尝试播放一个静音的音频来获取音频播放权限
        const tempSound = document.createElement('audio');
        tempSound.volume = 0;
        tempSound.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAD';
        tempSound.play().catch(e => console.log('Audio permission request failed:', e));
    }, { once: true });
    
    // 显示初始消息
    showMessage('游戏已准备就绪，点击「开始游戏」开始游戏！');
}

// 生成游戏棋盘
function generateBoard() {
    gameBoard.innerHTML = '';
    
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const cell = document.createElement('div');
            cell.className = 'board-cell';
            cell.dataset.x = x;
            cell.dataset.y = y;
            
            // 标记祭坛位置
            if (x === ALTAR_POSITION.x && y === ALTAR_POSITION.y) {
                cell.classList.add('altar');
                cell.innerHTML = '灵枢';
            }
            
            // 添加点击事件
            cell.addEventListener('click', () => handleCellClick(x, y));
            
            gameBoard.appendChild(cell);
        }
    }
}

// 处理单元格点击
function handleCellClick(x, y) {
    if (gameState.gameOver) return;
    
    // 如果选择了符文且单元格为空且不是祭坛，则放置符文
    if (gameState.selectedRune && !gameState.board[y][x] && !(x === ALTAR_POSITION.x && y === ALTAR_POSITION.y)) {
        placeRune(x, y, gameState.selectedRune);
        gameState.selectedRune = null;
        updateRuneList();
    }
    // 如果点击的是已放置的符文，则显示拆除选项
    else if (gameState.board[y][x]) {
        if (confirm('确定要拆除这个符文吗？')) {
            removeRune(x, y);
        }
    }
}

// 放置符文
function placeRune(x, y, level) {
    if (gameState.runes[level] <= 0) return;
    
    gameState.board[y][x] = {
        type: 'rune',
        level: level,
        health: RUNE_CONFIG[level].health
    };
    
    gameState.runes[level]--;
    updateBoard();
    showMessage(`放置了 ${RUNE_CONFIG[level].name}`);
    // 播放放置符文音效
    playSound('place-rune-sound');
}

// 拆除符文
function removeRune(x, y) {
    const rune = gameState.board[y][x];
    if (!rune) return;
    
    // 返还符文
    gameState.runes[rune.level] = (gameState.runes[rune.level] || 0) + 1;
    gameState.board[y][x] = null;
    
    updateBoard();
    updateRuneList();
    showMessage(`拆除了 ${RUNE_CONFIG[rune.level].name}，返还了 1 个 ${RUNE_CONFIG[rune.level].name}`);
}

// 开始波次
function startWave() {
    if (gameState.isWaveActive || gameState.gameOver) return;
    
    gameState.isWaveActive = true;
    startWaveButton.disabled = true;
    showMessage(`第 ${gameState.currentWave} 波怪物来袭！`);
    
    // 生成怪物
    spawnMonsters();
    
    // 开始怪物移动和战斗循环
    gameLoop();
}

// 自动开始下一波
function startNextWave() {
    if (gameState.gameOver) return;
    
    if (gameState.currentWave > TOTAL_WAVES) {
        // 游戏胜利
        gameOver(true);
    } else {
        // 显示波次准备消息
        showMessage(`准备第 ${gameState.currentWave} 波怪物...`);
        
        // 1秒后开始下一波
        setTimeout(() => {
            startWave();
        }, 1000);
    }
}

// 生成怪物
function spawnMonsters() {
    const waveConfig = WAVE_CONFIG[gameState.currentWave - 1];
    const monsters = [];
    
    // 计算总怪物数量
    totalMonsters = waveConfig.normal + waveConfig.elite + waveConfig.boss;
    
    // 随机选择一个出怪方向
    const spawnEdge = Math.floor(Math.random() * 4);
    
    // 生成普通怪
    for (let i = 0; i < waveConfig.normal; i++) {
        monsters.push(createMonster('normal', spawnEdge));
    }
    
    // 生成精英怪
    for (let i = 0; i < waveConfig.elite; i++) {
        monsters.push(createMonster('elite', spawnEdge));
    }
    
    // 生成BOSS
    for (let i = 0; i < waveConfig.boss; i++) {
        monsters.push(createMonster('boss', spawnEdge));
    }
    
    gameState.monsters = monsters;
    updateMonsterCount();
    updateBoard();
}

// 更新怪物数量显示
function updateMonsterCount() {
    const aliveMonsters = gameState.monsters.length;
    monsterCountDisplay.innerHTML = aliveMonsters;
    totalMonstersDisplay.innerHTML = totalMonsters;
}

// 创建怪物
function createMonster(type, edge) {
    // 从指定边缘随机位置生成
    let x, y;
    
    switch (edge) {
        case 0: // 顶部
            x = Math.floor(Math.random() * BOARD_SIZE);
            y = -1;
            break;
        case 1: // 右侧
            x = BOARD_SIZE;
            y = Math.floor(Math.random() * BOARD_SIZE);
            break;
        case 2: // 底部
            x = Math.floor(Math.random() * BOARD_SIZE);
            y = BOARD_SIZE;
            break;
        case 3: // 左侧
            x = -1;
            y = Math.floor(Math.random() * BOARD_SIZE);
            break;
    }
    
    return {
        type: type,
        health: MONSTER_CONFIG[type].health,
        x: x,
        y: y,
        targetX: ALTAR_POSITION.x,
        targetY: ALTAR_POSITION.y,
        spawnEdge: edge // 记录出怪方向
    };
}

// 游戏主循环
function gameLoop() {
    if (!gameState.isWaveActive || gameState.gameOver) return;
    
    // 移动怪物
    moveMonsters();
    
    // 符文塔攻击
    runeTowersAttack();
    
    // 检查游戏状态
    checkGameState();
    
    // 更新怪物数量显示
    updateMonsterCount();
    
    // 更新棋盘
    updateBoard();
    
    // 继续循环
    if (gameState.isWaveActive && !gameState.gameOver) {
        setTimeout(gameLoop, 100);
    }
}

// 移动怪物
function moveMonsters() {
    if (gameState.gameOver) return;
    
    gameState.monsters.forEach((monster, index) => {
        // 计算移动方向 - 确保怪物只能走格子直线
        const targetX = monster.targetX;
        const targetY = monster.targetY;
        let moveX = 0, moveY = 0;
        
        // 优先沿X轴移动，直到到达目标列，然后沿Y轴移动
        if (Math.floor(monster.x) !== targetX) {
            moveX = targetX > Math.floor(monster.x) ? 1 : -1;
        } else {
            moveY = targetY > Math.floor(monster.y) ? 1 : -1;
        }
        
        // 获取怪物速度（值越大速度越慢）
        const speed = MONSTER_CONFIG[monster.type].speed;
        const moveSpeed = 0.1 * (1000 / speed); // 调整速度系数
        
        // 计算新位置
        const newX = monster.x + moveX * moveSpeed;
        const newY = monster.y + moveY * moveSpeed;
        
        // 检查新位置是否在棋盘内
        if (Math.floor(newX) >= 0 && Math.floor(newX) < BOARD_SIZE && Math.floor(newY) >= 0 && Math.floor(newY) < BOARD_SIZE) {
            // 检查新位置是否有符文
            const cellX = Math.floor(newX);
            const cellY = Math.floor(newY);
            const cellContent = gameState.board[cellY][cellX];
            
            if (cellContent && cellContent.type === 'rune') {
                // BOSS可以穿透1/2级墙
                if (monster.type === 'boss' && (cellContent.level === 1 || cellContent.level === 2)) {
                    // 穿透墙，继续移动
                    monster.x = newX;
                    monster.y = newY;
                } else {
                    // 攻击符文
                    attackRune(cellX, cellY, monster);
                }
            } else if (cellX === ALTAR_POSITION.x && cellY === ALTAR_POSITION.y) {
                // 攻击祭坛
                attackAltar(monster);
            } else {
                // 移动到新位置
                monster.x = newX;
                monster.y = newY;
            }
        } else {
            // 怪物在棋盘外，继续向祭坛移动
            monster.x += moveX * moveSpeed * 0.5;
            monster.y += moveY * moveSpeed * 0.5;
        }
    });
    
    // 处理死亡的怪物
    const deadMonsters = gameState.monsters.filter(monster => monster.health <= 0);
    deadMonsters.forEach(monster => {
        dropLoot(monster);
    });
    
    // 移除死亡的怪物
    gameState.monsters = gameState.monsters.filter(monster => monster.health > 0);
    
    // 检查波次是否结束
    if (gameState.monsters.length === 0 && !gameState.gameOver) {
        endWave();
    }
}

// 攻击符文
function attackRune(x, y, monster) {
    const rune = gameState.board[y][x];
    if (!rune) return;
    
    // 怪物攻击符文
    rune.health -= MONSTER_CONFIG[monster.type].damage;
    
    // 符文与怪物碰撞伤害（仅对墙有效）
    if (rune.level === 1 || rune.level === 2) {
        monster.health -= 1;
        
        // 检查怪物是否死亡
        if (monster.health <= 0) {
            dropLoot(monster);
        }
    }
    
    // 检查符文是否被摧毁
    if (rune.health <= 0) {
        gameState.board[y][x] = null;
        showMessage(`${RUNE_CONFIG[rune.level].name} 被摧毁！`);
    }
}

// 攻击祭坛
function attackAltar(monster) {
    const oldHealth = gameState.altarHealth;
    gameState.altarHealth -= MONSTER_CONFIG[monster.type].damage;
    updateGameInfo();
    
    // 添加祭坛血量变化的颜色效果
    if (gameState.altarHealth < oldHealth) {
        altarHealthDisplay.classList.add('health-decrease');
        setTimeout(() => {
            altarHealthDisplay.classList.remove('health-decrease');
        }, 1000);
    }
    
    // 检查祭坛是否被摧毁
    if (gameState.altarHealth <= 0) {
        // 立即设置游戏结束状态
        gameState.gameOver = true;
        gameState.gameWon = false;
        gameState.isWaveActive = false;
        
        // 播放灵枢死亡音效
        playSound('altar-death-sound');
        
        // 显示游戏失败消息
        showMessage('游戏失败！祭坛被怪物摧毁了...');
        alert('闯关失败');
        
        // 清空怪物数组，防止endWave被调用
        gameState.monsters = [];
        
        // 延迟重置游戏，确保所有游戏循环都已停止
        setTimeout(() => {
            restartGame();
        }, 500);
        
        return;
    }
    
    // 怪物攻击祭坛后死亡
    dropLoot(monster);
    monster.health = 0;
}

// 符文塔攻击
function runeTowersAttack() {
    const currentTime = Date.now();
    
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const cellContent = gameState.board[y][x];
            if (cellContent && cellContent.type === 'rune' && RUNE_CONFIG[cellContent.level].attack) {
                // 初始化上次攻击时间
                if (!cellContent.lastAttackTime) {
                    cellContent.lastAttackTime = 0;
                }
                
                // 检查攻击间隔
                const attackSpeed = RUNE_CONFIG[cellContent.level].attackSpeed;
                if (currentTime - cellContent.lastAttackTime >= attackSpeed) {
                    // 检查范围内的怪物
                    const range = RUNE_CONFIG[cellContent.level].range;
                    const damage = RUNE_CONFIG[cellContent.level].damage;
                    let attacked = false;
                    
                    gameState.monsters.forEach(monster => {
                        // 检查怪物是否完全进入棋盘
                        const monsterX = Math.floor(monster.x);
                        const monsterY = Math.floor(monster.y);
                        if (monsterX >= 0 && monsterX < BOARD_SIZE && monsterY >= 0 && monsterY < BOARD_SIZE) {
                            // 计算曼哈顿距离（只能攻击同一行或同一列的怪物）
                            const manhattanDistance = Math.abs(monsterX - x) + Math.abs(monsterY - y);
                            // 检查是否在同一行或同一列
                            const sameRow = monsterY === y;
                            const sameColumn = monsterX === x;
                            
                            if ((sameRow || sameColumn) && manhattanDistance <= range) {
                                // 攻击怪物
                                monster.health -= damage;
                                
                                // 创建伤害数字提示
                                createDamageText(monster.x, monster.y, damage);
                                
                                // 检查怪物是否死亡
                                if (monster.health <= 0) {
                                    dropLoot(monster);
                                }
                                
                                // BOSS被攻击时反击
                                if (monster.type === 'boss') {
                                    cellContent.health -= MONSTER_CONFIG.boss.damage;
                                    if (cellContent.health <= 0) {
                                        gameState.board[y][x] = null;
                                        showMessage(`${RUNE_CONFIG[cellContent.level].name} 被 BOSS 摧毁！`);
                                    }
                                }
                                
                                attacked = true;
                            }
                        }
                    });
                    
                    // 如果攻击了怪物，添加闪烁效果和子弹特效
                    if (attacked) {
                        // 播放子弹音效
                        playSound('bullet-sound');
                        
                        // 更新上次攻击时间
                        cellContent.lastAttackTime = currentTime;
                        
                        const cell = gameBoard.children[y * BOARD_SIZE + x];
                        const runeElement = cell.querySelector('.rune');
                        if (runeElement) {
                            // 闪烁效果
                            runeElement.classList.add('attacking');
                            setTimeout(() => {
                                runeElement.classList.remove('attacking');
                            }, 200);
                        }
                        
                        // 为每个被攻击的怪物创建子弹特效
                        gameState.monsters.forEach(monster => {
                            // 检查怪物是否完全进入棋盘
                            const monsterX = Math.floor(monster.x);
                            const monsterY = Math.floor(monster.y);
                            if (monsterX >= 0 && monsterX < BOARD_SIZE && monsterY >= 0 && monsterY < BOARD_SIZE) {
                                // 计算曼哈顿距离（只能攻击同一行或同一列的怪物）
                                const manhattanDistance = Math.abs(monsterX - x) + Math.abs(monsterY - y);
                                // 检查是否在同一行或同一列
                                const sameRow = monsterY === y;
                                const sameColumn = monsterX === x;
                                
                                if ((sameRow || sameColumn) && manhattanDistance <= range) {
                                    createBulletEffect(x, y, monster.x, monster.y);
                                }
                            }
                        });
                    }
                }
            }
        }
    }
}

// 掉落物品
function dropLoot(monster) {
    const dropConfig = MONSTER_CONFIG[monster.type].drop;
    const droppedItems = [];
    
    console.log(`处理${MONSTER_CONFIG[monster.type].name}的掉落`);
    
    for (const [level, chance] of Object.entries(dropConfig)) {
        const levelNum = parseInt(level);
        
        if (monster.type === 'boss') {
            // BOSS固定掉落
            gameState.runes[levelNum] = (gameState.runes[levelNum] || 0) + chance;
            droppedItems.push(`${RUNE_CONFIG[levelNum].name} ×${chance}`);
            console.log(`BOSS掉落${RUNE_CONFIG[levelNum].name} ×${chance}`);
        } else {
            // 普通怪物和精英怪概率掉落
            const roll = Math.random();
            console.log(`掉落概率检查：${RUNE_CONFIG[levelNum].name}，概率${chance}，掷骰结果${roll}`);
            if (roll <= chance) {
                gameState.runes[levelNum] = (gameState.runes[levelNum] || 0) + 1;
                droppedItems.push(`${RUNE_CONFIG[levelNum].name} ×1`);
                console.log(`成功掉落${RUNE_CONFIG[levelNum].name} ×1`);
            }
        }
    }
    
    // 显示掉落提示
    if (droppedItems.length > 0) {
        showMessage(`${MONSTER_CONFIG[monster.type].name} 掉落了：${droppedItems.join('、')}`);
        console.log(`显示掉落提示：${droppedItems.join('、')}`);
    } else {
        console.log(`${MONSTER_CONFIG[monster.type].name} 没有掉落任何物品`);
    }
    
    console.log(`当前符文数量：${JSON.stringify(gameState.runes)}`);
    updateRuneList();
}



// 结束波次
function endWave() {
    if (gameState.gameOver) return;
    
    gameState.isWaveActive = false;
    gameState.currentWave++;
    updateGameInfo();
    
    if (gameState.currentWave > TOTAL_WAVES) {
        // 游戏胜利
        gameOver(true);
    } else {
        showMessage(`第 ${gameState.currentWave - 1} 波怪物已被击败！1秒后开始下一波...`);
        // 1秒后自动开始下一波
        setTimeout(() => {
            if (!gameState.gameOver) {
                startNextWave();
            }
        }, 1000);
    }
}

// 检查游戏状态
function checkGameState() {
    if (gameState.altarHealth <= 0) {
        gameOver(false);
    }
}

// 游戏结束
function gameOver(won) {
    gameState.gameOver = true;
    gameState.gameWon = won;
    gameState.isWaveActive = false;
    startWaveButton.disabled = true;
    
    if (won) {
        showMessage('恭喜！你成功击败了所有怪物，获得了胜利！');
        alert('闯关成功');
    } else {
        showMessage('游戏失败！祭坛被怪物摧毁了...');
        alert('闯关失败');
        // 自动重置游戏
        restartGame();
    }
}

// 重启游戏
function restartGame() {
    // 重置游戏状态
    gameState = {
        board: Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null)),
        runes: { ...INITIAL_RUNES },
        altarHealth: INITIAL_ALTAR_HEALTH, // 灵枢血量
        currentWave: 1,
        isWaveActive: false,
        monsters: [],
        selectedRune: null,
        gameOver: false,
        gameWon: false
    };
    
    // 重置怪物数量
    totalMonsters = 0;
    
    // 重新初始化游戏
    generateBoard();
    updateRuneList();
    updateGameInfo();
    updateMonsterCount();
    
    // 显示开始游戏按钮
    startWaveButton.disabled = false;
    startWaveButton.style.display = 'inline-block';
    showMessage('游戏已重置，准备开始新的挑战！');
}

// 退出游戏
function exitGame() {
    if (confirm('确定要退出游戏吗？')) {
        window.close();
    }
}

// 更新棋盘
function updateBoard() {
    // 重置所有单元格
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const cell = gameBoard.children[y * BOARD_SIZE + x];
            cell.innerHTML = '';
            
            // 检查是否有符文
            const rune = gameState.board[y][x];
            if (rune && rune.type === 'rune') {
                const runeElement = document.createElement('div');
                runeElement.className = `rune level-${rune.level}`;
                // 将等级显示改为类型名称
                let runeType = '';
                switch (rune.level) {
                    case 1: runeType = '1墙'; break;
                    case 2: runeType = '2墙'; break;
                    case 3: runeType = '3塔'; break;
                    case 4: runeType = '4塔'; break;
                }
                runeElement.innerHTML = `${runeType}--${rune.health}`;
                cell.appendChild(runeElement);
            }
        }
    }
    
    // 绘制怪物（每个格子只显示一个怪物）
    const occupiedCells = new Set();
    gameState.monsters.forEach(monster => {
        // 只绘制棋盘内的怪物
        if (monster.x >= 0 && monster.x < BOARD_SIZE && monster.y >= 0 && monster.y < BOARD_SIZE) {
            const cellX = Math.floor(monster.x);
            const cellY = Math.floor(monster.y);
            const cellKey = `${cellX},${cellY}`;
            
            // 检查该格子是否已经有怪物
            if (!occupiedCells.has(cellKey)) {
                const cell = gameBoard.children[cellY * BOARD_SIZE + cellX];
                const monsterElement = document.createElement('div');
                monsterElement.className = `monster ${monster.type}`;
                monsterElement.innerHTML = `${monster.type === 'boss' ? 'BOSS' : monster.type}\n${monster.health}`;
                cell.appendChild(monsterElement);
                occupiedCells.add(cellKey);
            }
        }
    });
}

// 更新符文列表
function updateRuneList() {
    runeList.innerHTML = '';
    
    for (let level = 1; level <= 4; level++) {
        const runeItem = document.createElement('div');
        runeItem.className = 'rune-item';
        
        const runeElement = document.createElement('div');
        runeElement.className = `rune level-${level}`;
        runeElement.innerHTML = level;
        
        // 只有当符文数量大于0时才添加点击事件
        if (gameState.runes[level] > 0) {
            runeElement.addEventListener('click', () => {
                gameState.selectedRune = level;
                showMessage(`已选择 ${RUNE_CONFIG[level].name}，点击棋盘放置`);
            });
        } else {
            runeElement.style.opacity = '0.5';
            runeElement.style.cursor = 'not-allowed';
        }
        
        const nameElement = document.createElement('div');
        nameElement.className = 'rune-name';
        nameElement.innerHTML = RUNE_CONFIG[level].name;
        
        const countElement = document.createElement('div');
        countElement.className = 'count';
        countElement.innerHTML = `x${gameState.runes[level] || 0}`;
        
        runeItem.appendChild(runeElement);
        runeItem.appendChild(nameElement);
        runeItem.appendChild(countElement);
        
        // 当防御墙（1级）数量大于等于3时，高亮显示并添加合成按钮
        if (level === 1 && gameState.runes[level] >= 3) {
            runeElement.classList.add('highlight');
            
            const mergeButton = document.createElement('button');
            mergeButton.className = 'merge-button';
            mergeButton.innerHTML = '合成';
            mergeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                mergeRunes(1, 3);
            });
            runeItem.appendChild(mergeButton);
        }
        
        // 当高级防御墙（2级）数量大于等于3时，高亮显示并添加合成按钮
        if (level === 2 && gameState.runes[level] >= 3) {
            runeElement.classList.add('highlight');
            
            const mergeButton = document.createElement('button');
            mergeButton.className = 'merge-button';
            mergeButton.innerHTML = '合成';
            mergeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                mergeRunes(2, 4);
            });
            runeItem.appendChild(mergeButton);
        }
        runeList.appendChild(runeItem);
    }
}





// 更新游戏信息
function updateGameInfo() {
    waveDisplay.innerHTML = gameState.currentWave;
    altarHealthDisplay.innerHTML = gameState.altarHealth;
}

// 显示消息
function showMessage(message) {
    gameMessage.innerHTML = message;
    // 清除之前的计时器
    if (window.messageTimer) {
        clearTimeout(window.messageTimer);
    }
    // 设置计时器，3秒后清空消息
    window.messageTimer = setTimeout(() => {
        gameMessage.innerHTML = '';
    }, 3000);
}

// 合成符文
function mergeRunes(fromLevel, toLevel) {
    if (gameState.runes[fromLevel] >= 3) {
        // 消耗3个低级符文
        gameState.runes[fromLevel] -= 3;
        // 生成1个高级符文
        gameState.runes[toLevel] = (gameState.runes[toLevel] || 0) + 1;
        
        // 显示合成消息
        showMessage(`使用3个 ${RUNE_CONFIG[fromLevel].name} 合成了 1个 ${RUNE_CONFIG[toLevel].name}！`);
        
        // 更新符文列表
        updateRuneList();
    }
}

// 创建子弹特效
function createBulletEffect(startX, startY, endX, endY) {
    const bullet = document.createElement('div');
    bullet.className = 'bullet';
    
    // 设置子弹的初始位置
    const cellSize = gameBoard.clientWidth / BOARD_SIZE;
    const startPosX = startX * cellSize + cellSize / 2;
    const startPosY = startY * cellSize + cellSize / 2;
    
    // 设置子弹的目标位置
    const endPosX = endX * cellSize + cellSize / 2;
    const endPosY = endY * cellSize + cellSize / 2;
    
    // 设置子弹样式
    bullet.style.position = 'absolute';
    bullet.style.width = '8px';
    bullet.style.height = '8px';
    bullet.style.borderRadius = '50%';
    bullet.style.backgroundColor = '#ff6b6b';
    bullet.style.left = `${startPosX}px`;
    bullet.style.top = `${startPosY}px`;
    bullet.style.transform = 'translate(-50%, -50%)';
    bullet.style.pointerEvents = 'none';
    bullet.style.zIndex = '1000';
    
    // 添加到游戏棋盘
    gameBoard.appendChild(bullet);
    
    // 计算动画时间（基于距离）
    const distance = Math.sqrt(Math.pow(endPosX - startPosX, 2) + Math.pow(endPosY - startPosY, 2));
    const duration = distance / 200; // 速度调整
    
    // 设置动画
    bullet.style.transition = `all ${duration}s linear`;
    
    // 触发重排
    void bullet.offsetWidth;
    
    // 设置目标位置
    bullet.style.left = `${endPosX}px`;
    bullet.style.top = `${endPosY}px`;
    
    // 动画结束后移除子弹
    setTimeout(() => {
        gameBoard.removeChild(bullet);
    }, duration * 1000);
}

// 创建伤害数字提示
function createDamageText(x, y, damage) {
    const damageText = document.createElement('div');
    damageText.className = 'damage-text';
    damageText.innerHTML = `-${damage}`;
    
    // 设置伤害数字的位置
    const cellSize = gameBoard.clientWidth / BOARD_SIZE;
    const posX = x * cellSize + cellSize / 2;
    const posY = y * cellSize + cellSize / 2;
    
    // 设置伤害数字样式
    damageText.style.position = 'absolute';
    damageText.style.left = `${posX}px`;
    damageText.style.top = `${posY}px`;
    damageText.style.transform = 'translate(-50%, -50%)';
    damageText.style.fontSize = '16px';
    damageText.style.fontWeight = 'bold';
    damageText.style.color = '#ff6b6b';
    damageText.style.textShadow = '0 0 5px rgba(255, 107, 107, 0.8)';
    damageText.style.pointerEvents = 'none';
    damageText.style.zIndex = '1001';
    damageText.style.opacity = '1';
    
    // 添加到游戏棋盘
    gameBoard.appendChild(damageText);
    
    // 设置动画
    damageText.style.transition = 'all 0.8s ease-out';
    
    // 触发重排
    void damageText.offsetWidth;
    
    // 设置动画目标
    damageText.style.top = `${posY - 50}px`;
    damageText.style.opacity = '0';
    
    // 动画结束后移除伤害数字
    setTimeout(() => {
        gameBoard.removeChild(damageText);
    }, 800);
}

// 启动游戏
window.onload = initGame;
})();
// 游戏配置文件
// 可以手动调整以下数值

// 游戏常量
 const BOARD_SIZE = 7;
 const ALTAR_POSITION = { x: 3, y: 3 }; // 中央祭坛位置（0-based索引）
 const INITIAL_RUNES = { 1: 5, 2: 2, 3: 2, 4: 2 };
 const INITIAL_FRAGMENTS = { 1: 0, 2: 0, 3: 0, 4: 0 };
 const INITIAL_ALTAR_HEALTH = 3;
 const TOTAL_WAVES = 10;

// 符文配置
 const RUNE_CONFIG = {
    1: { name: '防御墙', health: 2, attack: false, range: 0, damage: 0, attackSpeed: 0 },
    2: { name: '高级防御墙', health: 4, attack: false, range: 0, damage: 0, attackSpeed: 0 },
    3: { name: '基础符文塔', health: 3, attack: true, range: 2, damage: 1, attackSpeed: 1000 },
    4: { name: '高级符文塔', health: 5, attack: true, range: 3, damage: 2, attackSpeed: 1000 }
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

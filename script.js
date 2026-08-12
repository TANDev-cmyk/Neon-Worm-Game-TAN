const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const loadingScreen = document.getElementById('loadingScreen');
const menu = document.getElementById('menu');
const hud = document.getElementById('hud');
const gameOverScreen = document.getElementById('gameOver');
const playBtn = document.getElementById('playBtn');
const restartBtn = document.getElementById('restartBtn');
const scoreEl = document.getElementById('score');
const finalScoreEl = document.getElementById('finalScore');
const leadersEl = document.getElementById('leaders');
const boostEl = document.getElementById('boost');
const skinBtn = document.getElementById('skinBtn');
const settingBtn = document.getElementById('settingBtn');
const skinModal = document.getElementById('skinModal');
const settingModal = document.getElementById('settingModal');
const closeSkinBtn = document.getElementById('closeSkinBtn');
const closeSettingBtn = document.getElementById('closeSettingBtn');
const MAP_WIDTH = 3000;
const MAP_HEIGHT = 3000;

const eatSound = new Audio('makan.wav');
eatSound.volume = 0.8;

let gameActive = false;
let score = 0;
let highscore = localStorage.getItem('neonWormHighscore') || 0;
let currentLevel = 1;
const levelEl = document.getElementById('level');

let mouse = { x: 0, y: 0 };
let worm = [];
let foods = [];
let bots = [];
let particles = [];
let wormLength = 40; 
const wormRadius = 12;
const TOTAL_BOTS = 15; 

let playerColor = '#00ffff';
let playerGlow = true;
let camera = { x: 0, y: 0 };
let isBoosting = false;
let boostEnergy = 100;

let magnetTimer = 0;
let shakeIntensity = 0;
window.onload = () => {
    if (loadingScreen) loadingScreen.style.display = 'none';
    resizeCanvas();
    const menuHighscoreEl = document.getElementById('menuHighscore');
    if (menuHighscoreEl) menuHighscoreEl.innerText = highscore;
};

window.addEventListener('resize', resizeCanvas);
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('mousedown', () => { if (gameActive && boostEnergy > 10) isBoosting = true; });
window.addEventListener('mouseup', () => { isBoosting = false; });
function startGame() {
    if (menu) menu.style.display = 'none';
    if (gameOverScreen) gameOverScreen.style.display = 'none';
    if (hud) hud.style.display = 'flex';
    
    score = 0;
    currentLevel = 1;
    if (scoreEl) scoreEl.innerText = score;
    if (levelEl) levelEl.innerText = currentLevel;
    
    wormLength = 40; 
    boostEnergy = 100;
    if (boostEl) boostEl.innerText = "100%";
    isBoosting = false;
    magnetTimer = 0;
    shakeIntensity = 0;
    particles = [];
    
    let startX = MAP_WIDTH / 2;
    let startY = MAP_HEIGHT / 2;
    
    worm = [];
    for (let i = 0; i < wormLength; i++) { worm.push({ x: startX, y: startY }); }
    foods = [];
    for (let i = 0; i < 300; i++) spawnFood(); 
    bots = [];
    for (let i = 0; i < TOTAL_BOTS; i++) { spawnBot(i); }
    
    updateLeaderboard();
    gameActive = true;
    animate();
}
function spawnFood() {
    let isMagnet = Math.random() < 0.05; 
    foods.push({
        x: Math.random() * MAP_WIDTH,
        y: Math.random() * MAP_HEIGHT,
        radius: isMagnet ? 6 : Math.random() * 4 + 3,
        color: isMagnet ? '#ffd700' : `hsl(${Math.random() * 360}, 100%, 60%)`,
        isSpecial: isMagnet
    });
}

function spawnBot(index) {
    const botNames = ['Neon_King', 'GlowWorm', 'CyberCacing', 'LightSpeed', 'Vector', 'Pixel_Worm', 'Blitz', 'Turbo', 'Helix', 'Alpha', 'Omega', 'Viper', 'Shadow', 'Sonic', 'Zenix'];
    let randomName = botNames[Math.floor(Math.random() * botNames.length)];
    let uniqueName = `${randomName}_${Math.floor(Math.random() * 90 + 10)}`;
    
    let bX = Math.random() * (MAP_WIDTH - 200) + 100;
    let bY = Math.random() * (MAP_HEIGHT - 200) + 100;
    let bLength = Math.floor(Math.random() * 20) + 25;
    let botWorm = [];
    for (let k = 0; k < bLength; k++) { botWorm.push({ x: bX, y: bY }); }
    
    bots[index] = {
        name: uniqueName, worm: botWorm, wormLength: bLength,
        score: (bLength - 25) * 5, angle: Math.random() * Math.PI * 2,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`, changeDirTimer: 0
    };
}
function dropFoodFromDeadWorm(wormSegments, color) {
    explodeWorm(wormSegments, color);
    wormSegments.forEach((part, index) => {
        if (index % 4 === 0) { 
            foods.push({ x: part.x + (Math.random() * 10 - 5), y: part.y + (Math.random() * 10 - 5), radius: 6, color: color, isSpecial: false });
        }
    });
}

function updateLeaderboard() {
    const nameEl = document.getElementById('playerName');
    const name = (nameEl && nameEl.value) ? nameEl.value : 'Player';
    let list = [{ name: name, score: score }];
    bots.forEach(b => list.push({ name: b.name, score: b.score }));
    list.sort((a, b) => b.score - a.score);
    if (leadersEl) {
        leadersEl.innerHTML = '';
        for (let i = 0; i < Math.min(4, list.length); i++) {
            leadersEl.innerHTML += `<li><strong>${list[i].name}</strong> - ${list[i].score}</li>`;
        }
    }
}

function getDist(x1, y1, x2, y2) { return Math.hypot(x1 - x2, y1 - y2); }

function checkLevelAndHighscore() {
    let newLevel = Math.floor(score / 500) + 1;
    if (newLevel !== currentLevel) {
        currentLevel = newLevel;
        if (levelEl) levelEl.innerText = currentLevel;
    }
}
function animate() {
    if (!gameActive) return;
    ctx.fillStyle = 'rgb(11, 11, 26)'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    let head = { x: worm[0].x, y: worm[0].y };
    let centerX = canvas.width / 2;
    let centerY = canvas.height / 2;
    let angle = Math.atan2(mouse.y - centerY, mouse.x - centerX);
    
    let speed = isBoosting && boostEnergy > 0 ? 6 : 3;
    if (isBoosting && boostEnergy > 0) {
        boostEnergy -= 0.3;
        if (boostEnergy <= 0) { boostEnergy = 0; isBoosting = false; }
    } else if (!isBoosting && boostEnergy < 100) { boostEnergy += 0.1; }
    if (boostEl) boostEl.innerText = Math.floor(boostEnergy) + "%";
    
    head.x += Math.cos(angle) * speed;
    head.y += Math.sin(angle) * speed;
    
    if (head.x < 0 || head.x > MAP_WIDTH || head.y < 0 || head.y > MAP_HEIGHT) { endGame(); return; }

    let lastHead = worm[0];
    let distToLast = Math.hypot(head.x - lastHead.x, head.y - lastHead.y);
    let steps = Math.floor(distToLast / 2); 
    
    if (steps > 0) {
        for (let s = 1; s <= steps; s++) {
            let t = s / steps;
            worm.unshift({
                x: lastHead.x + (head.x - lastHead.x) * t,
                y: lastHead.y + (head.y - lastHead.y) * t
            });
        }
    } else {
        worm.unshift(head);
    }
    while (worm.length > wormLength) { worm.pop(); }
    for (let bIndex = bots.length - 1; bIndex >= 0; bIndex--) {
        let bot = bots[bIndex];
        let bHead = { x: bot.worm[0].x, y: bot.worm[0].y };
        let targetAngle = bot.angle;
        let closestFood = null;
        let minDist = 300; 
        let botSpeed = 2.8; // Kecepatan dasar bot pro

        // 1. Prioritas AI: Cari makanan terdekat
        foods.forEach(food => {
            let d = Math.hypot(bHead.x - food.x, bHead.y - food.y);
            if (d < minDist) { minDist = d; closestFood = food; }
        });
        if (closestFood) { 
            targetAngle = Math.atan2(closestFood.y - bHead.y, closestFood.x - bHead.x); 
            if (minDist < 80 && bot.wormLength > 35) { botSpeed = 5; } // Auto-boost jika makanan dekat
        } else {
            bot.changeDirTimer++;
            if (bot.changeDirTimer > 80) { targetAngle = Math.random() * Math.PI * 2; bot.changeDirTimer = 0; }
        }
        
        // 2. Logika Defensif Pro: Sensor anti-tabrak & mengelak super responsif
        let dangerZone = 90;
        for (let j = 0; j < worm.length; j += 2) {
            if (Math.hypot(bHead.x - worm[j].x, bHead.y - worm[j].y) < dangerZone) {
                targetAngle = Math.atan2(bHead.y - worm[j].y, bHead.x - worm[j].x) + 1.2;
                botSpeed = 5.5; // Kebut/boost untuk kabur dari player
                break;
            }
        }
        for (let i = 0; i < bots.length; i++) {
            if (i === bIndex) continue;
            let otherBot = bots[i];
            for (let j = 0; j < otherBot.worm.length; j += 2) {
                if (Math.hypot(bHead.x - otherBot.worm[j].x, bHead.y - otherBot.worm[j].y) < dangerZone) {
                    targetAngle = Math.atan2(bHead.y - otherBot.worm[j].y, bHead.x - otherBot.worm[j].x) + 1.2;
                    botSpeed = 5.5; // Kebut/boost untuk menghindari bot lain
                    break;
                }
            }
        }

        // Terapkan sudut pergerakan baru secara halus
        let angleDiff = targetAngle - bot.angle;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        bot.angle += angleDiff * 0.25; // Belok lebih tajam dan cepat

        let newBHead = {
            x: bHead.x + Math.cos(bot.angle) * botSpeed,
            y: bHead.y + Math.sin(bot.angle) * botSpeed
        };

        if (newBHead.x < 100 || newBHead.x > MAP_WIDTH - 100 || newBHead.y < 100 || newBHead.y > MAP_HEIGHT - 100) {
            bot.angle = Math.atan2(MAP_HEIGHT/2 - bHead.y, MAP_WIDTH/2 - bHead.x);
        }

        // Jalur interpolasi agar badan bot pro ikut lentur meliuk
        let bLastHead = bot.worm[0];
        let bDist = Math.hypot(newBHead.x - bLastHead.x, newBHead.y - bLastHead.y);
        let bSteps = Math.floor(bDist / 2);
        if (bSteps > 0) {
            for (let s = 1; s <= bSteps; s++) {
                let t = s / bSteps;
                bot.worm.unshift({
                    x: bLastHead.x + (newBHead.x - bLastHead.x) * t,
                    y: bLastHead.y + (newBHead.y - bLastHead.y) * t
                });
            }
        } else {
            bot.worm.unshift(newBHead);
        }
        while (bot.worm.length > bot.wormLength) { bot.worm.pop(); }

        // Logika Tabrakan Kematian (Bot vs Player & Bot vs Bot)
        let botDied = false;
        for (let j = 4; j < worm.length; j++) {
            if (getDist(newBHead.x, newBHead.y, worm[j].x, worm[j].y) < wormRadius + 6) {
                score += 50; wormLength += 10; if (scoreEl) scoreEl.innerText = score;
                checkLevelAndHighscore(); dropFoodFromDeadWorm(bot.worm, bot.color); 
                spawnBot(bIndex); updateLeaderboard(); botDied = true; break;
            }
        }
        if (botDied) continue;

        for (let i = 0; i < bots.length; i++) {
            if (i === bIndex) continue;
            let otherBot = bots[i];
            for (let j = 4; j < otherBot.worm.length; j++) {
                if (getDist(newBHead.x, newBHead.y, otherBot.worm[j].x, otherBot.worm[j].y) < wormRadius + 6) {
                    dropFoodFromDeadWorm(bot.worm, bot.color); spawnBot(bIndex); 
                    updateLeaderboard(); botDied = true; break;
                }
            }
            if (botDied) break;
        }
        if (botDied) continue;
    }

    for (let i = 0; i < bots.length; i++) {
        let bot = bots[i];
        for (let j = 4; j < bot.worm.length; j++) {
            if (getDist(head.x, head.y, bot.worm[j].x, bot.worm[j].y) < wormRadius + 6) { endGame(); return; }
        }
    }

    camera.x = worm[0].x - canvas.width / 2;
    camera.y = worm[0].y - canvas.height / 2;
    if (shakeIntensity > 0) {
        camera.x += (Math.random() - 0.5) * shakeIntensity; camera.y += (Math.random() - 0.5) * shakeIntensity;
        shakeIntensity *= 0.9; if (shakeIntensity < 0.2) shakeIntensity = 0;
    }
    ctx.save(); ctx.translate(-camera.x, -camera.y);
    ctx.strokeStyle = '#ff0055'; ctx.lineWidth = 8;
    ctx.strokeRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    
    for (let index = foods.length - 1; index >= 0; index--) {
        let food = foods[index];
        if (magnetTimer > 0) {
            let distToPlayer = Math.hypot(worm[0].x - food.x, worm[0].y - food.y);
            if (distToPlayer < 200) {
                let angleToPlayer = Math.atan2(worm[0].y - food.y, worm[0].x - food.x);
                food.x += Math.cos(angleToPlayer) * 5; food.y += Math.sin(angleToPlayer) * 5;
            }
        }

        ctx.beginPath(); ctx.arc(food.x, food.y, food.radius, 0, Math.PI * 2);
        if (food.isSpecial) {
            ctx.fillStyle = Math.floor(Date.now() / 200) % 2 === 0 ? '#ffd700' : '#ffffff';
        } else { ctx.fillStyle = food.color; }
        ctx.fill();
        
        let dist = Math.hypot(worm[0].x - food.x, worm[0].y - food.y);
        if (dist < wormRadius + food.radius) {
            if (food.isSpecial) { magnetTimer = 400; }
            foods.splice(index, 1); try { eatSound.cloneNode(true).play(); } catch(e){}
            score += 10; wormLength += 3; if (scoreEl) scoreEl.innerText = score; 
            checkLevelAndHighscore(); updateLeaderboard(); spawnFood(); continue;
        }
        
        for (let b = 0; b < bots.length; b++) {
            let bot = bots[b];
            if (getDist(bot.worm[0].x, bot.worm[0].y, food.x, food.y) < wormRadius + food.radius) {
                foods.splice(index, 1); bot.score += 10; bot.wormLength += 2;
                updateLeaderboard(); spawnFood(); break;
            }
        }
    }
    if (magnetTimer > 0) magnetTimer--;

    bots.forEach(bot => {
        let baseColor = bot.color; 
        ctx.save(); ctx.beginPath(); ctx.moveTo(bot.worm[0].x, bot.worm[0].y);
        for (let i = 1; i < bot.worm.length; i++) { ctx.lineTo(bot.worm[i].x, bot.worm[i].y); }
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.lineWidth = wormRadius * 2; ctx.strokeStyle = baseColor; ctx.stroke();
        ctx.lineWidth = wormRadius * 0.6; ctx.strokeStyle = '#ffffff';
        ctx.shadowBlur = 15; ctx.shadowColor = baseColor; ctx.stroke();
        ctx.shadowBlur = 0; ctx.restore();

        ctx.save(); ctx.translate(bot.worm[0].x, bot.worm[0].y); ctx.rotate(bot.angle);
        let bEyeR = wormRadius + 1; ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(bEyeR * 0.35, -bEyeR * 0.35, bEyeR * 0.35, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(bEyeR * 0.35, bEyeR * 0.35, bEyeR * 0.35, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath(); ctx.arc(bEyeR * 0.45, -bEyeR * 0.35, bEyeR * 0.18, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(bEyeR * 0.45, bEyeR * 0.35, bEyeR * 0.18, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    });

    ctx.save(); ctx.beginPath(); ctx.moveTo(worm[0].x, worm[0].y);
    for (let i = 1; i < worm.length; i++) { ctx.lineTo(worm[i].x, worm[i].y); }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = wormRadius * 2; ctx.strokeStyle = playerColor; ctx.stroke();
    ctx.lineWidth = wormRadius * 0.6; ctx.strokeStyle = '#ffffff';
    if (playerGlow) { ctx.shadowBlur = 15; ctx.shadowColor = playerColor; }
    ctx.stroke(); ctx.shadowBlur = 0; ctx.restore();

    ctx.save(); ctx.translate(worm[0].x, worm[0].y); ctx.rotate(angle);
    let pEyeR = wormRadius + 1; ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(pEyeR * 0.35, -pEyeR * 0.35, pEyeR * 0.35, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(pEyeR * 0.35, pEyeR * 0.35, pEyeR * 0.35, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath(); ctx.arc(pEyeR * 0.45, -pEyeR * 0.35, pEyeR * 0.18, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(pEyeR * 0.45, pEyeR * 0.35, pEyeR * 0.18, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i]; p.x += p.vx; p.y += p.vy; p.alpha -= p.decay;
        if (p.alpha <= 0) { particles.splice(i, 1); continue; }
        ctx.save(); ctx.globalAlpha = p.alpha; ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fillStyle = p.color; ctx.fill(); ctx.restore();
    }
    ctx.restore();

    if (magnetTimer > 0) {
        ctx.fillStyle = '#ffd700'; ctx.font = 'bold 20px sans-serif';
        ctx.fillText("🧲 MAGNET: " + Math.ceil(magnetTimer / 60) + "s", 30, 160);
    }

    const miniMapSize = 120; 
    const miniMapX = canvas.width - miniMapSize - 25; 
    const miniMapY = canvas.height - miniMapSize - 25; 
    ctx.fillStyle = 'rgba(20, 20, 45, 0.7)'; ctx.fillRect(miniMapX, miniMapY, miniMapSize, miniMapSize);
    ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 2; ctx.strokeRect(miniMapX, miniMapY, miniMapSize, miniMapSize);
    
    const nameEl = document.getElementById('playerName');
    const pName = (nameEl && nameEl.value) ? nameEl.value : 'Player';
    let rankList = [{ name: pName, isPlayer: true, x: worm[0].x, y: worm[0].y, score: score }];
    bots.forEach(bot => { rankList.push({ name: bot.name, isPlayer: false, botObj: bot, score: bot.score }); });
    rankList.sort((a, b) => b.score - a.score);

    rankList.forEach((char, rankIndex) => {
        let charX = char.isPlayer ? worm[0].x : char.botObj.worm[0].x;
        let charY = char.isPlayer ? worm[0].y : char.botObj.worm[0].y;
        let miniX = miniMapX + (charX / MAP_WIDTH) * miniMapSize;
        let miniY = miniMapY + (charY / MAP_HEIGHT) * miniMapSize;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

        if (rankIndex === 0) { ctx.font = '14px Arial'; ctx.fillText('🥇', miniX, miniY); } 
        else if (rankIndex === 1) { ctx.font = '13px Arial'; ctx.fillText('🥈', miniX, miniY); } 
        else if (rankIndex === 2) { ctx.font = '12px Arial'; ctx.fillText('🥉', miniX, miniY); } 
        else if (rankIndex === 3) { ctx.font = '12px Arial'; ctx.fillText('🎖️', miniX, miniY); } 
        else if (rankIndex === 4) { ctx.font = '12px Arial'; ctx.fillText('🏅', miniX, miniY); } 
        else {
            ctx.beginPath(); ctx.arc(miniX, miniY, 2, 0, Math.PI * 2);
            ctx.fillStyle = char.isPlayer ? '#ff00ff' : '#ffffff'; ctx.fill();
        }
    });
    requestAnimationFrame(animate);
}

function explodeWorm(wormSegments, color) {
    if (wormSegments.length > 35) { shakeIntensity = 15; }
    wormSegments.forEach((part, index) => {
        if (index % 3 === 0) {
            for (let i = 0; i < 2; i++) {
                particles.push({
                    x: part.x, y: part.y,
                    vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
                    radius: Math.random() * 2 + 2, color: color, alpha: 1,
                    decay: Math.random() * 0.03 + 0.02
                });
            }
        }
    });
}

if(skinBtn) skinBtn.addEventListener('click', () => { skinModal.style.display = 'flex'; });
if(settingBtn) settingBtn.addEventListener('click', () => { settingModal.style.display = 'flex'; });
if(closeSkinBtn) closeSkinBtn.addEventListener('click', () => { skinModal.style.display = 'none'; });
if(closeSettingBtn) {
    closeSettingBtn.addEventListener('click', () => {
        settingModal.style.display = 'none';
        playerGlow = (document.getElementById('graphicQuality').value === 'high'); 
    });
}
document.querySelectorAll('.skin-opt').forEach(optButton => {
    optButton.addEventListener('click', (event) => {
        playerColor = event.target.getAttribute('data-color'); skinModal.style.display = 'none'; 
    });
});

if(playBtn) playBtn.addEventListener('click', startGame);
if(restartBtn) restartBtn.addEventListener('click', startGame);

function endGame() {
    gameActive = false;
    explodeWorm(worm, playerColor);
    if (hud) hud.style.display = 'none';
    if (finalScoreEl) finalScoreEl.innerText = `Score : ${score}`;
    if (gameOverScreen) gameOverScreen.style.display = 'flex';
    
    if (score > highscore) {
        highscore = score;
        localStorage.setItem('neonWormHighscore', highscore);
    }
    const finalHighscoreEl = document.getElementById('finalHighscore');
    if (finalHighscoreEl) finalHighscoreEl.innerText = highscore;
}

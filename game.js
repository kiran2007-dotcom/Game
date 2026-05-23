// Frame Context Engine Architecture Pointers
let scene, camera, renderer;
let gameState = "START"; 
let player;
let obstacles = [];
let trackPieces = [];
let coins = [];

// Game Tuning Configurations & Metrics
let speed = 0.6;
let maxSpeed = 2.4;
let distance = 0;
let coinsCount = 0;
let isHellTheme = false;
const keys = {};

// Active Selected Drone Configuration Mapping
let activeDroneType = "vanguard";
const droneSpecs = {
    vanguard: { color: 0xffaa00, emissive: 0xff5500, lateral: 0.30, size: 0.5 },
    phantom: { color: 0xbd00ff, emissive: 0x7700aa, lateral: 0.38, size: 0.4 },
    spectre: { color: 0x00f3ff, emissive: 0x0088cc, lateral: 0.24, size: 0.6 }
};

// Procedural HTML5 Synthesizer Core Context Audio Drivers
let audioCtx, engineOscillator, engineGainNode;
let sfxVolume = 0.7;
let bgmVolume = 0.5;
let ambientSynthInterval;

// UI Viewport Document Accessors
const startScreen = document.getElementById('start-screen');
const pauseScreen = document.getElementById('pause-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const hud = document.getElementById('hud');
const speedUi = document.getElementById('speed-ui');
const distanceUi = document.getElementById('distance-ui');
const coinsUi = document.getElementById('coins-ui');

// Pre-cached Obstacle Textures
let regularObstacleMaterial, hellObstacleMaterial;

/**
 * Initializes the full WebGL pipeline and environmental configurations.
 */
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa3e5ff); 
    scene.fog = new THREE.FogExp2(0xa3e5ff, 0.008); 

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 7, 14); 

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    const container = document.getElementById('3d-container');
    container.innerHTML = ""; 
    container.appendChild(renderer.domElement);

    // Main Lighting Nodes Configuration
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.name = "sunlight";
    sunLight.position.set(5, 20, 10);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x7cdaff, 0.6); 
    ambientLight.name = "ambientlight";
    scene.add(ambientLight);

    // Generate Custom "KM" branded Material Textures
    generateBrandedTextures();

    // Instance structural track runways
    for(let i = 0; i < 6; i++) {
        createTrackSection(i * -40);
    }

    setupMenuInteractions();
    
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('keydown', handleGlobalKeydown);
}

/**
 * Generates custom dynamic canvas textures to wrap "KM" around the walls
 */
function generateBrandedTextures() {
    // 1. Regular Mode Branded Material (Cyan Glow text)
    const canvasReg = document.createElement('canvas');
    canvasReg.width = 256; canvasReg.height = 256;
    const ctxReg = canvasReg.getContext('2d');
    ctxReg.fillStyle = '#111122'; ctxReg.fillRect(0, 0, 256, 256);
    ctxReg.strokeStyle = '#00f3ff'; ctxReg.lineWidth = 8; ctxReg.strokeRect(4, 4, 248, 248);
    ctxReg.fillStyle = '#00f3ff'; ctxReg.font = 'bold 110px monospace';
    ctxReg.textAlign = 'center'; ctxReg.textBaseline = 'middle';
    ctxReg.fillText('KM', 128, 128);
    
    const texReg = new THREE.CanvasTexture(canvasReg);
    regularObstacleMaterial = new THREE.MeshStandardMaterial({
        map: texReg, emissive: 0x00f3ff, emissiveIntensity: 0.3, roughness: 0.2
    });

    // 2. Hell Mode Branded Material (Fiery Orange/Red text)
    const canvasHell = document.createElement('canvas');
    canvasHell.width = 256; canvasHell.height = 256;
    const ctxHell = canvasHell.getContext('2d');
    ctxHell.fillStyle = '#110505'; ctxHell.fillRect(0, 0, 256, 256);
    ctxHell.strokeStyle = '#ff3300'; ctxHell.lineWidth = 8; ctxHell.strokeRect(4, 4, 248, 248);
    ctxHell.fillStyle = '#ff3300'; ctxHell.font = 'bold 110px monospace';
    ctxHell.textAlign = 'center'; ctxHell.textBaseline = 'middle';
    ctxHell.fillText('KM', 128, 128);
    
    const texHell = new THREE.CanvasTexture(canvasHell);
    hellObstacleMaterial = new THREE.MeshStandardMaterial({
        map: texHell, emissive: 0xff3300, emissiveIntensity: 0.4, roughness: 0.2
    });
}

function createTrackSection(zOffset) {
    const group = new THREE.Group();
    const roadGeo = new THREE.PlaneGeometry(18, 40);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x004411, roughness: 0.4 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    group.add(road);

    const grid = new THREE.GridHelper(40, 10, 0x00ff66, 0x00aa44); 
    grid.rotation.x = Math.PI / 2; grid.position.set(0, 0.02, 0); 
    road.add(grid);

    const railGeo = new THREE.BoxGeometry(0.5, 1.2, 40);
    const railMat = new THREE.MeshStandardMaterial({ color: 0xff0066, emissive: 0xff0066, emissiveIntensity: 0.6 });
    
    const leftRail = new THREE.Mesh(railGeo, railMat); leftRail.position.set(-9, 0.6, 0); group.add(leftRail);
    const rightRail = new THREE.Mesh(railGeo, railMat); rightRail.position.set(9, 0.6, 0); group.add(rightRail);

    group.position.z = zOffset;
    scene.add(group);
    trackPieces.push(group);
}

function assembleSelectedDrone() {
    if (player) scene.remove(player);
    const spec = droneSpecs[activeDroneType];
    const droneGroup = new THREE.Group();
    
    const hullGeo = new THREE.ConeGeometry(spec.size, 2.2, 5); hullGeo.rotateX(Math.PI / 2); 
    const hullMat = new THREE.MeshStandardMaterial({ 
        color: spec.color, emissive: spec.emissive, emissiveIntensity: 0.4, roughness: 0.1, metalness: 0.9 
    });
    const hull = new THREE.Mesh(hullGeo, hullMat); droneGroup.add(hull);

    const wingGeo = new THREE.BoxGeometry(2.2, 0.08, 0.5);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x1b1b22, roughness: 0.6 });
    const wings = new THREE.Mesh(wingGeo, wingMat); wings.position.set(0, -0.05, 0.1);
    droneGroup.add(wings);

    player = droneGroup; player.position.set(0, 0.8, 0); scene.add(player);
    const underglow = new THREE.PointLight(spec.color, 3, 8); underglow.position.set(0, -0.5, 0); player.add(underglow);
}

function spawnObstacle(zPos) {
    const lanes = [-5, 0, 5]; 
    const chosenLane = lanes[Math.floor(Math.random() * lanes.length)];
    const obsGeo = new THREE.BoxGeometry(4.5, 4, 2);
    
    // Assigns the custom branded structural textures directly to the obstacle mesh
    const obstacle = new THREE.Mesh(obsGeo, isHellTheme ? hellObstacleMaterial : regularObstacleMaterial);
    obstacle.position.set(chosenLane, 2, zPos);
    
    scene.add(obstacle);
    obstacles.push(obstacle);

    if (Math.random() > 0.3) {
        const coinLane = lanes[Math.floor(Math.random() * lanes.length)];
        spawnCoin(coinLane, zPos + (Math.random() * 15 + 10));
    }
}

function spawnCoin(xPos, zPos) {
    const coinGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.15, 16); coinGeo.rotateX(Math.PI / 2);
    const coinMat = new THREE.MeshStandardMaterial({ 
        color: 0xffcc00, emissive: 0xffaa00, emissiveIntensity: 0.6, metalness: 1.0, roughness: 0.1
    });
    const coinMesh = new THREE.Mesh(coinGeo, coinMat); coinMesh.position.set(xPos, 1.2, zPos);
    scene.add(coinMesh); coins.push(coinMesh);
}

function playAudioTone(freq, type, duration, volume) {
    if (!audioCtx) return;
    try {
        const osc = audioCtx.createOscillator(); const gainNode = audioCtx.createGain();
        osc.type = type; osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(volume * sfxVolume, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
        osc.connect(gainNode); gainNode.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + duration);
    } catch(e) { console.warn("Audio node drop."); }
}

function startProceduralEngineAudio() {
    if (audioCtx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
    
    engineOscillator = audioCtx.createOscillator(); engineGainNode = audioCtx.createGain();
    engineOscillator.type = "sawtooth"; engineOscillator.frequency.setValueAtTime(65, audioCtx.currentTime);
    engineGainNode.gain.setValueAtTime(0.08 * sfxVolume, audioCtx.currentTime);
    
    const filter = audioCtx.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.setValueAtTime(140, audioCtx.currentTime);
    engineOscillator.connect(filter); filter.connect(engineGainNode); engineGainNode.connect(audioCtx.destination);
    engineOscillator.start();

    ambientSynthInterval = setInterval(() => {
        if(gameState === "PLAYING" && !isHellTheme) {
            const notes = [110, 130, 146, 165];
            playAudioTone(notes[Math.floor(Math.random() * notes.length)], "triangle", 0.8, 0.2 * bgmVolume);
        } else if (gameState === "PLAYING" && isHellTheme) {
            const notes = [73, 82, 87, 98];
            playAudioTone(notes[Math.floor(Math.random() * notes.length)], "sawtooth", 0.6, 0.15 * bgmVolume);
        }
    }, 600);
}

function modulateEngineSound() {
    if (!engineOscillator) return;
    const baseFreq = 65 + (speed * 90);
    engineOscillator.frequency.setTargetAtTime(baseFreq, audioCtx.currentTime, 0.1);
    engineGainNode.gain.setTargetAtTime(gameState === "PLAYING" ? 0.08 * sfxVolume : 0.0, audioCtx.currentTime, 0.1);
}

function handleGlobalKeydown(e) {
    if (e.key === "Escape") togglePauseState();
    keys[e.key.toLowerCase()] = true;
}
window.onkeyup = (e) => { keys[e.key.toLowerCase()] = false; };

function togglePauseState() {
    if (gameState !== "PLAYING" && gameState !== "PAUSED") return;
    if (gameState === "PLAYING") {
        gameState = "PAUSED"; pauseScreen.classList.remove('hidden');
    } else {
        gameState = "PLAYING"; pauseScreen.classList.add('hidden');
    }
    playAudioTone(300, "sine", 0.15, 0.2);
}

function startRun() {
    startProceduralEngineAudio();
    if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

    speed = 0.6; distance = 0; coinsCount = 0; isHellTheme = false;
    coinsUi.innerText = "0";
    
    scene.background = new THREE.Color(0xa3e5ff); scene.fog.color = new THREE.Color(0xa3e5ff); scene.fog.density = 0.008;
    const sun = scene.getObjectByName("sunlight"); if(sun) sun.color.setHex(0xffffff);
    const ambient = scene.getObjectByName("ambientlight"); if(ambient) ambient.color.setHex(0x7cdaff);

    trackPieces.forEach((track, index) => {
        track.position.z = index * -40;
        const roadMesh = track.children[0]; roadMesh.material.color.setHex(0x004411);
        const gridMesh = roadMesh.children[0]; scene.remove(gridMesh);
        const freshGrid = new THREE.GridHelper(40, 10, 0x00ff66, 0x00aa44);
        freshGrid.rotation.x = Math.PI / 2; freshGrid.position.set(0, 0.02, 0); roadMesh.add(freshGrid);
    });

    obstacles.forEach(obs => scene.remove(obs)); coins.forEach(c => scene.remove(c));
    obstacles = []; coins = [];

    assembleSelectedDrone();
    spawnObstacle(-60); spawnObstacle(-110); spawnObstacle(-160);

    startScreen.classList.add('hidden'); gameOverScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden'); hud.classList.remove('hidden');
    
    playAudioTone(523.25, "sine", 0.3, 0.4); 
    gameState = "PLAYING";
}

function triggerHellOverdriveTransformation() {
    isHellTheme = true;
    scene.background = new THREE.Color(0x1a0505); scene.fog.color = new THREE.Color(0x1a0505); scene.fog.density = 0.015;
    const sun = scene.getObjectByName("sunlight"); if(sun) sun.color.setHex(0xff2200);
    const ambient = scene.getObjectByName("ambientlight"); if(ambient) ambient.color.setHex(0x3a0000);

    trackPieces.forEach(track => {
        const roadMesh = track.children[0]; roadMesh.material.color.setHex(0x110505);
        const oldGrid = roadMesh.children[0]; roadMesh.remove(oldGrid);
        const lavaGrid = new THREE.GridHelper(40, 10, 0xff3300, 0x551100);
        lavaGrid.rotation.x = Math.PI / 2; lavaGrid.position.set(0, 0.02, 0); roadMesh.add(lavaGrid);
    });

    playAudioTone(90, "sawtooth", 0.6, 0.5);
}

function update() {
    modulateEngineSound();
    if (gameState !== "PLAYING") return;
    const spec = droneSpecs[activeDroneType];

    if ((keys['a'] || keys['arrowleft']) && player.position.x > -6.5) player.position.x -= spec.lateral;
    if ((keys['d'] || keys['arrowright']) && player.position.x < 6.5) player.position.x += spec.lateral;

    if (keys['a'] || keys['arrowleft']) player.rotation.z = 0.35;
    else if (keys['d'] || keys['arrowright']) player.rotation.z = -0.35;
    else player.rotation.z *= 0.75; 

    if (speed < maxSpeed) speed += 0.00015;
    distance += 1;

    const computedVelocityKMH = Math.floor(speed * 180);
    speedUi.innerText = computedVelocityKMH; distanceUi.innerText = distance;

    if (computedVelocityKMH >= 200 && !isHellTheme) triggerHellOverdriveTransformation();

    trackPieces.forEach(track => {
        track.position.z += speed;
        if (track.position.z > 40) track.position.z = -200;
    });

    coins.forEach((coin, index) => {
        coin.position.z += speed; coin.rotation.y += 0.05;
        if (player.position.distanceTo(coin.position) < 1.2) {
            scene.remove(coin); coins.splice(index, 1);
            coinsCount += 1; coinsUi.innerText = coinsCount;
            playAudioTone(880, "sine", 0.1, 0.3);
        }
        if (coin.position.z > 20) { scene.remove(coin); coins.splice(index, 1); }
    });

    obstacles.forEach((obs, index) => {
        obs.position.z += speed;
        const pBox = new THREE.Box3().setFromObject(player);
        const oBox = new THREE.Box3().setFromObject(obs);

        if (pBox.intersectsBox(oBox)) {
            gameState = "GAMEOVER";
            playAudioTone(120, "sawtooth", 0.8, 0.6);
            setTimeout(() => playAudioTone(60, "sawtooth", 0.5, 0.4), 150);
            hud.classList.add('hidden'); gameOverScreen.classList.remove('hidden');
        }

        if (obs.position.z > 20) {
            scene.remove(obs); obstacles.splice(index, 1); spawnObstacle(-180);
        }
    });

    const targetCameraX = player.position.x;
    camera.position.x += (targetCameraX - camera.position.x) * 0.1;
    camera.position.y = 7; camera.position.z = 14; 
    camera.lookAt(new THREE.Vector3(player.position.x, player.position.y + 0.5, player.position.z - 8));
}

function setupMenuInteractions() {
    const options = document.querySelectorAll('.drone-option');
    options.forEach(opt => {
        opt.onclick = (e) => {
            options.forEach(o => o.classList.remove('active'));
            e.currentTarget.classList.add('active');
            activeDroneType = e.currentTarget.getAttribute('data-drone');
            playAudioTone(440, "sine", 0.08, 0.2);
        };
    });
    document.getElementById('sfx-vol').oninput = (e) => { sfxVolume = parseFloat(e.target.value); };
    document.getElementById('bgm-vol').oninput = (e) => { bgmVolume = parseFloat(e.target.value); };
    document.getElementById('start-btn').onclick = startRun;
    document.getElementById('restart-btn').onclick = startRun;
    document.getElementById('pause-btn').onclick = togglePauseState;
    document.getElementById('resume-btn').onclick = togglePauseState;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate); update(); renderer.render(scene, camera);
}

init();
animate();
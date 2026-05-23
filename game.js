// Frame Context Engine Architecture Pointers
let scene, camera, renderer;
let gameState = "START"; 
let player;
let obstacles = [];
let trackPieces = [];
let coins = [];

// HIGH-PERFORMANCE INSTANCING ENGINE FOR TREES
let treeInstanceMesh;
const MAX_TREES = 160; // Dense pool capacity
let treePositions = []; // Local tracking array for positions: [{x, y, z, speedModifier}]

// Game Tuning Configurations & Metrics
let speed = 0.6;
let maxSpeed = 2.4;
let distance = 0;
let coinsCount = 0;
let currentTier = 0; 
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

// Pre-cached Branded Obstacle Material Tiers
let obstacleMaterials = {};

// Reusable math allocation shells to stop garbage collection lag spikes
const _playerBox = new THREE.Box3();
const _obstacleBox = new THREE.Box3();
const _dummyMatrix = new THREE.Object3D();

/**
 * Initializes the full WebGL pipeline and environmental configurations.
 */
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa3e5ff); 
    scene.fog = new THREE.FogExp2(0xa3e5ff, 0.008); 

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 7, 14); 

    renderer = new THREE.WebGLRenderer({ 
        antialias: false, // Turned off MSAA for massive mobile/low-end GPU performance lift
        powerPreference: "high-performance",
        precision: "mediump"
    });
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

    // Generate Branded Textures with the game name "RUN"
    generateBrandedTextures();

    // Instance structural track runways
    for(let i = 0; i < 6; i++) {
        createTrackSection(i * -40);
    }

    // Initialize Batch-Instanced Deep Forest System
    buildInstancedForest();

    setupMenuInteractions();
    
    window.innerWidth < 768 ? renderer.setPixelRatio(1) : renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('keydown', handleGlobalKeydown);
}

/**
 * Merges entire forest layout parameters into a single GPU Instanced Drawing Batch
 */
function buildInstancedForest() {
    // Generate a single optimized low-poly tree base geometry structure
    const baseTreeGeometry = new THREE.CylinderGeometry(0, 2.5, 7.0, 4);
    baseTreeGeometry.translate(0, 3.5, 0); // Offset origin to bottom plate
    const singleForestMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff44, roughness: 0.8, metalness: 0.1 });

    treeInstanceMesh = new THREE.InstancedMesh(baseTreeGeometry, singleForestMaterial, MAX_TREES);
    treeInstanceMesh.name = "instancedForest";
    
    let count = 0;
    // Populate layout data loops
    for(let z = 0; z > -240; z -= 6) {
        if(count >= MAX_TREES - 4) break;

        // Left rows
        treePositions.push({ x: -11 - Math.random() * 4, z: z, side: 'left' });
        treePositions.push({ x: -18 - Math.random() * 12, z: z + 2, side: 'left' });

        // Right rows
        treePositions.push({ x: 11 + Math.random() * 4, z: z, side: 'right' });
        treePositions.push({ x: 18 + Math.random() * 12, z: z + 2, side: 'right' });
        
        count += 4;
    }

    // Compile and push initial batch matrices to GPU memory slots
    updateInstancedMeshTransforms();
    scene.add(treeInstanceMesh);
}

/**
 * Loops through local coordinates to flash the updated single-batch GPU instancing buffer
 */
function updateInstancedMeshTransforms() {
    for (let i = 0; i < treePositions.length; i++) {
        const data = treePositions[i];
        _dummyMatrix.position.set(data.x, 0, data.z);
        _dummyMatrix.updateMatrix();
        treeInstanceMesh.setMatrixAt(i, _dummyMatrix.matrix);
    }
    treeInstanceMesh.instanceMatrix.needsUpdate = true;
}

function generateBrandedTextures() {
    const configurations = [
        { id: 'tier0', bg: '#111122', text: '#00f3ff', glow: 0x00f3ff }, 
        { id: 'tier1', bg: '#110505', text: '#ff3300', glow: 0xff3300 }, 
        { id: 'tier2', bg: '#0b0214', text: '#00ffaa', glow: 0x00ffaa }, 
        { id: 'tier3', bg: '#000000', text: '#ffaa00', glow: 0xffaa00 }  
    ];

    configurations.forEach(cfg => {
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128; // Reduced resolution from 256 for lower texture memory overhead
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = cfg.bg; ctx.fillRect(0, 0, 128, 128);
        ctx.strokeStyle = cfg.text; ctx.lineWidth = 6; ctx.strokeRect(3, 3, 122, 122);
        ctx.fillStyle = cfg.text; ctx.font = 'bold 50px monospace'; 
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('RUN', 64, 64); 
        
        const texture = new THREE.CanvasTexture(canvas);
        obstacleMaterials[cfg.id] = new THREE.MeshStandardMaterial({
            map: texture, emissive: cfg.glow, emissiveIntensity: 0.3, roughness: 0.4
        });
    });
}

function createTrackSection(zOffset) {
    const group = new THREE.Group();
    const roadGeo = new THREE.PlaneGeometry(18, 40);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x004411, roughness: 0.5 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    group.add(road);

    const grid = new THREE.GridHelper(40, 10, 0x00ff66, 0x00aa44); 
    grid.rotation.x = Math.PI / 2; grid.position.set(0, 0.02, 0); 
    road.add(grid);

    const railGeo = new THREE.BoxGeometry(0.5, 1.2, 40);
    const railMat = new THREE.MeshStandardMaterial({ color: 0xff0066, emissive: 0xff0066, emissiveIntensity: 0.5 });
    
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
    
    const hullGeo = new THREE.ConeGeometry(spec.size, 2.2, 4); hullGeo.rotateX(Math.PI / 2); 
    const hullMat = new THREE.MeshStandardMaterial({ 
        color: spec.color, emissive: spec.emissive, emissiveIntensity: 0.4, roughness: 0.2, metalness: 0.8 
    });
    const hull = new THREE.Mesh(hullGeo, hullMat); droneGroup.add(hull);

    const wingGeo = new THREE.BoxGeometry(2.2, 0.08, 0.5);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x1b1b22, roughness: 0.6 });
    const wings = new THREE.Mesh(wingGeo, wingMat); wings.position.set(0, -0.05, 0.1);
    droneGroup.add(wings);

    player = droneGroup; player.position.set(0, 0.8, 0); scene.add(player);
    const underglow = new THREE.PointLight(spec.color, 2, 6); underglow.position.set(0, -0.5, 0); player.add(underglow);
}

function spawnObstacle(zPos) {
    const lanes = [-5, 0, 5]; 
    const chosenLane = lanes[Math.floor(Math.random() * lanes.length)];
    const activeMat = obstacleMaterials['tier' + currentTier];
    
    const types = ["STATIC", "SPINNING", "JUMPING", "MOVING"];
    const selectedType = types[Math.floor(Math.random() * types.length)];
    
    let obstacleMesh;
    
    if (selectedType === "SPINNING") {
        const obsGeo = new THREE.BoxGeometry(9.0, 1.2, 1.2);
        obstacleMesh = new THREE.Mesh(obsGeo, activeMat);
        obstacleMesh.position.set(0, 1.2, zPos); 
    } else if (selectedType === "JUMPING") {
        const obsGeo = new THREE.BoxGeometry(3.2, 3.2, 3.2);
        obstacleMesh = new THREE.Mesh(obsGeo, activeMat);
        obstacleMesh.position.set(chosenLane, 1.6, zPos);
    } else if (selectedType === "MOVING") {
        const obsGeo = new THREE.BoxGeometry(3.8, 2.6, 2.0);
        obstacleMesh = new THREE.Mesh(obsGeo, activeMat);
        obstacleMesh.position.set(chosenLane, 1.3, zPos);
    } else {
        const obsGeo = new THREE.BoxGeometry(4.2, 3.6, 2.0);
        obstacleMesh = new THREE.Mesh(obsGeo, activeMat);
        obstacleMesh.position.set(chosenLane, 1.8, zPos);
    }

    obstacleMesh.userData = {
        type: selectedType,
        baseX: obstacleMesh.position.x,
        baseY: obstacleMesh.position.y,
        timeOffset: Math.random() * Math.PI * 2
    };
    
    scene.add(obstacleMesh);
    obstacles.push(obstacleMesh);

    if (Math.random() > 0.2) {
        let coinLane = lanes[Math.floor(Math.random() * lanes.length)];
        while(selectedType !== "SPINNING" && coinLane === chosenLane) { 
            coinLane = lanes[Math.floor(Math.random() * lanes.length)];
        }
        spawnCoinSeries(coinLane, zPos + 10);
    }
}

function spawnCoinSeries(laneX, startZ) {
    const coinGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.20, 12); // Dropped faces to 12 for execution speed
    coinGeo.rotateX(Math.PI / 2);
    
    const coinMat = new THREE.MeshStandardMaterial({ 
        color: 0xffcc00, emissive: 0xffaa00, emissiveIntensity: 0.5, metalness: 0.8, roughness: 0.2
    });

    for (let i = 0; i < 3; i++) {
        const coinMesh = new THREE.Mesh(coinGeo, coinMat);
        coinMesh.position.set(laneX, 1.2, startZ - (i * 6));
        scene.add(coinMesh);
        coins.push(coinMesh);
    }
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
        if(gameState === "PLAYING") {
            const roots = [110, 73, 55, 41]; 
            const activeRoot = roots[currentTier] || 110;
            const notes = [activeRoot, activeRoot * 1.2, activeRoot * 1.5, activeRoot * 1.8];
            const waveTypes = ["triangle", "sawtooth", "sawtooth", "square"];
            playAudioTone(notes[Math.floor(Math.random() * notes.length)], waveTypes[currentTier], 0.6, 0.18 * bgmVolume);
        }
    }, 550);
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

function shiftingThemeStateMatrix(tierIndex) {
    currentTier = tierIndex;
    
    const tiers = [
        { sky: 0xa3e5ff, fogDen: 0.008, sun: 0xffffff, amb: 0x7cdaff, track: 0x004411, gLine: 0x00ff66, gSub: 0x00aa44, rail: 0xff0066 }, 
        { sky: 0x1a0505, fogDen: 0.015, sun: 0xff2200, amb: 0x3a0000, track: 0x110505, gLine: 0xff3300, gSub: 0x551100, rail: 0xaa0000 }, 
        { sky: 0x0c0114, fogDen: 0.018, sun: 0x9900ff, amb: 0x110022, track: 0x05010a, gLine: 0x00ffaa, gSub: 0x004422, rail: 0x6600cc }, 
        { sky: 0x000000, fogDen: 0.025, sun: 0xffaa00, amb: 0x0a0a0a, track: 0x020202, gLine: 0xff0044, gSub: 0x330000, rail: 0xffaa00 }  
    ];

    const currentBlueprint = tiers[tierIndex];

    scene.background = new THREE.Color(currentBlueprint.sky);
    scene.fog.color = new THREE.Color(currentBlueprint.sky);
    scene.fog.density = currentBlueprint.fogDen;

    const sun = scene.getObjectByName("sunlight"); if(sun) sun.color.setHex(currentBlueprint.sun);
    const ambient = scene.getObjectByName("ambientlight"); if(ambient) ambient.color.setHex(currentBlueprint.amb);

    trackPieces.forEach(track => {
        const roadMesh = track.children[0];
        roadMesh.material.color.setHex(currentBlueprint.track);
        
        const oldGrid = roadMesh.children[0]; roadMesh.remove(oldGrid);
        const freshGrid = new THREE.GridHelper(40, 10, currentBlueprint.gLine, currentBlueprint.gSub);
        freshGrid.rotation.x = Math.PI / 2; freshGrid.position.set(0, 0.02, 0);
        roadMesh.add(freshGrid);

        track.children[1].material.color.setHex(currentBlueprint.rail);
        track.children[2].material.color.setHex(currentBlueprint.rail);
    });

    // Update the singular instanced mesh tone to match environments instantly
    if (treeInstanceMesh) {
        if(tierIndex === 0) treeInstanceMesh.material.color.setHex(0x00ff44);
        else if(tierIndex === 1) treeInstanceMesh.material.color.setHex(0x3a0000);
        else if(tierIndex === 2) treeInstanceMesh.material.color.setHex(0x3d0066);
        else treeInstanceMesh.material.color.setHex(0x444444);
    }

    playAudioTone(100 + (tierIndex * 80), "sawtooth", 0.6, 0.5);
}

function startRun() {
    startProceduralEngineAudio();
    if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

    speed = 0.6; distance = 0; coinsCount = 0; 
    coinsUi.innerText = "0";
    
    shiftingThemeStateMatrix(0);

    obstacles.forEach(obs => scene.remove(obs)); coins.forEach(c => scene.remove(c));
    obstacles = []; coins = [];

    assembleSelectedDrone();
    spawnObstacle(-60); spawnObstacle(-110); spawnObstacle(-160);

    startScreen.classList.add('hidden'); gameOverScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden'); hud.classList.remove('hidden');
    
    playAudioTone(523.25, "sine", 0.3, 0.4); 
    gameState = "PLAYING";
}

function update() {
    modulateEngineSound();
    if (gameState !== "PLAYING") return;
    const spec = droneSpecs[activeDroneType];
    const elapsedTime = performance.now() * 0.001; 

    if ((keys['a'] || keys['arrowleft']) && player.position.x > -6.5) player.position.x -= spec.lateral;
    if ((keys['d'] || keys['arrowright']) && player.position.x < 6.5) player.position.x += spec.lateral;

    if (keys['a'] || keys['arrowleft']) player.rotation.z = 0.35;
    else if (keys['d'] || keys['arrowright']) player.rotation.z = -0.35;
    else player.rotation.z *= 0.75; 

    if (speed < maxSpeed) speed += 0.00015;
    distance += 1;

    const computedVelocityKMH = Math.floor(speed * 180);
    speedUi.innerText = computedVelocityKMH; distanceUi.innerText = distance;

    if (computedVelocityKMH >= 300 && currentTier < 3) {
        shiftingThemeStateMatrix(3);
    } else if (computedVelocityKMH >= 250 && computedVelocityKMH < 300 && currentTier < 2) {
        shiftingThemeStateMatrix(2);
    } else if (computedVelocityKMH >= 200 && computedVelocityKMH < 250 && currentTier < 1) {
        shiftingThemeStateMatrix(1);
    }

    trackPieces.forEach(track => {
        track.position.z += speed;
        if (track.position.z > 40) track.position.z = -200;
    });

    // HIGH PERFORMANCE STATIC INSTANCED RUNWAY TREE RECYCLER 
    for (let i = 0; i < treePositions.length; i++) {
        const data = treePositions[i];
        data.z += speed;
        if (data.z > 20) {
            data.z = -220;
            data.x = data.side === 'left' ? (-11 - Math.random() * 24) : (11 + Math.random() * 24);
        }
    }
    updateInstancedMeshTransforms();

    // Inline distance checking to minimize active array manipulation overheads
    for (let index = coins.length - 1; index >= 0; index--) {
        const coin = coins[index];
        coin.position.z += speed; coin.rotation.y += 0.04;
        
        if (player.position.distanceTo(coin.position) < 1.4) {
            scene.remove(coin); coins.splice(index, 1);
            coinsCount += 1; coinsUi.innerText = coinsCount;
            playAudioTone(880, "sine", 0.08, 0.25);
            continue;
        }
        if (coin.position.z > 20) { scene.remove(coin); coins.splice(index, 1); }
    }

    // High Performance Active Hazards Updates 
    _playerBox.setFromObject(player);
    for (let index = obstacles.length - 1; index >= 0; index--) {
        const obs = obstacles[index];
        obs.position.z += speed;
        
        const behavior = obs.userData.type;
        const offset = obs.userData.timeOffset;
        
        if (behavior === "SPINNING") {
            obs.rotation.y += 0.035;
        } else if (behavior === "JUMPING") {
            obs.position.y = obs.userData.baseY + Math.abs(Math.sin(elapsedTime * 4.5 + offset)) * 4.0;
        } else if (behavior === "MOVING") {
            obs.position.x = Math.sin(elapsedTime * 3.0 + offset) * 6.0;
        }

        // Uses pre-allocated structures to prevent frame drops
        _obstacleBox.setFromObject(obs);

        if (_playerBox.intersectsBox(_obstacleBox)) {
            gameState = "GAMEOVER";
            playAudioTone(120, "sawtooth", 0.8, 0.6);
            setTimeout(() => playAudioTone(60, "sawtooth", 0.5, 0.4), 150);
            hud.classList.add('hidden'); gameOverScreen.classList.remove('hidden');
            break;
        }

        if (obs.position.z > 20) {
            scene.remove(obs); obstacles.splice(index, 1); spawnObstacle(-180);
        }
    }

    const targetCameraX = player.position.x;
    camera.position.x += (targetCameraX - camera.position.x) * 0.1;
    camera.lookAt(player.position.x, player.position.y + 0.5, player.position.z - 8);
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
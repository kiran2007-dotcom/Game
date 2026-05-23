// Frame Context Engine Architecture Pointers
let scene, camera, renderer;
let gameState = "START"; 
let player;
let obstacles = [];
let trackPieces = [];
let coins = [];
let trees = []; // Restored detailed tracking registry

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

// Reusable math allocation shells to completely avoid garbage collection stuttering
const _playerBox = new THREE.Box3();
const _obstacleBox = new THREE.Box3();

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
        antialias: false, // Performance booster for steady framerates
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

    // MULTI-LAYERED DEEP FOREST GENERATION (Restored Original Visual Layout)
    // Optimized matrix positioning to avoid complex run-time object transformations
    for(let z = 0; z > -240; z -= 8) {
        spawnTree(-11 - Math.random() * 3, z);  
        spawnTree(-15 - Math.random() * 4, z + 3);  
        spawnTree(-22 - Math.random() * 6, z - 2);  
        spawnTree(-30 - Math.random() * 8, z + 1);  

        spawnTree(11 + Math.random() * 3, z);   
        spawnTree(15 + Math.random() * 4, z + 3);   
        spawnTree(22 + Math.random() * 6, z - 2);   
        spawnTree(30 + Math.random() * 8, z + 1);   
    }

    setupMenuInteractions();
    
    window.innerWidth < 768 ? renderer.setPixelRatio(1) : renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('keydown', handleGlobalKeydown);
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
        canvas.width = 128; canvas.height = 128; 
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

/**
 * Restored Detailed Structural Tree Generation Pipeline with Optimization Flags
 */
function spawnTree(xPos, zPos) {
    const treeGroup = new THREE.Group();
    
    const trunkHeight = 6.0 + Math.random() * 5.0;
    const trunkRadius = 0.45 + Math.random() * 0.35;

    const trunkGeo = new THREE.CylinderGeometry(trunkRadius * 0.5, trunkRadius, trunkHeight, 5); // Trimmed sides slightly for performance
    
    let trunkColor = 0x422d1e;
    if (currentTier === 1) trunkColor = 0x1f1111;
    if (currentTier === 2) trunkColor = 0x3d0066;
    if (currentTier === 3) trunkColor = 0xdddddd;

    const trunkMat = new THREE.MeshStandardMaterial({ color: trunkColor, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = trunkHeight / 2;
    treeGroup.add(trunk);

    const branchesGroup = new THREE.Group();
    branchesGroup.name = "branches";
    const branchCount = 2 + Math.floor(Math.random() * 2);
    for(let i=0; i<branchCount; i++) {
        const bGeo = new THREE.BoxGeometry(2.5, 0.22, 0.22);
        const bMesh = new THREE.Mesh(bGeo, trunkMat);
        bMesh.position.set(Math.random() > 0.5 ? 1.0 : -1.0, (trunkHeight * 0.35) + (i * 1.5), 0);
        bMesh.rotation.z = Math.random() > 0.5 ? 0.30 : -0.30;
        branchesGroup.add(bMesh);
    }
    treeGroup.add(branchesGroup);

    const leavesGroup = new THREE.Group();
    leavesGroup.name = "foliage";
    
    if (currentTier === 0) {
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x00ff44, emissive: 0x003311, roughness: 0.6 });
        for(let j=0; j<3; j++) {
            const size = 3.8 - (j * 0.9);
            const lGeo = new THREE.ConeGeometry(size, 4.2, 4); // Low-poly profile structure preserves memory bandwidth
            const lMesh = new THREE.Mesh(lGeo, leafMat);
            lMesh.position.y = trunkHeight - 1 + (j * 2.0);
            leavesGroup.add(lMesh);
        }
    }
    treeGroup.add(leavesGroup);

    treeGroup.position.set(xPos, 0, zPos);
    
    // Disable auto-matrix computation to bypass continuous CPU-to-GPU overhead spikes
    treeGroup.matrixAutoUpdate = false;
    treeGroup.updateMatrix();

    scene.add(treeGroup);
    trees.push(treeGroup);
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
    
    // Restricted obstacle roster: Left-Right MOVING obstacles have been removed
    const types = ["STATIC", "SPINNING", "JUMPING"];
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
    const coinGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.20, 12); 
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
        { sky: 0xa3e5ff, fogDen: 0.008, sun: 0xffffff, amb: 0x7cdaff, track: 0x004411, gLine: 0x00ff66, gSub: 0x00aa44, rail: 0xff0066, wood: 0x5a3d28, leafColor: 0x00ff44 }, 
        { sky: 0x1a0505, fogDen: 0.015, sun: 0xff2200, amb: 0x3a0000, track: 0x110505, gLine: 0xff3300, gSub: 0x551100, rail: 0xaa0000, wood: 0x1f1111 }, 
        { sky: 0x0c0114, fogDen: 0.018, sun: 0x9900ff, amb: 0x110022, track: 0x05010a, gLine: 0x00ffaa, gSub: 0x004422, rail: 0x6600cc, wood: 0x3d0066 }, 
        { sky: 0x000000, fogDen: 0.025, sun: 0xffaa00, amb: 0x0a0a0a, track: 0x020202, gLine: 0xff0044, gSub: 0x330000, rail: 0xffaa00, wood: 0xdddddd }  
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

    trees.forEach(treeGroup => {
        treeGroup.children[0].material.color.setHex(currentBlueprint.wood);
        const branchGroup = treeGroup.getObjectByName("branches");
        if(branchGroup) {
            branchGroup.children.forEach(b => b.material.color.setHex(currentBlueprint.wood));
        }

        const leavesGroup = treeGroup.getObjectByName("foliage");
        if (leavesGroup) {
            leavesGroup.clear(); 
            if (tierIndex === 0) {
                const trunkHeight = treeGroup.children[0].geometry.parameters.height;
                const leafMat = new THREE.MeshStandardMaterial({ color: currentBlueprint.leafColor, emissive: 0x003311, roughness: 0.6 });
                for(let j=0; j<3; j++) {
                    const size = 3.8 - (j * 0.9);
                    const lGeo = new THREE.ConeGeometry(size, 4.2, 4);
                    const lMesh = new THREE.Mesh(lGeo, leafMat);
                    lMesh.position.y = trunkHeight - 1 + (j * 2.0);
                    leavesGroup.add(lMesh);
                }
            }
        }
        treeGroup.updateMatrix(); // Refresh local frame representation maps manually
    });

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

    // Highly Optimized Matrix-Recycler for detailed trees
    trees.forEach(treeGroup => {
        treeGroup.position.z += speed;
        if (treeGroup.position.z > 20) {
            const oldX = treeGroup.position.x;
            const isLeft = oldX < 0;
            let newX = isLeft ? (-11 - Math.random() * 24) : (11 + Math.random() * 24);
            treeGroup.position.set(newX, 0, -220);
        }
        treeGroup.updateMatrix(); 
    });

    // Optimized inline reverse collection sweep for active item configurations
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
        }

        // Bounding checks utilize static pre-allocated wrappers to eliminate dynamic frame-drops
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
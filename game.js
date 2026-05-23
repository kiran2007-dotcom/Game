// Frame Context Engine Architecture Pointers
let scene, camera, renderer;
let gameState = "START"; // START, PLAYING, PAUSED, GAMEOVER
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

/**
 * Initializes the full WebGL pipeline and environmental configurations.
 */
function init() {
    // 1. Scene setup with Standard Sky-Blue Theme parameters
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

    // 2. Main Lighting Nodes Configuration
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.name = "sunlight";
    sunLight.position.set(5, 20, 10);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x7cdaff, 0.6); 
    ambientLight.name = "ambientlight";
    scene.add(ambientLight);

    // 3. Instance structural track runways
    for(let i = 0; i < 6; i++) {
        createTrackSection(i * -40);
    }

    // 4. Input Matrix and Config Interchanges Event Wiring
    setupMenuInteractions();
    
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('keydown', handleGlobalKeydown);
}

/**
 * Procedurally structures the base running boards with navigation coordinates.
 */
function createTrackSection(zOffset) {
    const group = new THREE.Group();

    const roadGeo = new THREE.PlaneGeometry(18, 40);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x004411, roughness: 0.4 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    group.add(road);

    const grid = new THREE.GridHelper(40, 10, 0x00ff66, 0x00aa44); 
    grid.rotation.x = Math.PI / 2;
    grid.position.set(0, 0.02, 0); 
    road.add(grid);

    const railGeo = new THREE.BoxGeometry(0.5, 1.2, 40);
    const railMat = new THREE.MeshStandardMaterial({ color: 0xff0066, emissive: 0xff0066, emissiveIntensity: 0.6 });
    
    const leftRail = new THREE.Mesh(railGeo, railMat);
    leftRail.position.set(-9, 0.6, 0);
    group.add(leftRail);

    const rightRail = new THREE.Mesh(railGeo, railMat);
    rightRail.position.set(9, 0.6, 0);
    group.add(rightRail);

    group.position.z = zOffset;
    scene.add(group);
    trackPieces.push(group);
}

/**
 * Builds the selected model blueprint layout inside our operational workspace viewports.
 */
function assembleSelectedDrone() {
    if (player) scene.remove(player);

    const spec = droneSpecs[activeDroneType];
    const droneGroup = new THREE.Group();
    
    const hullGeo = new THREE.ConeGeometry(spec.size, 2.2, 5);
    hullGeo.rotateX(Math.PI / 2); 
    const hullMat = new THREE.MeshStandardMaterial({ 
        color: spec.color,
        emissive: spec.emissive,
        emissiveIntensity: 0.4,
        roughness: 0.1, metalness: 0.9 
    });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    droneGroup.add(hull);

    const wingGeo = new THREE.BoxGeometry(2.2, 0.08, 0.5);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x1b1b22, roughness: 0.6 });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.position.set(0, -0.05, 0.1);
    droneGroup.add(wings);

    player = droneGroup;
    player.position.set(0, 0.8, 0);
    scene.add(player);

    const underglow = new THREE.PointLight(spec.color, 3, 8);
    underglow.position.set(0, -0.5, 0);
    player.add(underglow);
}

/**
 * Spawns an obstacle blocker at a specified coordinate point down the runway.
 */
function spawnObstacle(zPos) {
    const lanes = [-5, 0, 5]; 
    const chosenLane = lanes[Math.floor(Math.random() * lanes.length)];
    
    const obsGeo = new THREE.BoxGeometry(4.5, 4, 2);
    const obsMat = new THREE.MeshStandardMaterial({ 
        color: 0x111122, 
        emissive: isHellTheme ? 0xff3300 : 0x00f3ff, 
        emissiveIntensity: 0.4, roughness: 0.2 
    });
    const obstacle = new THREE.Mesh(obsGeo, obsMat);
    obstacle.position.set(chosenLane, 2, zPos);
    
    scene.add(obstacle);
    obstacles.push(obstacle);

    // Spawns quantum currency nodes around the upcoming blocker arrangements
    if (Math.random() > 0.3) {
        const coinLane = lanes[Math.floor(Math.random() * lanes.length)];
        spawnCoin(coinLane, zPos + (Math.random() * 15 + 10));
    }
}

/**
 * Spawns a rotating structural data token inside the navigation vector map lanes.
 */
function spawnCoin(xPos, zPos) {
    const coinGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.15, 16);
    coinGeo.rotateX(Math.PI / 2);
    const coinMat = new THREE.MeshStandardMaterial({ 
        color: 0xffcc00, emissive: 0xffaa00, emissiveIntensity: 0.6, metalness: 1.0, roughness: 0.1
    });
    const coinMesh = new THREE.Mesh(coinGeo, coinMat);
    coinMesh.position.set(xPos, 1.2, zPos);
    
    scene.add(coinMesh);
    coins.push(coinMesh);
}

/**
 * Synthesizes sound frequencies using pure programmatic Web Audio nodes.
 */
function playAudioTone(freq, type, duration, volume) {
    if (!audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(volume * sfxVolume, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch(e) { console.warn("Audio node context drop."); }
}

/**
 * Starts continuous backend audio synthesis modules simulating active mechanics loops.
 */
function startProceduralEngineAudio() {
    if (audioCtx) return;
    
    // Initialize standard programmatic system parameters
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
    
    engineOscillator = audioCtx.createOscillator();
    engineGainNode = audioCtx.createGain();
    
    engineOscillator.type = "sawtooth";
    engineOscillator.frequency.setValueAtTime(65, audioCtx.currentTime); // Deep engine rumble
    
    engineGainNode.gain.setValueAtTime(0.08 * sfxVolume, audioCtx.currentTime);
    
    // Lowpass filter to create a rich mechanical engine profile
    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(140, audioCtx.currentTime);
    
    engineOscillator.connect(filter);
    filter.connect(engineGainNode);
    engineGainNode.connect(audioCtx.destination);
    
    engineOscillator.start();

    // Infinite Background Synth Music Loop Generator
    ambientSynthInterval = setInterval(() => {
        if(gameState === "PLAYING" && !isHellTheme) {
            const notes = [110, 130, 146, 165];
            const chosenNote = notes[Math.floor(Math.random() * notes.length)];
            playAudioTone(chosenNote, "triangle", 0.8, 0.2 * bgmVolume);
        } else if (gameState === "PLAYING" && isHellTheme) {
            // Dark hell chords
            const notes = [73, 82, 87, 98];
            const chosenNote = notes[Math.floor(Math.random() * notes.length)];
            playAudioTone(chosenNote, "sawtooth", 0.6, 0.15 * bgmVolume);
        }
    }, 600);
}

/**
 * Modulates engine frequencies dynamically based on current game velocities.
 */
function modulateEngineSound() {
    if (!engineOscillator) return;
    // Map current velocity scalar directly to audio frequencies
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
        gameState = "PAUSED";
        pauseScreen.classList.remove('hidden');
    } else {
        gameState = "PLAYING";
        pauseScreen.classList.add('hidden');
    }
    playAudioTone(300, "sine", 0.15, 0.2);
}

function startRun() {
    startProceduralEngineAudio();
    if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

    // Reset parameters back to pristine vectors
    speed = 0.6; distance = 0; coinsCount = 0; isHellTheme = false;
    coinsUi.innerText = "0";
    
    // Reset World Colors to Sky Blue default properties
    scene.background = new THREE.Color(0xa3e5ff);
    scene.fog.color = new THREE.Color(0xa3e5ff);
    scene.fog.density = 0.008;
    
    const sun = scene.getObjectByName("sunlight");
    if(sun) sun.color.setHex(0xffffff);
    const ambient = scene.getObjectByName("ambientlight");
    if(ambient) ambient.color.setHex(0x7cdaff);

    // Swap materials layout structures back to green matrix grids
    trackPieces.forEach((track, index) => {
        track.position.z = index * -40;
        const roadMesh = track.children[0];
        roadMesh.material.color.setHex(0x004411);
        const gridMesh = roadMesh.children[0];
        scene.remove(gridMesh);
        
        const freshGrid = new THREE.GridHelper(40, 10, 0x00ff66, 0x00aa44);
        freshGrid.rotation.x = Math.PI / 2; freshGrid.position.set(0, 0.02, 0);
        roadMesh.add(freshGrid);
    });

    // Clean viewport asset instances
    obstacles.forEach(obs => scene.remove(obs));
    coins.forEach(c => scene.remove(c));
    obstacles = []; coins = [];

    assembleSelectedDrone();

    spawnObstacle(-60); spawnObstacle(-110); spawnObstacle(-160);

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    hud.classList.remove('hidden');
    
    playAudioTone(523.25, "sine", 0.3, 0.4); // Success high node chord entry
    gameState = "PLAYING";
}

/**
 * Triggers an adaptive visual transition over the landscape when passing 200KM/H thresholds.
 */
function triggerHellOverdriveTransformation() {
    isHellTheme = true;
    
    // Smoothly shift scene background and ambient lighting profiles
    scene.background = new THREE.Color(0x1a0505); // Hellish dark volcanic void
    scene.fog.color = new THREE.Color(0x1a0505);
    scene.fog.density = 0.015;

    const sun = scene.getObjectByName("sunlight");
    if(sun) sun.color.setHex(0xff2200); // Blood orange beam maps

    const ambient = scene.getObjectByName("ambientlight");
    if(ambient) ambient.color.setHex(0x3a0000);

    // Re-skin track segments dynamically to charcoal and brimstone color structures
    trackPieces.forEach(track => {
        const roadMesh = track.children[0];
        roadMesh.material.color.setHex(0x110505);
        
        // Remove old tech grids and replace with lava lines
        const oldGrid = roadMesh.children[0];
        roadMesh.remove(oldGrid);

        const lavaGrid = new THREE.GridHelper(40, 10, 0xff3300, 0x551100);
        lavaGrid.rotation.x = Math.PI / 2;
        lavaGrid.position.set(0, 0.02, 0);
        roadMesh.add(lavaGrid);
    });

    // Alert sound profile trigger
    playAudioTone(90, "sawtooth", 0.6, 0.5);
}

/**
 * Frame Processing Engine loop handler calculation pipeline.
 */
function update() {
    modulateEngineSound();
    if (gameState !== "PLAYING") return;

    const spec = droneSpecs[activeDroneType];

    // 1. Process Lateral Key Coordinates
    if ((keys['a'] || keys['arrowleft']) && player.position.x > -6.5) player.position.x -= spec.lateral;
    if ((keys['d'] || keys['arrowright']) && player.position.x < 6.5) player.position.x += spec.lateral;

    if (keys['a'] || keys['arrowleft']) player.rotation.z = 0.35;
    else if (keys['d'] || keys['arrowright']) player.rotation.z = -0.35;
    else player.rotation.z *= 0.75; 

    // 2. Pace Accelerations and Evaluate Velocity Rulesets
    if (speed < maxSpeed) speed += 0.00015;
    distance += 1;

    const computedVelocityKMH = Math.floor(speed * 180);
    speedUi.innerText = computedVelocityKMH;
    distanceUi.innerText = distance;

    // Check configuration parameters for live theme transformations
    if (computedVelocityKMH >= 200 && !isHellTheme) {
        triggerHellOverdriveTransformation();
    }

    // 3. Roll Track Configurations smoothly
    trackPieces.forEach(track => {
        track.position.z += speed;
        if (track.position.z > 40) track.position.z = -200;
    });

    // 4. Update data tokens rotation matrices and proximity maps
    coins.forEach((coin, index) => {
        coin.position.z += speed;
        coin.rotation.y += 0.05; // Constant rotational spin animation

        // Basic high-performance circle radius threshold collection verification
        const distanceToCoin = player.position.distanceTo(coin.position);
        if (distanceToCoin < 1.2) {
            scene.remove(coin);
            coins.splice(index, 1);
            coinsCount += 1;
            coinsUi.innerText = coinsCount;
            playAudioTone(880, "sine", 0.1, 0.3); // High-pitch arcade synth drop collect sound
        }

        if (coin.position.z > 20) {
            scene.remove(coin);
            coins.splice(index, 1);
        }
    });

    // 5. Update active blocker layouts and verify collisions
    obstacles.forEach((obs, index) => {
        obs.position.z += speed;

        const pBox = new THREE.Box3().setFromObject(player);
        const oBox = new THREE.Box3().setFromObject(obs);

        if (pBox.intersectsBox(oBox)) {
            gameState = "GAMEOVER";
            // Fire devastating impact down-filter synthesizer frequency chord
            playAudioTone(120, "sawtooth", 0.8, 0.6);
            setTimeout(() => playAudioTone(60, "sawtooth", 0.5, 0.4), 150);
            
            hud.classList.add('hidden');
            gameOverScreen.classList.remove('hidden');
        }

        if (obs.position.z > 20) {
            scene.remove(obs);
            obstacles.splice(index, 1);
            spawnObstacle(-180);
        }
    });

    // 6. Chasing Camera Rig target track matrices calculations
    const targetCameraX = player.position.x;
    camera.position.x += (targetCameraX - camera.position.x) * 0.1;
    camera.position.y = 7; camera.position.z = 14; 

    const cameraLookTarget = new THREE.Vector3(player.position.x, player.position.y + 0.5, player.position.z - 8);
    camera.lookAt(cameraLookTarget);
}

function setupMenuInteractions() {
    // Hook selection configuration parameters rows
    const options = document.querySelectorAll('.drone-option');
    options.forEach(opt => {
        opt.onclick = (e) => {
            options.forEach(o => o.classList.remove('active'));
            const targetNode = e.currentTarget;
            targetNode.classList.add('active');
            activeDroneType = targetNode.getAttribute('data-drone');
            playAudioTone(440, "sine", 0.08, 0.2); // Feedback click tone
        };
    });

    // Map volume interactive nodes sliders
    document.getElementById('sfx-vol').oninput = (e) => { sfxVolume = parseFloat(e.target.value); };
    document.getElementById('bgm-vol').oninput = (e) => { bgmVolume = parseFloat(e.target.value); };

    // Set buttons wiring pipelines hooks
    document.getElementById('start-btn').onclick = startRun;
    document.getElementById('restart-btn').onclick = startRun;
    document.getElementById('pause-btn').onclick = togglePauseState;
    document.getElementById('resume-btn').onclick = togglePauseState;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
}

// Spark Engine Architecture Run configurations execution
init();
animate();
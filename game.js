// Global Scene Node Declarations
let scene, camera, renderer;
let gameState = "START";
let player;
let obstacles = [];
let trackPieces = [];

// Game Vectors & Tuning Configurations
let speed = 0.6;
const maxSpeed = 1.8;
let distance = 0;
const keys = {};

// UI Document Component Accessor Pointers
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const speedUi = document.getElementById('speed-ui');
const distanceUi = document.getElementById('distance-ui');

/**
 * Initializes the full WebGL context, environmental nodes, and asset groups.
 */
function init() {
    // 1. Scene setup with Sky-Blue Fog atmosphere parameters
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa3e5ff); 
    scene.fog = new THREE.FogExp2(0xa3e5ff, 0.008); 

    // 2. Camera setup - Positioned behind and looking down the lane matrix
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 7, 14); 

    // 3. WebGL Renderer Initialization
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    const container = document.getElementById('3d-container');
    container.innerHTML = ""; // Clear existing contexts if re-initializing
    container.appendChild(renderer.domElement);

    // 4. Lighting Engine configuration (Sunlight directional maps + Sky reflection ambient)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(5, 20, 10);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x7cdaff, 0.6); 
    scene.add(ambientLight);

    // 5. Instancing continuous road geometry nodes 
    for(let i = 0; i < 6; i++) {
        createTrackSection(i * -40);
    }

    // 6. Assemble High-Visibility Neon Orange Drone Assembly
    const droneGroup = new THREE.Group();
    
    // Core flight hull geometry setup
    const hullGeo = new THREE.ConeGeometry(0.5, 2.2, 5);
    hullGeo.rotateX(Math.PI / 2); 
    const hullMat = new THREE.MeshStandardMaterial({ 
        color: 0xffaa00, // Vibrant Safety Orange
        emissive: 0xff5500, // Inner deep fire energy core projection
        emissiveIntensity: 0.3,
        roughness: 0.1, 
        metalness: 0.9 
    });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    droneGroup.add(hull);

    // Stabilizer wing geometry setup
    const wingGeo = new THREE.BoxGeometry(2.5, 0.1, 0.6);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x222228, roughness: 0.5 });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.position.set(0, -0.1, 0.2);
    droneGroup.add(wings);

    player = droneGroup;
    player.position.set(0, 0.8, 0);
    scene.add(player);

    // PointLight attachment under the fuselage to map spatial coordinates clearly
    const underglow = new THREE.PointLight(0xffaa00, 3, 8);
    underglow.position.set(0, -0.5, 0);
    player.add(underglow);

    // Dynamic Engine Event Configuration Hooks
    window.removeEventListener('resize', onWindowResize);
    window.addEventListener('resize', onWindowResize, false);
    
    document.getElementById('start-btn').onclick = startRun;
    document.getElementById('restart-btn').onclick = startRun;
}

/**
 * Procedurally generates track panels featuring structural neon green grid maps.
 */
function createTrackSection(zOffset) {
    const group = new THREE.Group();

    // Structural floor mesh properties (Forest Green Base)
    const roadGeo = new THREE.PlaneGeometry(18, 40);
    const roadMat = new THREE.MeshStandardMaterial({ 
        color: 0x004411, 
        roughness: 0.4 
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    group.add(road);

    // Vivid Technical Navigation Grid overlay
    const grid = new THREE.GridHelper(40, 10, 0x00ff66, 0x00aa44); 
    grid.rotation.x = Math.PI / 2;
    grid.position.set(0, 0.02, 0); 
    road.add(grid);

    // High-contrast boundaries (Neon Magenta Side Rails)
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
 * Spawns an obsidian blocker wall with a sharp cyber cyan perimeter layout.
 */
function spawnObstacle(zPos) {
    const lanes = [-5, 0, 5]; 
    const chosenLane = lanes[Math.floor(Math.random() * lanes.length)];
    
    const obsGeo = new THREE.BoxGeometry(4.5, 4, 2);
    const obsMat = new THREE.MeshStandardMaterial({ 
        color: 0x111122, 
        emissive: 0x00f3ff, 
        emissiveIntensity: 0.4,
        roughness: 0.2 
    });
    const obstacle = new THREE.Mesh(obsGeo, obsMat);
    
    obstacle.position.set(chosenLane, 2, zPos);
    scene.add(obstacle);
    obstacles.push(obstacle);
}

// Global Keyboard Tracking Matrix mapping
window.onkeydown = (e) => { keys[e.key.toLowerCase()] = true; };
window.onkeyup = (e) => { keys[e.key.toLowerCase()] = false; };

/**
 * Resets application loop variables and spawns starting obstacle configurations.
 */
function startRun() {
    speed = 0.6;
    distance = 0;
    player.position.set(0, 0.8, 0);
    player.rotation.set(0, 0, 0);
    
    obstacles.forEach(obs => scene.remove(obs));
    obstacles = [];

    trackPieces.forEach((track, index) => {
        track.position.z = index * -40;
    });

    // Populate advanced runway challenges instantly down the line
    spawnObstacle(-60);
    spawnObstacle(-110);
    spawnObstacle(-160);

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    gameState = "PLAYING";
}

/**
 * Processes physical simulation transformations, collisions, and tracking updates.
 */
function update() {
    if (gameState !== "PLAYING") return;

    // 1. Process Lateral Key Inputs with Horizontal Restrictions
    const lateralSpeed = 0.3;
    if ((keys['a'] || keys['arrowleft']) && player.position.x > -6.5) player.position.x -= lateralSpeed;
    if ((keys['d'] || keys['arrowright']) && player.position.x < 6.5) player.position.x += lateralSpeed;

    // Apply turning roll bank animation angles (tilting)
    if (keys['a'] || keys['arrowleft']) player.rotation.z = 0.35;
    else if (keys['d'] || keys['arrowright']) player.rotation.z = -0.35;
    else player.rotation.z *= 0.75; 

    // Gradually speed up the game pacing
    if (speed < maxSpeed) speed += 0.00015;
    distance += 1;

    speedUi.innerText = Math.floor(speed * 180);
    distanceUi.innerText = distance;

    // 2. Loop floor track pieces smoothly
    trackPieces.forEach(track => {
        track.position.z += speed;
        if (track.position.z > 40) {
            track.position.z = -200;
        }
    });

    // 3. Update active obstacle matrices and verify collisions
    obstacles.forEach((obs, index) => {
        obs.position.z += speed;

        // Perform spatial AABB bounding checks
        const pBox = new THREE.Box3().setFromObject(player);
        const oBox = new THREE.Box3().setFromObject(obs);

        if (pBox.intersectsBox(oBox)) {
            gameState = "GAMEOVER";
            gameOverScreen.classList.remove('hidden');
        }

        // Clean out and deploy new block chains over the horizon safely ahead
        if (obs.position.z > 20) {
            scene.remove(obs);
            obstacles.splice(index, 1);
            spawnObstacle(-180);
        }
    });

    // 4. Dynamic Lagging Third-Person Camera follow calculations (Lerping)
    const targetCameraX = player.position.x;
    camera.position.x += (targetCameraX - camera.position.x) * 0.1; // Smoothly track horizontally behind the drone

    camera.position.y = 7; 
    camera.position.z = 14; 

    // Anchor the tracking focal target slightly in front of the drone to maximize reaction visibility
    const cameraLookTarget = new THREE.Vector3(player.position.x, player.position.y + 0.5, player.position.z - 8);
    camera.lookAt(cameraLookTarget);
}

/**
 * Fits presentation viewports cleanly inside dynamic device resizing vectors.
 */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Continuous RequestAnimationFrame system iteration driver loop.
 */
function animate() {
    requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
}

// Fire the application pipeline
init();
animate();
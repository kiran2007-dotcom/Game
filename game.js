let scene, camera, renderer;
let gameState = "START";
let player;
let obstacles = [];
let trackPieces = [];

// Game Parameters
let speed = 0.5;
const maxSpeed = 1.5;
let distance = 0;
const keys = {};

// UI References
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const speedUi = document.getElementById('speed-ui');
const distanceUi = document.getElementById('distance-ui');

function init() {
    // 1. Create Scene & Atmospheric Haze
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020205);
    scene.fog = new THREE.FogExp2(0x020205, 0.015);

    // 2. Setup Perspective Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3, 8); // Positioned slightly behind and above

    // 3. Setup WebGL Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('3d-container').appendChild(renderer.domElement);

    // 4. Lighting Environment
    const ambientLight = new THREE.AmbientLight(0x0a0a15);
    scene.add(ambientLight);

    const neonLight = new THREE.DirectionalLight(0x00f3ff, 1.5);
    neonLight.position.set(0, 10, 5);
    scene.add(neonLight);

    // 5. Build Initial 3D Road Sections
    for(let i = 0; i < 5; i++) {
        createTrackSection(i * -40);
    }

    // 6. Create Player Drone (Sleek 3D Ship Shape)
    const playerGeo = new THREE.ConeGeometry(0.6, 2, 4);
    playerGeo.rotateX(Math.PI / 2); // Point forward
    const playerMat = new THREE.MeshStandardMaterial({ color: 0xff0055, roughness: 0.2, metalness: 0.8 });
    player = new THREE.Mesh(playerGeo, playerMat);
    player.position.set(0, 0.6, 0);
    scene.add(player);

    // Listeners
    window.addEventListener('resize', onWindowResize, false);
    document.getElementById('start-btn').addEventListener('click', startRun);
    document.getElementById('restart-btn').addEventListener('click', startRun);
}

function createTrackSection(zOffset) {
    const group = new THREE.Group();

    // Road surface
    const roadGeo = new THREE.PlaneGeometry(16, 40);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x05050a, roughness: 0.5 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    group.add(road);

    // Neon side guard-rails (Left & Right)
    const railGeo = new THREE.BoxGeometry(0.4, 1, 40);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x00f3ff, emissive: 0x00f3ff, emissiveIntensity: 0.5 });
    
    const leftRail = new THREE.Mesh(railGeo, railMat);
    leftRail.position.set(-8, 0.5, 0);
    group.add(leftRail);

    const rightRail = new THREE.Mesh(railGeo, railMat);
    rightRail.position.set(8, 0.5, 0);
    group.add(rightRail);

    group.position.z = zOffset;
    scene.add(group);
    trackPieces.push(group);
}

function spawnObstacle(zPos) {
    // Randomly place obstacles on Left (-4), Center (0), or Right (4) lanes
    const lanes = [-4, 0, 4];
    const chosenLane = lanes[Math.floor(Math.random() * lanes.length)];
    
    const obsGeo = new THREE.BoxGeometry(4, 3, 1.5);
    const obsMat = new THREE.MeshStandardMaterial({ color: 0x00f3ff, emissive: 0x00f3ff, emissiveIntensity: 0.3, roughness: 0.1 });
    const obstacle = new THREE.Mesh(obsGeo, obsMat);
    
    obstacle.position.set(chosenLane, 1.5, zPos);
    scene.add(obstacle);
    obstacles.push(obstacle);
}

// Keyboard Tracking
window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

function startRun() {
    // Reset Variables
    speed = 0.5;
    distance = 0;
    player.position.set(0, 0.6, 0);
    
    // Clear old obstacles
    obstacles.forEach(obs => scene.remove(obs));
    obstacles = [];

    // Reset Track layout positions
    trackPieces.forEach((track, index) => {
        track.position.z = index * -40;
    });

    // Spawn starting oncoming obstacles
    for(let i = 1; i <= 3; i++) {
        spawnObstacle(i * -50);
    }

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    gameState = "PLAYING";
}

function update() {
    if (gameState !== "PLAYING") return;

    // 1. Smooth Player Lane Sway Mechanics
    const sensitivity = 0.25;
    if ((keys['a'] || keys['arrowleft']) && player.position.x > -6) player.position.x -= sensitivity;
    if ((keys['d'] || keys['arrowright']) && player.position.x < 6) player.position.x += sensitivity;

    // Subtle tilt banking animation when turning
    if (keys['a'] || keys['arrowleft']) player.rotation.z = 0.25;
    else if (keys['d'] || keys['arrowright']) player.rotation.z = -0.25;
    else player.rotation.z *= 0.8; // Return to center level smoothly

    // 2. Accelerate game velocity gradually
    if (speed < maxSpeed) speed += 0.0002;
    distance += Math.floor(speed * 5);

    // Update Telemetry Screen Readouts
    speedUi.innerText = Math.floor(speed * 200);
    distanceUi.innerText = distance;

    // 3. Move and Recycle Track Pieces endlessly
    trackPieces.forEach(track => {
        track.position.z += speed;
        // If track piece moves completely behind camera perspective view, snap it to the horizon front line
        if (track.position.z > 40) {
            track.position.z = -160;
        }
    });

    // 4. Update Oncoming Security Walls
    obstacles.forEach((obs, index) => {
        obs.position.z += speed;

        // Math AABB Core Box Collision Verification
        const pBox = new THREE.Box3().setFromObject(player);
        const oBox = new THREE.Box3().setFromObject(obs);

        if (pBox.intersectsBox(oBox)) {
            gameState = "GAMEOVER";
            gameOverScreen.classList.remove('hidden');
        }

        // If obstacle passes player safely, recycle it to the front lines further down the track
        if (obs.position.z > 10) {
            scene.remove(obs);
            obstacles.splice(index, 1);
            // Spawn a brand new challenge further down
            spawnObstacle(-180);
        }
    });
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

init();
animate();
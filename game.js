let scene, camera, renderer;
let gameState = "START";
let player;
let obstacles = [];
let trackPieces = [];

// Game Parameters
let speed = 0.6;
const maxSpeed = 1.8;
let distance = 0;
const keys = {};

// UI References
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const speedUi = document.getElementById('speed-ui');
const distanceUi = document.getElementById('distance-ui');

function init() {
    // 1. Create Scene with Sky-Blue Fog Background
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa3e5ff); // Light Blue Sky Theme
    scene.fog = new THREE.FogExp2(0xa3e5ff, 0.008); // Mist fading into the horizon

    // 2. High-Visibility Tactical Camera Rig (Raised and Angled Down)
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 7, 14); // Moved higher up (7) and further back (14)

    // 3. Setup WebGL Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Ensure existing canvas is cleared before appending
    const container = document.getElementById('3d-container');
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 4. Lighting Environment (Bright Sunlight + Neon Ground Glow)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(5, 20, 10);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x7cdaff, 0.6); // Soft blue sky reflection
    scene.add(ambientLight);

    // 5. Build Initial 3D Road Sections
    for(let i = 0; i < 6; i++) {
        createTrackSection(i * -40);
    }

    // 6. High-Visibility Neon Orange Drone
    // Custom geometric build combining a cockpit and swept-back wings
    const droneGroup = new THREE.Group();
    
    // Core Hull Shield
    const hullGeo = new THREE.ConeGeometry(0.5, 2.2, 5);
    hullGeo.rotateX(Math.PI / 2); 
    const hullMat = new THREE.MeshStandardMaterial({ 
        color: 0xffaa00, // Safety Neon Orange
        emissive: 0xff5500, // Deep fiery orange glow core
        emissiveIntensity: 0.3,
        roughness: 0.1, 
        metalness: 0.9 
    });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    droneGroup.add(hull);

    // Cyber Wings for directional reference
    const wingGeo = new THREE.BoxGeometry(2.5, 0.1, 0.6);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.position.set(0, -0.1, 0.2);
    droneGroup.add(wings);

    player = droneGroup;
    player.position.set(0, 0.8, 0);
    scene.add(player);

    // Dedicated under-glow light to pop out from the floor matrix
    const underglow = new THREE.PointLight(0xffaa00, 3, 8);
    underglow.position.set(0, -0.5, 0);
    player.add(underglow);

    // Event Listeners
    window.removeEventListener('resize', onWindowResize);
    window.addEventListener('resize', onWindowResize, false);
    
    document.getElementById('start-btn').onclick = startRun;
    document.getElementById('restart-btn').onclick = startRun;
}

function createTrackSection(zOffset) {
    const group = new THREE.Group();

    // Floor Track Matrix - Vivid Electronic Cyber-Green
    const roadGeo = new THREE.PlaneGeometry(18, 40);
    const roadMat = new THREE.MeshStandardMaterial({ 
        color: 0x004411, // Dark base forest green
        roughness: 0.4 
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    group.add(road);

    // Tech Grid overlay to emphasize motion speed
    const grid = new THREE.GridHelper(40, 10, 0x00ff66, 0x00aa44); // Neon Green lines
    grid.rotation.x = Math.PI / 2;
    grid.position.set(0, 0.02, 0); // Sit perfectly flush on top of track
    road.add(grid);

    // Electric Magenta side boundaries
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

function spawnObstacle(zPos) {
    const lanes = [-5, 0, 5]; // Expanded lanes matching wider grid track
    const chosenLane = lanes[Math.floor(Math.random() * lanes.length)];
    
    // Bold Obsidian blocks with bright cyan framework lines to clearly map dimensions
    const obsGeo = new THREE.BoxGeometry(4.5, 4, 2);
    const obsMat = new THREE.MeshStandardMaterial({ 
        color: 0x111122, 
        emissive: 0x00f3ff, // Striking electric cyan frames
        emissiveIntensity: 0.4,
        roughness: 0.2 
    });
    const obstacle = new THREE.Mesh(obsGeo, obsMat);
    
    obstacle.position.set(chosenLane, 2, zPos);
    scene.add(obstacle);
    obstacles.push(obstacle);
}

// Controls Loop Mapping Tracker
window.onkeydown = (e) => { keys[e.key.toLowerCase()] = true; };
window.onkeyup = (e) => { keys[e.key.toLowerCase()] = false; };

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

    // Populate advanced runway challenges instantly down the grid line
    spawnObstacle(-60);
    spawnObstacle(-110);
    spawnObstacle(-160);

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    gameState = "PLAYING";
}

function update() {
    if (gameState !== "PLAYING") return;

    // Smooth Turn Velocity Calculations
    const lateralSpeed = 0.3;
    if ((keys['a'] || keys['arrowleft']) && player.position.x > -6.5) player.position.x -= lateralSpeed;
    if ((keys['d'] || keys['arrowright']) && player.position.x < 6.5) player.position.x += lateralSpeed;

    // Banking roll turn animation updates
    if (keys['a'] || keys['arrowleft']) player.rotation.z = 0.35;
    else if (keys['d'] || keys['arrowright']) player.rotation.z = -0.35;
    else player.rotation.z *= 0.75; 

    // Gradually speed up the game pacing
    if (speed < maxSpeed) speed += 0.00015;
    distance += 1;

    speedUi.innerText = Math.floor(speed * 180);
    distanceUi.innerText = distance;

    // Loop floor sections smoothly
    trackPieces.forEach(track => {
        track.position.z += speed;
        if (track.position.z > 40) {
            track.position.z = -200;
        }
    });

    // Process Active Oncoming Obstacles
    obstacles.forEach((obs, index) => {
        obs.position.z += speed;

        // Collision Verification Bounds Mapping
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

    // Match Camera Tracking Frame Anchor
    camera.lookAt(new THREE.Vector3(player.position.x * 0.6, player.position.y + 1, player.position.z - 5));
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
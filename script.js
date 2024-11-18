let scene, camera, renderer, carModels = [];
let carSpeed = 400; // Increase the speed of the road
let clock;
let roadSegments = [];
let cinematicMode = false;
let cinematicAngle = 0;

function init() {
  // Create the scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a1a); // Set a dark background color

  // Create the camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000); // Reduce FOV to 75 for better performance
  camera.position.set(0, 200, 800); // Set the camera position behind and above the car
  camera.lookAt(new THREE.Vector3(0, 0, 0)); // Look at the center of the scene

  // Create the renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true; // Enable shadow maps
  renderer.toneMapping = THREE.ACESFilmicToneMapping; // Enable RTX lighting
  renderer.toneMappingExposure = 1.5; // Adjust exposure for better performance
  renderer.physicallyCorrectLights = true; // Enable physically correct lighting
  renderer.setPixelRatio(window.devicePixelRatio); // Adjust pixel ratio for better performance
  document.body.appendChild(renderer.domElement);

  // Add lights
  const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
  sunLight.position.set(100, 100, -100).normalize();
  sunLight.castShadow = true; // Enable shadows for the light
  sunLight.shadow.mapSize.width = 1024; // Reduce shadow map size for better performance
  sunLight.shadow.mapSize.height = 1024;
  scene.add(sunLight);

  const ambientLight = new THREE.AmbientLight(0x333333);
  scene.add(ambientLight);

  // Generate initial road segments
  generateRoad();

  // Load the car models
  loadCarModel('Car5/material.lib', 'Car5/720TNR_2017.obj', 0, -10, -50, 0); // Center car
  loadCarModel('Car3/material.lib', 'Car3/720S.obj', -100, -10, -50, 250); // Left car
  loadCarModel('Car4/material.lib', 'Car4/650S.obj', 100, -10, -50, 250); // Right car

  // Add button for cinematic shots
  const buttonCinematic = document.createElement('button');
  buttonCinematic.innerText = 'Toggle Cinematic Mode';
  buttonCinematic.style.position = 'absolute';
  buttonCinematic.style.top = '10px';
  buttonCinematic.style.left = '10px';
  buttonCinematic.style.zIndex = '100';
  document.body.appendChild(buttonCinematic);
  buttonCinematic.addEventListener('click', toggleCinematicMode);

  window.addEventListener('resize', onWindowResize, false);

  function animate() {
    requestAnimationFrame(animate);

    // Move the road segments to simulate car movement
    roadSegments.forEach(road => {
      road.position.z += carSpeed;

      // Reposition road segments to create an infinite loop
      if (road.position.z > 1000) {
        road.position.z -= roadSegments.length * 1000;
      }
    });

    // Add slight wiggle to the cars
    carModels.forEach(carModel => {
      carModel.rotation.z = Math.sin(Date.now() * 0.01) * 0.025; // Reduce the wiggle by half
    });

    // Update camera position
    updateCamera();

    // Render the scene
    renderer.render(scene, camera);
  }

  animate();
}

function generateRoad() {
  const trackMaterial = new THREE.MeshStandardMaterial({ map: new THREE.TextureLoader().load('textures/Road.jpg') });
  let currentPosition = roadSegments.length > 0 ? roadSegments[roadSegments.length - 1].position.clone() : new THREE.Vector3(0, -50, -5000);
  let currentDirection = new THREE.Vector3(0, 0, 1);

  for (let i = 0; i < 10; i++) { // Reduce the number of road segments for better performance
    const segmentLength = 1000;
    const roadGeometry = new THREE.PlaneGeometry(segmentLength, 500);
    const road = new THREE.Mesh(roadGeometry, trackMaterial);
    road.rotation.x = -Math.PI / 2;
    road.rotation.z = Math.PI / 2; // Rotate the road 90 degrees
    road.position.copy(currentPosition).add(currentDirection.clone().multiplyScalar(segmentLength / 2));
    road.receiveShadow = true;
    scene.add(road);
    roadSegments.push(road);

    currentPosition.add(currentDirection.clone().multiplyScalar(segmentLength));
  }
}

function loadCarModel(materialPath, objPath, x, y, z, offsetZ) {
  const mtlLoader = new THREE.MTLLoader();
  mtlLoader.load(materialPath, (materials) => {
    materials.preload();
    const objLoader = new THREE.OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.load(objPath, (model) => {
      model.scale.set(50, 50, 50); // Scale up the model to 2.5x its original size
      model.position.set(x, y, z + offsetZ); // Position the car on the road
      model.rotation.y = Math.PI; // Rotate the car 180 degrees
      model.castShadow = true; // Enable shadows for the car
      carModels.push(model);
      scene.add(model);
      console.log('Model loaded successfully');
    }, (xhr) => {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    }, (error) => {
      console.error('An error happened', error);
    });
  });
}

function updateCamera() {
  const carPosition = carModels[0] ? carModels[0].position.clone() : new THREE.Vector3(0, -50, 0);
  const bobbing = Math.sin(Date.now() * 0.01) * 5;
  if (cinematicMode) {
    cinematicAngle += 0.01;
    const x = carPosition.x + 300 * Math.cos(cinematicAngle);
    const z = carPosition.z + 300 * Math.sin(cinematicAngle);
    camera.position.lerp(new THREE.Vector3(x, carPosition.y + 150 + bobbing, z), 0.1);
    camera.lookAt(carPosition);
  } else {
    camera.position.lerp(new THREE.Vector3(carPosition.x, carPosition.y + 150 + bobbing, carPosition.z + 500), 0.1);
    camera.lookAt(carPosition);
  }
}

function toggleCinematicMode() {
  cinematicMode = !cinematicMode;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

init();
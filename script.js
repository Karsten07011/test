let scene, camera, renderer, carModel;
let carSpeed = 400; // Increase the speed of the road
let clock, rainParticles = [], speedLines = [];
let roadSegments = [];
let otherCars = [];

function init() {
  // Create the scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a1a); // Set a dark background color

  // Create the camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 200, 800); // Set the camera position behind and above the car
  camera.lookAt(new THREE.Vector3(0, 0, 0)); // Look at the center of the scene

  // Create the renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true; // Enable shadow maps
  renderer.toneMapping = THREE.ACESFilmicToneMapping; // Enable RTX lighting
  renderer.toneMappingExposure = 1.25;
  document.body.appendChild(renderer.domElement);

  // Add lights
  const sunLight = new THREE.DirectionalLight(0xffffff, 1);
  sunLight.position.set(100, 100, -100).normalize();
  sunLight.castShadow = true; // Enable shadows for the light
  scene.add(sunLight);

  const ambientLight = new THREE.AmbientLight(0x333333);
  scene.add(ambientLight);

  // Generate initial road segments
  generateRoad();

  // Load the car model
  const mtlLoader = new THREE.MTLLoader();
  mtlLoader.load('Car3/material.lib', (materials) => {
    materials.preload();
    const objLoader = new THREE.OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.load('Car3/720S.obj', (model) => {
      model.scale.set(50, 50, 50); // Scale up the model to 2.5x its original size
      model.position.set(0, -50, 0); // Position the car on the road
      model.rotation.y = Math.PI; // Rotate the car 180 degrees
      model.castShadow = true; // Enable shadows for the car
      carModel = model;
      scene.add(model);
      console.log('Model loaded successfully');
    }, (xhr) => {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    }, (error) => {
      console.error('An error happened', error);
    });
  });

  // Load other cars
  loadOtherCars();

  // Create rain particles
  createRain();

  // Create speed lines
  createSpeedLines();

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

    // Add slight wiggle to the car
    if (carModel) {
      carModel.rotation.z = Math.sin(Date.now() * 0.01) * 0.025; // Reduce the wiggle by half

      // Move the car left to right and right to left
      carModel.position.x = Math.sin(Date.now() * 0.001) * 200;
    }

    // Move other cars
    otherCars.forEach((car, index) => {
      car.position.z += carSpeed;
      if (car.position.z > 1000) {
        car.position.z -= roadSegments.length * 1000;
      }
    });

    // Make the camera follow behind the car smoothly with cinematic shots and bobbing
    const carPosition = carModel ? carModel.position.clone() : new THREE.Vector3(0, -50, 0);
    const bobbing = Math.sin(Date.now() * 0.01) * 5;
    camera.position.lerp(new THREE.Vector3(carPosition.x, carPosition.y + 150 + bobbing, carPosition.z + 500), 0.1);
    camera.lookAt(carPosition);

    // Update speed lines
    updateSpeedLines();

    // Update rain particles
    updateRain();

    // Render the scene
    renderer.render(scene, camera);
  }

  animate();
}

function generateRoad() {
  const trackMaterial = new THREE.MeshStandardMaterial({ map: new THREE.TextureLoader().load('textures/Road.jpg') });
  let currentPosition = roadSegments.length > 0 ? roadSegments[roadSegments.length - 1].position.clone() : new THREE.Vector3(0, -50, -10000);
  let currentDirection = new THREE.Vector3(0, 0, 1);

  for (let i = 0; i < 20; i++) {
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

function loadOtherCars() {
  const mtlLoader = new THREE.MTLLoader();
  mtlLoader.load('Car3/material.lib', (materials) => {
    materials.preload();
    const objLoader = new THREE.OBJLoader();
    objLoader.setMaterials(materials);
    for (let i = 0; i < 5; i++) {
      objLoader.load('Car3/720S.obj', (model) => {
        model.scale.set(20, 20, 20); // Scale the other cars to a smaller size
        model.position.set((i % 2 === 0 ? -200 : 200), -50, -1000 * (i + 1)); // Position the other cars
        model.rotation.y = Math.PI; // Rotate the car 180 degrees
        model.castShadow = true; // Enable shadows for the car
        otherCars.push(model);
        scene.add(model);
      });
    }
  });
}

function createRain() {
  const rainGeometry = new THREE.BufferGeometry();
  const rainCount = 5000; // Reduce the amount of rain
  const rainVertices = [];

  for (let i = 0; i < rainCount; i++) {
    const x = Math.random() * 2000 - 1000;
    const y = Math.random() * 1000;
    const z = Math.random() * 2000 - 1000;
    rainVertices.push(x, y, z);
  }

  rainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(rainVertices, 3));

  const rainMaterial = new THREE.PointsMaterial({
    color: 0xaaaaaa,
    size: 0.1,
    transparent: true
  });

  const rain = new THREE.Points(rainGeometry, rainMaterial);
  scene.add(rain);
  rainParticles.push(rain);
}

function updateRain() {
  rainParticles.forEach(particle => {
    const positions = particle.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] -= 20; // Move the rain 2x faster
      positions[i + 2] += carSpeed * 0.2; // Make the rain go backwards 2x faster
      if (positions[i + 1] < 0) {
        positions[i + 1] = 1000;
      }
    }
    particle.geometry.attributes.position.needsUpdate = true;
  });
}

function createSpeedLines() {
  const speedLineGeometry = new THREE.BufferGeometry();
  const speedLineCount = 1000;
  const speedLineVertices = [];

  for (let i = 0; i < speedLineCount; i++) {
    const x = Math.random() * 2000 - 1000;
    const y = Math.random() * 1000;
    const z = Math.random() * 2000 - 1000;
    speedLineVertices.push(x, y, z);
  }

  speedLineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(speedLineVertices, 3));

  const speedLineMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.2,
    transparent: true
  });

  const speedLine = new THREE.Points(speedLineGeometry, speedLineMaterial);
  scene.add(speedLine);
  speedLines.push(speedLine); // Correctly push the speedLine into the array
}

function updateSpeedLines() {
  speedLines.forEach(line => {
    const positions = line.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 2] += carSpeed * 0.2; // Move the speed lines backwards 2x faster
      if (positions[i + 2] > 1000) {
        positions[i + 2] = -1000;
      }
    }
    line.geometry.attributes.position.needsUpdate = true;
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

init();
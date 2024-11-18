let bastionModel; // Variable to store the loaded model
let angle = 0; // Variable to store the rotation angle

function preload() {
  // Load the OBJ model with textures
  bastionModel = loadModel('bastion.obj', true); // The second parameter ensures the MTL file is loaded
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL); // Enable 3D mode
  noStroke(); // Remove visible vertices for smoothness
}

function draw() {
  background(180); // Light gray background

  // Position the model closer to the camera
  translate(0, 100, 200);

  // Correct the orientation of the model
  rotateX(PI); // Rotate 180 degrees around the X-axis

  // Rotate the model slowly
  rotateY(angle);
  angle += 0.01; // Increment the angle for slow rotation

  // Display the loaded model
  scale(2); // Adjust the scale to make it larger
  model(bastionModel);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
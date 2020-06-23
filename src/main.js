/***********************************************
 * School model visualization preview main file
 ***********************************************/

/* CSS styles import */
import './styles.css';

/* Three.js library import */
import * as THREE from 'three';

/* Orbit controls import */
import { OrbitControls } from 'three-orbitcontrols/OrbitControls.js';

/* .GLTF model loader import */
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

/* Loading manager for resources and its functions */
const manager = new THREE.LoadingManager();
manager.onStart = function () {
  const barContainer = document.createElement('div');
  barContainer.style.cssText = `
    text-align: center;
    width: 200px;
    background-color: black;
    border-radius: 13px;
    padding: 3px;
  `;
  barContainer.id = 'progressContainer';
  barContainer.innerHTML = '<p style="color: white; margin: none"> Loading resources... </p>';
  const barProgress = document.createElement('div');
  barProgress.style.cssText = `
    background-color: blue;
    border-radius: 10px;
  `;
  barProgress.style.width = '10%';
  barProgress.style.height = '25%';
  barProgress.id = 'progress';
  barContainer.appendChild(barProgress);
  document.getElementById('main').appendChild(barContainer);

  document.getElementById('canvas').style.cursor = 'wait';
};
manager.onProgress = function (item, loaded, total) {
  document.getElementById('progress').style.width = `${loaded / total * 100}%`;
};
manager.onLoad = function () {
  const bar = document.getElementById('progressContainer');
  bar.parentNode.removeChild(bar);

  document.getElementById('canvas').style.cursor = 'grab';
};

/* Main drawing context representation class */
class Drawer {
  constructor (canvas) {
    this.scene = new THREE.Scene();

    this.bgScene = new THREE.Scene();
    const loader = new THREE.TextureLoader(manager);
    const texture = loader.load('./bin/sky.jpg');
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;

    const shader = THREE.ShaderLib.equirect;
    const material = new THREE.ShaderMaterial({
      fragmentShader: shader.fragmentShader,
      vertexShader: shader.vertexShader,
      uniforms: shader.uniforms,
      depthWrite: false,
      side: THREE.BackSide
    });
    material.uniforms.tEquirect.value = texture;
    const plane = new THREE.BoxBufferGeometry(2, 2, 2);
    this.bgMesh = new THREE.Mesh(plane, material);
    this.bgScene.add(this.bgMesh);

    this.camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 0.1, 3000);
    this.camera.position.set(470, 180, 180);

    this.controls = new THREE.OrbitControls(this.camera, canvas);
    this.controls.enableKeys = false;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.controls.minDistance = 200;
    this.controls.maxDistance = 800;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;

    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true
    });
    this.renderer.autoClearColor = false;
    this.renderer.setSize(canvas.width, canvas.height);
  }

  /* Initialize drawing context method */
  init () {
    // Lights
    const ambLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xffffff);
    dirLight.position.set(1030, 515, 0);
    this.scene.add(dirLight);

    // Plane
    const loader = new THREE.TextureLoader(manager);
    const texture = loader.load('./bin/map.png');
    const alphamap = loader.load('./bin/alphamap.jpg');
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(1030, 1030),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaMap: alphamap
      })
    );
    plane.rotateX(-Math.PI / 2);
    this.scene.add(plane);

    // School building
    let school = new THREE.Object3D();
    const pr = new Promise((resolve, reject) => {
      const gltfLoader = new GLTFLoader(manager);
      gltfLoader.load('./bin/school/low.glb', (gltf) => {
        const root = gltf.scene;
        root.children[0].material = new THREE.MeshPhongMaterial({ color: 0xcdcdcd });
        root.rotateY(-Math.PI / 2);
        root.position.add(new THREE.Vector3(0, 0, -7));
        school = root;
        school.name = 'school';
        this.scene.add(school);
        resolve(gltf.scene);
      });
    });
    pr.then((scene) => {
      const gltfLoader = new GLTFLoader(manager);
      return new Promise((resolve, reject) => {
        gltfLoader.load('./bin/school/high.glb', (gltf) => {
          const root = gltf.scene;
          root.children[0].material = new THREE.MeshPhongMaterial({ color: 0xcdcdcd });
          root.rotateY(-Math.PI / 2);
          root.position.add(new THREE.Vector3(4, 16, 39));
          school = root;
          this.scene.remove(this.scene.getObjectByName('school'));
          this.scene.add(school);
          resolve(gltf.scene);
        });
      });
    });
  }

  /* Render method */
  render () {
    this.controls.update();
    this.bgMesh.position.copy(this.camera.position);
    this.renderer.render(this.bgScene, this.camera);
    this.renderer.render(this.scene, this.camera);
  }

  /* Update renderer method */
  update (canvas) {
    this.renderer.setSize(canvas.width, canvas.height);
  }
}

/* Main program drawing context */
let drawer;

/* Main render function */
function render () {
  window.requestAnimationFrame(render);

  drawer.render();
}

/* Start render function */
function threejsStart () {
  const canvas = document.getElementById('canvas');
  drawer = new Drawer(canvas);

  drawer.init();
  resize();
  render();
}

/* Resize all HTML elements on the page function */
function resizeAll () {
  const canvas = document.getElementById('canvas');
  let canvasRect = canvas.getBoundingClientRect();
  const side = Math.min(window.innerWidth - canvasRect.left - 21, window.innerHeight - canvasRect.top - 21);
  canvas.width = side >= 700 ? 700 : side;
  canvas.height = side >= 700 ? 700 : side;
  drawer.update(canvas);
  canvasRect = canvas.getBoundingClientRect();

  const button = document.getElementById('button');
  button.style.width = `${canvasRect.width / 4}px`;
  button.style.height = `${canvasRect.height / 25}px`;
  button.style['font-size'] = `${canvasRect.height / 50}px`;
  const buttonRect = button.getBoundingClientRect();
  button.style.position = 'absolute';
  button.style.left = `${canvasRect.left + canvasRect.width - buttonRect.width}px`;
  button.style.top = `${canvasRect.top + canvasRect.height - buttonRect.height}px`;

  const progressBar = document.getElementById('progressContainer');
  if (progressBar) {
    progressBar.style.width = `${canvasRect.width / 3}px`;
    progressBar.style.height = `${canvasRect.height / 10}px`;
    progressBar.style['font-size'] = `${canvasRect.height / 40}px`;
    const barRect = progressBar.getBoundingClientRect();
    progressBar.style.position = 'absolute';
    progressBar.style.left = `${canvasRect.left + canvasRect.width / 2 - barRect.width / 2}px`;
    progressBar.style.top = `${canvasRect.top + canvasRect.height * 2 / 3 - barRect.height / 2}px`;
  }
}

/* Resize function */
function resize () {
  resizeAll();
  resizeAll();
}

/* Add event handle for dynamically updating objects */
document.addEventListener('DOMContentLoaded', threejsStart);
window.onresize = resize;

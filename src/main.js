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

/* Load GLTF model function */
function loadGLTF (url, callback) {
  const loader = new GLTFLoader();
  return new Promise(function (resolve, reject) {
    loader.load(url, (gltf) => {
      callback(gltf);
      resolve(gltf.scene);
    });
  });
}

/* Main drawing context representation class */
class Drawer {
  constructor (canvas) {
    this.scene = new THREE.Scene();

    this.bgScene = new THREE.Scene();
    const loader = new THREE.TextureLoader();
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
    const loader = new THREE.TextureLoader();
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
    const pr = loadGLTF('./bin/school/low.glb', (gltf) => {
      const root = gltf.scene;
      root.children[0].material = new THREE.MeshPhongMaterial({ color: 0xcdcdcd });
      root.rotateY(-Math.PI / 2);
      root.position.add(new THREE.Vector3(0, 0, -7));
      school = root;
      school.name = 'school';
      this.scene.add(school);
    });
    pr.then((scene) => {
      return loadGLTF('./bin/school/high.glb', (gltf) => {
        const root = gltf.scene;
        root.children[0].material = new THREE.MeshPhongMaterial({ color: 0xcdcdcd });
        root.rotateY(-Math.PI / 2);
        root.position.add(new THREE.Vector3(4, 16, 39));
        school = root;
        this.scene.remove(this.scene.getObjectByName('school'));
        this.scene.add(school);
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
  render();
}

/* Add event handle for dynamically updating objects */
document.addEventListener('DOMContentLoaded', threejsStart);

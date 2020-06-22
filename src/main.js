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
    this.scene.background = new THREE.Color(0x00ffff);
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
      './bin/skybox/neg-x.png',
      './bin/skybox/pos-x.png',
      './bin/skybox/pos-y.png',
      './bin/skybox/neg-y.png',
      './bin/skybox/pos-z.png',
      './bin/skybox/neg-z.png'
    ]);
    this.scene.background = texture;

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
    const texture = new THREE.TextureLoader().load('./bin/map.png');
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(1030, 1030),
      new THREE.MeshPhongMaterial({ map: texture })
    );
    plane.rotateX(-Math.PI / 2);
    this.scene.add(plane);

    // School building
    let school = new THREE.Object3D();
    const pr = loadGLTF('./bin/school/low.glb', (gltf) => {
      const root = gltf.scene;
      root.children[0].material = new THREE.MeshPhongMaterial({ color: 0xcdcdcd });
      root.rotateY(-Math.PI / 3);
      root.position.add(new THREE.Vector3(16, 0, 9));
      school = root;
      school.name = 'school';
      this.scene.add(school);
    });
    pr.then((scene) => {
      return loadGLTF('./bin/school/high.glb', (gltf) => {
        const root = gltf.scene;
        root.children[0].material = new THREE.MeshPhongMaterial({ color: 0xcdcdcd });
        root.rotateY(-Math.PI / 3);
        root.position.add(new THREE.Vector3(40, 16, 47));
        school = root;
        this.scene.remove(this.scene.getObjectByName('school'));
        this.scene.add(school);
      });
    });
  }

  /* Render method */
  render () {
    this.controls.update();
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

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

/* Main drawing context representation class */
class Drawer {
  constructor (canvas) {
    this.scene = new THREE.Scene();
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
      './bin/skybox/pos-z.png',
      './bin/skybox/neg-z.png',
      './bin/skybox/pos-y.png',
      './bin/skybox/neg-y.png',
      './bin/skybox/pos-x.png',
      './bin/skybox/neg-x.png'
    ]);
    this.scene.background = texture;

    this.camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 0.1, 100);
    this.camera.position.set(0, 8, 26);

    this.controls = new THREE.OrbitControls(this.camera, canvas);
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 47;

    this.renderer = new THREE.WebGLRenderer({ canvas: canvas });
    this.renderer.autoClearColor = false;
    this.renderer.setSize(canvas.width, canvas.height);
    /*
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMapSoft = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    */
  }

  /* Initialize drawing context method */
  init () {
    // Plane
    const texture = new THREE.TextureLoader().load('./bin/map.png');
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshBasicMaterial({ map: texture })
    );
    plane.rotateX(-Math.PI / 2);
    this.scene.add(plane);

    // Test cube sample
    const test = new THREE.Mesh(
      new THREE.CubeGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({
        color: 0xff0000,
        wireframe: true
      })
    );
    test.position.set(0, 0.51, 0);
    this.scene.add(test);
  }

  /* Interframe response method */
  response () {
  }

  /* Render method */
  render () {
    this.renderer.render(this.scene, this.camera);
  }
}

/* Main program drawing context */
let drawer;

/* Main render function */
function render () {
  window.requestAnimationFrame(render);

  drawer.response();
  drawer.render();
}

/* Start render function */
function threejsStart () {
  const canvas = document.getElementById('main-canvas');
  drawer = new Drawer(canvas);

  drawer.init();
  render();
}

/* Add event handle for dynamically updating objects */
document.addEventListener('DOMContentLoaded', threejsStart);

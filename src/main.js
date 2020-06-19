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
/* import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'; */

/* Main drawing context representation class */
class Drawer {
  constructor (canvas) {
    this.scene = new THREE.Scene();
    this.bgScene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 0.1, 100);
    this.camera.position.set(3, 3, 3);

    this.controls = new THREE.OrbitControls(this.camera, canvas);

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
    // Add sky wrapping background
    /*
    const loader = new THREE.TextureLoader();
    const texture = loader.load('../bin/sky_bg.jpg');
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
    const bg = new THREE.BoxBufferGeometry(2, 2, 2);
    this.bgMesh = new THREE.Mesh(bg, material);
    this.bgScene.add(this.bgMesh);
    */
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
      './bin/pos-z.png',
      './bin/neg-z.png',
      './bin/pos-y.png',
      './bin/neg-y.png',
      './bin/pos-x.png',
      './bin/neg-x.png'
    ]);
    this.scene.background = texture;

    // Test cube sample
    const test = new THREE.Mesh(
      new THREE.CubeGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true
      })
    );
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

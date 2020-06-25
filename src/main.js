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

/* Import dat.gui library */
import dat from 'dat.gui';

/* Import basement shaders text */
import vShader from './base.vert';
import fShader from './base.frag';

/* Buildings metadata file import */
import buildings from '../bin/buildings.json';

/* Buildings global parameters */
const buildParams = {
  near: 100,
  far: 600,
  pow: 2,
  color: 0x91fff2,
  wireColor: 0x4030ff,
  opacity: 0.6
};

/* Building representation class */
class Building {
  constructor (x0, y0, x1, y1, h) {
    this.geom = new THREE.CubeGeometry(Math.abs(x1 - x0), h, Math.abs(y1 - y0));
    this.geom.translate((x0 + x1) / 2, h / 2 + 1, (y0 + y1) / 2);

    this.wire = new THREE.CubeGeometry(Math.abs(x1 - x0), h, Math.abs(y1 - y0));
    this.wire.translate((x0 + x1) / 2, h / 2 + 1, (y0 + y1) / 2);
  }

  /* Extract buildings from string method */
  static extract (string) {
    try {
      const data = Object.values(string);
      for (let i = 0; i < data.length; i++) {
        data[i] = new Building(data[i].x0, data[i].y0, data[i].x1, data[i].y1, data[i].height);
      }
      return data;
    } catch (e) {
      throw new Error(`Oops, incorrect JSON: ${e.message}`);
    }
  }

  /* Transfrom to group method */
  toGroup () {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: new THREE.Uniform(new THREE.Vector3(
          ((buildParams.color & 0xff0000) >> 16) / 255,
          ((buildParams.color & 0x00ff00) >> 8) / 255,
          (buildParams.color & 0x0000ff) / 255
        )),
        opacity: { value: buildParams.opacity },
        fadeNear: { value: buildParams.near },
        fadeFar: { value: buildParams.far },
        fadeParam: { value: buildParams.pow },
        isTex: { value: false }
      },
      vertexShader: vShader,
      fragmentShader: fShader,
      blending: THREE.NormalBlending,
      transparent: true
    });
    const wireMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: new THREE.Uniform(new THREE.Vector3(
          ((buildParams.wireColor & 0xff0000) >> 16) / 255,
          ((buildParams.wireColor & 0x00ff00) >> 8) / 255,
          (buildParams.wireColor & 0x0000ff) / 255
        )),
        opacity: { value: buildParams.opacity },
        fadeNear: { value: buildParams.near },
        fadeFar: { value: buildParams.far },
        fadeParam: { value: buildParams.pow },
        isTex: { value: false }
      },
      vertexShader: vShader,
      fragmentShader: fShader,
      blending: THREE.NormalBlending,
      transparent: true,
      wireframe: true
    });

    const group = new THREE.Group();
    group.add(new THREE.Mesh(this.geom, material));
    const wire = new THREE.Mesh(this.wire, wireMaterial);
    wire.name = 'wire';
    group.add(wire);
    return group;
  }
}

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
    const plane = new THREE.BoxBufferGeometry(3, 3, 3);
    this.bgMesh = new THREE.Mesh(plane, material);
    this.bgScene.add(this.bgMesh);

    this.camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 1, 3000);
    this.camera.position.set(430, 270, 430);

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
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.setSize(canvas.width, canvas.height);

    this.gui = new dat.GUI();
  }

  /* Initialize drawing context method */
  init () {
    // Light
    const ambLight = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(ambLight);

    // Plane
    const loader = new THREE.TextureLoader(manager);
    const texture = loader.load('./bin/map.png');
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(1030, 1030),
      new THREE.ShaderMaterial({
        uniforms: {
          opacity: { value: 1.0 },
          tex: { value: texture },
          fadeNear: { value: buildParams.near },
          fadeFar: { value: buildParams.far },
          fadeParam: { value: buildParams.pow },
          isTex: { value: true }
        },
        vertexShader: vShader,
        fragmentShader: fShader,
        blending: THREE.NormalBlending,
        transparent: true
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
        root.children[0].material = new THREE.MeshBasicMaterial();
        root.rotateY(-Math.PI / 2);
        root.position.add(new THREE.Vector3(1, 0, -7));
        root.scale.set(1.07, 1.07, 1.07);
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
          root.children[0].material = new THREE.MeshBasicMaterial();
          root.rotateY(-Math.PI / 2);
          root.position.add(new THREE.Vector3(-45, 1, -14));
          root.scale.set(1.05, 1.05, 1.05);
          school = root;
          this.scene.remove(this.scene.getObjectByName('school'));
          this.scene.add(school);
          resolve(gltf.scene);
        });
      });
    });

    // Buildings
    this.buildings = Building.extract(buildings);
    for (let i = 0; i < this.buildings.length; i++) {
      this.buildings[i] = this.buildings[i].toGroup();
      this.scene.add(this.buildings[i]);
    }

    // dat.GUI fields
    this.gui.add(buildParams, 'near', 0, 700).step(10);
    this.gui.add(buildParams, 'far', 0, 1000).step(10);
    this.gui.add(buildParams, 'pow', 0, 5).step(0.1);
    this.gui.addColor(buildParams, 'color');
    this.gui.addColor(buildParams, 'wireColor');
    this.gui.add(buildParams, 'opacity', 0, 1).step(0.01);
  }

  /* Render method */
  render () {
    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh &&
          child.material.type === 'ShaderMaterial') {
        child.material.uniforms.fadeNear.value = buildParams.near;
        child.material.uniforms.fadeFar.value = buildParams.far;
        child.material.uniforms.fadeParam.value = buildParams.pow;

        if (child.name !== 'wire') {
          child.material.uniforms.color = new THREE.Uniform(new THREE.Vector3(
            ((buildParams.color & 0xff0000) >> 16) / 255,
            ((buildParams.color & 0x00ff00) >> 8) / 255,
            (buildParams.color & 0x0000ff) / 255
          ));
        } else {
          child.material.uniforms.color = new THREE.Uniform(new THREE.Vector3(
            ((buildParams.wireColor & 0xff0000) >> 16) / 255,
            ((buildParams.wireColor & 0x00ff00) >> 8) / 255,
            (buildParams.wireColor & 0x0000ff) / 255
          ));
        }
        child.material.uniforms.opacity.value = buildParams.opacity;
        child.material.needsUpdate = true;
      }
    });

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

/* Resize all required HTML elements on the page function */
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
    progressBar.style.top = `${canvasRect.top + canvasRect.height * 3 / 4 - barRect.height / 2}px`;
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

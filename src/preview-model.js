// Three.js
import * as THREE from "three";

// glTF model loader
import { GLTFLoader } from "gltf-loader";

// Render requirements
import { EffectComposer } from "effect-composer";
import { ShaderPass } from "shader-pass";
import { FXAAShader } from "fxaa-shader";

// Custom outline
import { CustomOutlinePass } from '../src/CustomOutlinePass.js';


let scene, camera, renderer, composer, customOutline, effectFXAA, objects, areModelsLoaded, clock, time, mouse, picker, hovered, portfolioItems;

function SetObjectVisibility(object, visible) {
    object.visible = visible;
}

function PortfolioItem(id, element, object) {
    this.id = id;
    this.element = element;
    this.object = object;
}

const dimensions = () => {
    return {
        width: 326,
        height: (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) - 260,
    };
};

class ObjectPicker {
    constructor() {
        this.raycaster = new THREE.Raycaster();
        this.picked = null;
    }

    refreshCursor() {
        if (this.picked) document.body.style.cursor = 'pointer';
        else document.body.style.cursor = 'default';
    }

    pick(normalizedPosition, scene, camera) {
        let pickedObject = null;

        // Cast a ray through the frustum
        this.raycaster.setFromCamera(normalizedPosition, camera);

        // Get the list of objects the ray intersected
        const intersectedObjects = this.raycaster.intersectObjects(scene.children, true);

        if (intersectedObjects.length) {
            // Pick the first object. It's the closest one
            pickedObject = intersectedObjects[0].object.parent;
        }

        this.picked = pickedObject;

        this.refreshCursor();
    }
}

function onWindowResize() {
    camera.aspect = dimensions().width / dimensions().height;
    camera.updateProjectionMatrix();

    renderer.setSize(dimensions().width, dimensions().height);
    composer.setSize(dimensions().width, dimensions().height);
    effectFXAA.setSize(dimensions().width, dimensions().height);
    customOutline.setSize(dimensions().width, dimensions().height);
}

function onDocumentMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / dimensions().width) * 2 - 1;
    mouse.y = -(event.clientY / dimensions().height) * 2 + 1;
}

function loadGLTF(path) {
    return new Promise(resolve => {
        new GLTFLoader().load('../models/' + path, resolve);
    });
}

function isElementHovered(element) {
    return element == element.parentElement.querySelector(":hover");
}

function init() {
    // Timer
    clock = new THREE.Clock();
    time = 0;

    // Controller
    mouse = new THREE.Vector2();
    picker = new ObjectPicker();
    hovered = 0;

    // Canvas
    const canvas = document.querySelector('canvas.webgl');

    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(55, dimensions().width / dimensions().height, 0.1, 1000);
    camera.position.z = 6;
    scene.add(camera);

    // Renderer
    renderer = new THREE.WebGLRenderer({
        canvas: canvas
    });
    renderer.setSize(dimensions().width, dimensions().height);
    //renderer.setPixelRatio(window.devicePixelRatio);

    // Composer (renderer with post-processing)
    const depthTexture = new THREE.DepthTexture();
    const renderTarget = new THREE.WebGLRenderTarget(
        dimensions().width,
        dimensions().height,
        {
            depthTexture: depthTexture,
            depthBuffer: true
        }
    );
    composer = new EffectComposer(renderer, renderTarget);


    // 1) Render pass
    // Skipping the regular render pass as to only render a custom outline.

    // 2) Post processing
    // Outline pass
    customOutline = new CustomOutlinePass(
        new THREE.Vector2(dimensions().width, dimensions().height),
        scene,
        camera
    );
    composer.addPass(customOutline);

    // 3) Declare Custom Outline uniforms
    const uniforms = customOutline.fsQuad.material.uniforms;
    uniforms.outlineColor.value.set(new THREE.Color(0xffffff));

    // Multiple scalar values packed into one uniform: Depth bias, depth multiplier, and same for normals
    uniforms.multiplierParameters.value.x = 0.25;
    uniforms.multiplierParameters.value.y = 10;
    uniforms.multiplierParameters.value.z = 1;
    uniforms.multiplierParameters.value.w = 0;

    // 4) Anti-alias pass
    effectFXAA = new ShaderPass(FXAAShader);
    effectFXAA.uniforms['resolution'].value.set(
        1 / dimensions().width,
        1 / dimensions().height
    );
    composer.addPass(effectFXAA);


    // Group
    objects = new THREE.Group();
    portfolioItems = [];

    // Load models
    let placeholder, worms, ann, scc, pde, mLabs, nBody;
    let promisePlaceholder = loadGLTF('question-mark-block.glb').then(gltf => { placeholder = gltf.scene; });
    let promiseWorms = loadGLTF('mitre.glb').then(gltf => { worms = gltf.scene; });
    let promiseANN = loadGLTF('robot.glb').then(gltf => { ann = gltf.scene; });
    let promiseSCC = promisePlaceholder;
    let promisePDE = loadGLTF('painting.glb').then(gltf => { pde = gltf.scene; });
    let promiseMLabs = loadGLTF('white-house.glb').then(gltf => { mLabs = gltf.scene; });
    let promiseNBody = loadGLTF('space-shuttle.glb').then(gltf => { nBody = gltf.scene; });

    // Set up the objects in their scenes, once all the models have loaded
    Promise.all([promiseWorms, promiseANN, promiseSCC, promisePDE, promiseMLabs, promiseNBody]).then(() => {
        scc = placeholder.clone(); // TODO: Add model for SCC

        objects.add(worms, ann, scc, pde, mLabs, nBody);
        portfolioItems.push(new PortfolioItem('worms', document.getElementById('worms'), worms),
            new PortfolioItem('ann', document.getElementById('ann'), ann),
            new PortfolioItem('scc', document.getElementById('scc'), scc),
            new PortfolioItem('pde', document.getElementById('pde'), pde),
            new PortfolioItem('mLabs', document.getElementById('mLabs'), mLabs),
            new PortfolioItem('nBody', document.getElementById('nBody'), nBody));

        portfolioItems.forEach(item => SetObjectVisibility(item.object, false));

        // Add objects to scene
        objects.traverse(node => node.applyOutline = true);
        scene.add(objects);
        areModelsLoaded = true;

        // Portfolio Items
        portfolioItems.push(new PortfolioItem())
    });

    // Subscribe to events
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    window.addEventListener( 'resize', onWindowResize );
    onWindowResize();
}

function update() {
    requestAnimationFrame(update); // Only update when tab open
    if (!areModelsLoaded) return;

    // Update time
    let deltaTime = clock.getDelta();
    time += deltaTime;

    // Select button
    //isElementHovered();

    // Update mouse's selected object
    picker.pick(mouse, scene, camera);

    // Enlarge picked object
    const hoverRate = 0.5;
    if (picker.picked) hovered += hoverRate * deltaTime;
    else hovered -= hoverRate * deltaTime;

    hovered = THREE.MathUtils.clamp(hovered, 0, 0.05);
    let scale = 1 + hovered; // Scale between 1 and 1.05

    // Move and rotate the objects
    const speed = 1.5;
    const maximumDisplacement = 0.1;
    const angularSpeed = 0.5;
    objects.position.y = maximumDisplacement * Math.sin(time * speed);
    objects.rotation.y += deltaTime * angularSpeed;
    objects.scale.set(scale, scale, scale);

    composer.render();
}

init();
update();
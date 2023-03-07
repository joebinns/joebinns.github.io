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

// Portfolio item
import { PortfolioItem } from '../src/PortfolioItem.js'


let scene, camera, renderer, composer, customOutline, effectFXAA, objects, clock, time, mouse, picker, hoverRate, appearRate, overlay;

function easeOutElastic(t) {
    const c4 = (2 * Math.PI) / 3;

    return t === 0
        ? 0
        : t === 1
            ? 1
            : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

function SetObjectVisibility(object, visible) {
    object.visible = visible;
}

const dimensions = () => {
    return {
        width: 386,
        height: (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) - 232,
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
    if (element == null) return null;
    return element == element.parentElement.querySelector(":hover");
}

export class ModelPreviewer{
    constructor(portfolioItems) {
        this.portfolioItems = portfolioItems;
        this.Init();
        this.Update();
    }

    Init () {
        // Timer
        clock = new THREE.Clock();
        time = 0;

        // Controller
        mouse = new THREE.Vector2();
        picker = new ObjectPicker();
        hoverRate = 0.5;
        appearRate = 10;

        // Canvas
        const canvas = document.querySelector('canvas.webgl');

        // Overlay
        overlay = document.querySelector('overlay');

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

        // Set up the objects in their scenes, once all the models have loaded
        this.portfolioItems.forEach(item => {
            objects.add(item.object)
        });
        this.portfolioItems.forEach(item => SetObjectVisibility(item.object, false));

        // Identify any default item
        this.defaultItem = null;
        this.portfolioItems.forEach(item => {
            if (!item.element) this.defaultItem = item;
        });

        objects.traverse(node => node.applyOutline = true);
        scene.add(objects);

        // Subscribe to events
        document.addEventListener('mousemove', onDocumentMouseMove, false);
        window.addEventListener( 'resize', onWindowResize );
        onWindowResize();
    }

    Update () {
        requestAnimationFrame(()=>this.Update()); // Only update when tab open

        // Update time
        let deltaTime = clock.getDelta();
        time += deltaTime;

        // Set appeared per item
        let isAnyElementHovered = false;
        this.portfolioItems.forEach(item => {
            if (item.element) {
                if (isElementHovered(item.element)){
                    item.appeared += appearRate * deltaTime;
                    isAnyElementHovered = true;
                }
                else {
                    item.appeared -= appearRate * deltaTime;
                }
                item.appeared = THREE.MathUtils.clamp(item.appeared, 0, 1);
            }
        });

        if (this.defaultItem) {
            if (isAnyElementHovered) {
                this.defaultItem.appeared -= appearRate * deltaTime;
            }
            else {
                this.defaultItem.appeared += appearRate * deltaTime;
            }
            
            this.defaultItem.appeared = THREE.MathUtils.clamp(this.defaultItem.appeared, 0, 1);
        }

        // Set visibility per item
        this.portfolioItems.forEach(item => {
            if (item.appeared > 0) {
                SetObjectVisibility(item.object, true);
            }
            else {
                SetObjectVisibility(item.object, false);
            }
        });

        // Update mouse's selected object
        picker.pick(mouse, scene, camera);

        // Set hovered per item
        this.portfolioItems.forEach(item => {
            if (picker.picked == item.object) {
                item.hovered += hoverRate * deltaTime;
            }
            else {
                item.hovered -= hoverRate * deltaTime;
            }
            item.hovered = THREE.MathUtils.clamp(item.hovered, 0, 0.05);
        });

        // Scale the objects based on appeared and hovered
        this.portfolioItems.forEach(item => {
            let scale = item.appeared + item.hovered;
            //scale = easeOutElastic(scale);
            item.object.scale.set(scale, scale, scale); // Scale between 0 and 1.05
        });

        // Adjust overlay blur based on appeared
        let maxAppeared = 0;
        this.portfolioItems.forEach(item => {
            maxAppeared = Math.max(maxAppeared, item.appeared);
        });
        overlay.style.setProperty('--blur', 2 * (1 - maxAppeared) + 'px');

        // Move and rotate the objects
        const speed = 1.5;
        const maximumDisplacement = 0.1;
        const angularSpeed = 0.5;
        objects.position.y = maximumDisplacement * Math.sin(time * speed);
        objects.rotation.y += deltaTime * angularSpeed;

        composer.render();
    }
}

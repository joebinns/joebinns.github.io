// Three.js
import * as THREE from "three";

// Utilities
import { isElementHovered, cubicBezier } from '../src/Utilities.js';

// Render requirements
import { EffectComposer } from "effect-composer";
import { ShaderPass } from "shader-pass";
import { BloomPass } from "bloom-pass";

// Custom shaders
import { OutlinePass } from '../src/OutlinePass.js';
import { IntensityBasedCircleGridShader } from "../src/IntensityBasedCircleGridShader.js";


let scene, camera, renderer, composer, outline, bloom, intensityBasedCircleGrid, objects, clock, time, mouse, picker, hoverRate, appearRate, hovered, speed, maximumDisplacement, angularSpeed, defaultAngularSpeed, angularDamper, preview;

function SetObjectVisibility(object, visible) {
    object.visible = visible;
}

const dimensions = () => {
    return {
        width: shouldDisplayPreview() ? 386 : 0,
        height: shouldDisplayPreview() ? 386 : 0,
    };
};

class ObjectPicker {
    constructor() {
        this.raycaster = new THREE.Raycaster();
        this.picked = null;
    }

    refreshCursor() {
        if (this.picked) document.body.style.cursor = 'pointer';
        else document.body.style.cursor = 'auto';
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

export function shouldDisplayPreview() {
    return ((window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) > 800 &&
        ((window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) - 241 - 65) >= 386);
}

function onWindowResize() {
    const dimensions1 = dimensions();

    camera.aspect = dimensions1.width / dimensions1.height;
    camera.updateProjectionMatrix();

    preview.style.width = `${dimensions1.width}px`;
    preview.style.height = `${dimensions1.height}px`;

    renderer.setSize(dimensions1.width, dimensions1.height);
    composer.setSize(dimensions1.width, dimensions1.height);
    intensityBasedCircleGrid.setSize(dimensions1.width, dimensions1.height);
    outline.setSize(dimensions1.width, dimensions1.height);
    
    intensityBasedCircleGrid.uniforms.iResolution.value.set(
        dimensions1.width,
        dimensions1.height
    );
}

function onDocumentMouseMove(event) {
    mouse.x = (event.clientX / dimensions().width) * 2 - 1;
    mouse.y = -((event.clientY - 65) / dimensions().height) * 2 + 1;
}

function onDocumentMouseDown(event) {
    let object = picker.picked;
    if (object) {
        // Click
        angularSpeed += (defaultAngularSpeed * 25);
    }
}

export class ModelPreviewer{
    constructor(portfolioItems) {
        this.portfolioItems = portfolioItems;
        this.Init();
        this.Update();
    }

    Init() {
        // Timer
        clock = new THREE.Clock();
        time = 0;

        // Controller
        mouse = new THREE.Vector2();
        picker = new ObjectPicker();
        hoverRate = 10;
        appearRate = 8;
        hovered = 0;
        speed = 1.5;
        maximumDisplacement = 0.1;
        defaultAngularSpeed = 0.5;
        angularDamper = 2;
        angularSpeed = defaultAngularSpeed;

        // Model preview
        preview = document.querySelector('.model-preview');

        // Canvas
        const canvas = document.querySelector('canvas.webgl');

        // Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0f0f0f);

        // Camera
        camera = new THREE.PerspectiveCamera(55, dimensions().width / dimensions().height, 0.1, 10);
        camera.position.z = 6;
        scene.add(camera);

        // Renderer
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true
        });
        renderer.setSize(dimensions().width, dimensions().height);
        //renderer.setPixelRatio(window.devicePixelRatio);

        // Composer (renderer with post-processing)
        const renderTarget = new THREE.WebGLRenderTarget(
            dimensions().width,
            dimensions().height
        );
        composer = new EffectComposer(renderer, renderTarget);


        // Render pass
        // Skipping the regular render pass as to only render an outline.

        // Post processing
        // Outline
        outline = new OutlinePass(
            new THREE.Vector2(dimensions().width, dimensions().height),
            scene,
            camera
        );
        composer.addPass(outline);
        const uniforms = outline.fsQuad.material.uniforms;
        uniforms.outlineColor.value.set(new THREE.Color(0xffffff));
        const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        uniforms.isDarkMode.value = true;
        // Multiple scalar values packed into one uniform: Depth bias, depth multiplier
        uniforms.multiplierParameters.value.x = 0.5;
        uniforms.multiplierParameters.value.y = 50;
        
        // Bloom
        bloom = new BloomPass(1.5, 25, 4); // Strength, Kernel Size, Sigma
        composer.addPass(bloom);

        // Intensity Based Circle Grid
        intensityBasedCircleGrid = new ShaderPass(IntensityBasedCircleGridShader);
        intensityBasedCircleGrid.uniforms.IS_DARK_MODE.value = isDarkMode;
        composer.addPass(intensityBasedCircleGrid);

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

        scene.add(objects);

        // Subscribe to events
        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('mousedown', onDocumentMouseDown, false);
        window.addEventListener('resize', onWindowResize);
        onWindowResize();
    }

    Update () {
        requestAnimationFrame(()=>this.Update()); // Only update when tab open
        if (!shouldDisplayPreview()) return;

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
        if (picker.picked) {
            hovered += hoverRate * deltaTime;
        }
        else {
            hovered -= hoverRate * deltaTime;
        }
        hovered = THREE.MathUtils.clamp(hovered, 0, 1);

        // Scale the objects based on appeared and hovered
        this.portfolioItems.forEach(item => {
            let scale = item.appeared + 0.15 * cubicBezier(hovered);
            item.object.scale.set(scale, scale, scale);
        });

        // Decelerate angular speed
        angularSpeed -= deltaTime * angularSpeed * angularDamper;
        angularSpeed = Math.max(defaultAngularSpeed, angularSpeed);

        // Move and rotate the objects
        objects.position.y = maximumDisplacement * Math.sin(time * speed);
        objects.rotation.y += deltaTime * angularSpeed;


        composer.render();
    }
}

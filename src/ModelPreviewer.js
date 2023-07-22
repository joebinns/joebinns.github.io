// Three.js
import * as THREE from "three";

// Render requirements
import { EffectComposer } from "effect-composer";
import { ShaderPass } from "shader-pass";
import { FXAAShader } from "fxaa-shader";

// Custom outline
import { CustomOutlinePass } from '/src/CustomOutlinePass.js';


let scene, camera, renderer, composer, customOutline, effectFXAA, objects, clock, time, mouse, picker, hoverRate, appearRate, hovered, speed, maximumDisplacement, angularSpeed, defaultAngularSpeed, angularDamper, preview, portfolioVideo;

function SetObjectVisibility(object, visible) {
    object.visible = visible;
}

const dimensions = () => {
    return {
        width: 386,
        height: (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) - 241,
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

function onWindowResize() {
    camera.aspect = dimensions().width / dimensions().height;
    camera.updateProjectionMatrix();

    preview.style.width = `${dimensions().width}px`;
    preview.style.height = `${dimensions().height}px`;

    renderer.setSize(dimensions().width, dimensions().height);
    composer.setSize(dimensions().width, dimensions().height);
    effectFXAA.setSize(dimensions().width, dimensions().height);
    customOutline.setSize(dimensions().width, dimensions().height);
    effectFXAA.uniforms["resolution"].value.set(
        1 / dimensions().width,
        1 / dimensions().height
    );
}

function onDocumentMouseMove(event) {
    mouse.x = (event.clientX / dimensions().width) * 2 - 1;
    mouse.y = -(event.clientY / dimensions().height) * 2 + 1;
}

function onDocumentMouseDown(event) {
    let object = picker.picked;
    if (object) {
        // Click
        angularSpeed += (defaultAngularSpeed * 25);
    }
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
        // Portfolio video
        portfolioVideo = document.getElementById('portfoliovid');

        // Timer
        clock = new THREE.Clock();
        time = 0;

        // Controller
        mouse = new THREE.Vector2();
        picker = new ObjectPicker();
        hoverRate = 1;
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
        uniforms.backgroundColor.value.set(new THREE.Color(0x454545));

        // Multiple scalar values packed into one uniform: Depth bias, depth multiplier
        uniforms.multiplierParameters.value.x = 0.625;
        uniforms.multiplierParameters.value.y = 15;

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

        scene.add(objects);

        // Subscribe to events
        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('mousedown', onDocumentMouseDown, false);
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
                    item.isHovered = true;
                    item.appeared += appearRate * deltaTime;
                    isAnyElementHovered = true;
                }
                else {
                    item.isHovered = false;
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

        //
        this.portfolioItems.forEach(item => {
            if (item.isHovered != item.wasHovered){
                if (item.isHovered) {
                    portfolioVideo.src = '/videos/' + item.video;
                    portfolioVideo.load();
                }
                else {
                    portfolioVideo.src = '';
                }
            }
        });

        // Update was hovered
        this.portfolioItems.forEach(item => {
            item.wasHovered = item.isHovered;
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
        hovered = THREE.MathUtils.clamp(hovered, 0, 0.075);

        // Scale the objects based on appeared and hovered
        this.portfolioItems.forEach(item => {
            let scale = item.appeared + hovered;
            //scale = easeOutElastic(scale);
            item.object.scale.set(scale, scale, scale); // Scale between 0 and 1.05
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

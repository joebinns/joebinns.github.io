/*
Heyo! Congrats on finding this, please don't judge my mess ;)
*/

// Three.js
import * as THREE from "three";

// Utilities
import { isElementHovered } from '../src/Utilities.js';

// Render requirements
import { EffectComposer } from "effect-composer";
import { ShaderPass } from "shader-pass";

// Custom shaders
import { OutlinePass } from '../src/OutlinePass.js';
import { DepthMaskPass } from "../src/DepthMaskPass.js";
import { IntensityBasedCircleGridShader } from "../src/IntensityBasedCircleGridShader.js";

let scene, camera, renderer, composer, outline, depthMask, shockwaveTime, intensityBasedCircleGrid, objects, clock, time, mouse, picker, appearRate, speed, maximumDisplacement, targetYawVelocity, defaultAngularSpeed, preview, forceToApply, torqueToApply, targetPosition, targetRotation, velocity, angularVelocity;

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
        this.hitPoint = null;
        this.hitNormal = null;
    }

    refreshCursor() {
        if (this.picked) document.body.style.cursor = 'pointer';
        else document.body.style.cursor = 'auto';
    }

    pick(normalizedPosition, scene, camera) {
        let pickedObject = null;
        let hitPoint = null;
        let hitNormal = null;

        // Cast a ray through the frustum
        this.raycaster.setFromCamera(normalizedPosition, camera);

        // Get the list of objects the ray intersected
        const intersectedObjects = this.raycaster.intersectObjects(scene.children, true);

        if (intersectedObjects.length) {
            // Pick the first object. It's the closest one
            pickedObject = intersectedObjects[0].object.parent;
            hitPoint = intersectedObjects[0].point;
            hitNormal = intersectedObjects[0].normal;
        }

        this.picked = pickedObject;
        this.hitPoint = hitPoint;
        this.hitNormal = hitNormal;

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
    const dimensions1 = dimensions();
    mouse.x = (event.clientX / dimensions1.width) * 2 - 1;
    mouse.y = -((event.clientY - 65) / dimensions1.height) * 2 + 1;
}

function onDocumentMouseDown(event) {
    let object = picker.picked;
    if (object) {
        var forceMagnitude = 15.0;
        var force = new THREE.Vector3(0, 0, 1).multiplyScalar(-forceMagnitude);
        AddForceAtPosition(force, picker.hitPoint);
        shockwaveTime = 0;
    }
}

function onDocumentMouseUp(event) {
}

function AddForceAtPosition(force, position)
{
    forceToApply.add(force);
    torqueToApply.add((position.sub(objects.position)).cross(force));
}

function lerp(a, b, alpha)
{
    return a + alpha * ( b - a );
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
        shockwaveTime = 10;

        // Controller
        mouse = new THREE.Vector2(-100, -100);
        picker = new ObjectPicker();
        appearRate = 8;
        speed = 1.5;
        maximumDisplacement = 0.1;
        defaultAngularSpeed = 0.05;
        targetYawVelocity = defaultAngularSpeed;
        forceToApply = new THREE.Vector3(0, 0, 0);
        torqueToApply = new THREE.Vector3(0, 0, 0);
        targetPosition = new THREE.Vector3(0, 0, 0);
        targetRotation = new THREE.Vector3(0, 0, 0);
        velocity = new THREE.Vector3(0, 0, 0);
        angularVelocity = new THREE.Vector3(0, targetYawVelocity, 0);

        // Model preview
        preview = document.querySelector('.model-preview');

        // Canvas
        const canvas = document.querySelector('canvas.webgl');

        // Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x090909);

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
        renderTarget.depthBuffer = true;
        renderTarget.depthTexture = new THREE.DepthTexture();
        renderTarget.depthTexture.type = THREE.UnsignedShortType;
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
        //composer.addPass(outline);
        const outlineUniforms = outline.fsQuad.material.uniforms;
        outlineUniforms.outlineColor.value.set(new THREE.Color(0xffffff));
        const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        outlineUniforms.isDarkMode.value = true; // TODO: Uhhr, why is this set always true?
        // Multiple scalar values packed into one uniform: Depth bias, depth multiplier
        outlineUniforms.multiplierParameters.value.x = 0.5;
        outlineUniforms.multiplierParameters.value.y = 50;

        // Depth Mask
        depthMask = new DepthMaskPass(
            new THREE.Vector2(dimensions().width, dimensions().height),
            scene,
            camera
        );
        composer.addPass(depthMask);

        // Intensity Based Circle Grid
        intensityBasedCircleGrid = new ShaderPass(IntensityBasedCircleGridShader);
        intensityBasedCircleGrid.uniforms.IS_DARK_MODE.value = isDarkMode;
        //composer.addPass(intensityBasedCircleGrid);

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
        document.addEventListener('mouseup', onDocumentMouseUp, false);
        window.addEventListener('resize', onWindowResize);
        onWindowResize();
    }

    Update () {
        requestAnimationFrame(()=>this.Update()); // Only update when tab open
        if (!shouldDisplayPreview()) return;

        // Update time
        let deltaTime = clock.getDelta();
        time += deltaTime;
        shockwaveTime += deltaTime;

        intensityBasedCircleGrid.uniforms.iTime.value = shockwaveTime;
        intensityBasedCircleGrid.uniforms.iMouse.value.set(
            mouse.x,
            mouse.y
        );

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

        // Scale the objects based on appeared
        this.portfolioItems.forEach(item => {
            let scale = item.appeared;
            item.object.scale.set(scale, scale, scale);
        });

        targetYawVelocity = defaultAngularSpeed * (angularVelocity.y >= 0.0 ? 1.0 : -1.0);
        targetPosition.y = maximumDisplacement * Math.sin(time * speed);

        // Linear oscillator
        let stiffness = -0.5;
        let damper = -0.25;
        let mass = 1.0;
        var position = objects.position.clone();
        var displacement = position.clone().sub(targetPosition);
        let restorativeForce = displacement.multiplyScalar(stiffness)
        let dampingForce = velocity.clone().multiplyScalar(damper);
        forceToApply.add(restorativeForce);
        forceToApply.add(dampingForce);
        var acceleration = forceToApply.divideScalar(mass);
        deltaTime = 0.100;
        var deltaVelocity = acceleration.clone().multiplyScalar(deltaTime);
        velocity.add(deltaVelocity);   
        var deltaPosition = velocity.clone().multiplyScalar(deltaTime)
        position.add(deltaPosition);
        forceToApply = new THREE.Vector3(0, 0, 0);

        // Torsional oscillator
        let torsionalStiffness = -0.5;
        let torsionalDamper = -0.25;
        var rotation = new THREE.Vector3(objects.rotation.x, objects.rotation.y, objects.rotation.z);
        var torsionalDisplacement = rotation.clone().sub(targetRotation);
        let restorativeTorque = torsionalDisplacement.multiplyScalar(torsionalStiffness);
        restorativeTorque.y = 0.0;
        let dampingTorque = angularVelocity.clone().multiplyScalar(torsionalDamper);
        dampingTorque.y = 0.0;
        torqueToApply.x *= 0.3;
        torqueToApply.add(restorativeTorque);
        torqueToApply.add(dampingTorque);
        var torsionalAcceleration = torqueToApply.divideScalar(mass);
        var deltaAngularVelocity = torsionalAcceleration.clone().multiplyScalar(deltaTime);
        angularVelocity.add(deltaAngularVelocity);

        let fixedProgress = 0.15;
        angularVelocity.y = lerp(angularVelocity.y, targetYawVelocity, 1.0 - Math.pow(1.0 - fixedProgress, deltaTime));

        var deltaRotation = angularVelocity.clone().multiplyScalar(deltaTime);
        rotation.add(deltaRotation);
        torqueToApply = new THREE.Vector3(0, 0, 0);
        
        // Move and rotate the objects 
        objects.position.set(position.x, position.y, position.z);
        objects.rotation.set(rotation.x, rotation.y, rotation.z);

        // Render final scene
        composer.render();
    }
}

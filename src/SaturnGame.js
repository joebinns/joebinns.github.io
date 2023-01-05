/* ----------------------------- Import scripts ----------------------------- */
// Three.js
import * as THREE from "three"; //'https://unpkg.com/three/build/three.module.js';
// glTF model loader
import { GLTFLoader } from "gltfloader"; //'https://unpkg.com/three/examples/jsm/loaders/GLTFLoader.js';
// Render requirements
import { EffectComposer } from "effectcomposer"; //'https://unpkg.com/three/examples/jsm/postprocessing/EffectComposer.js';
import { ShaderPass } from "shaderpass"; //'https://unpkg.com/three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from "fxaashader"; //'https://unpkg.com/three/examples/jsm/shaders/FXAAShader.js';
// Custom outline
import { CustomOutlinePass } from './CustomOutlinePass.js';
// Audio
import { Audio } from "audio"; //'https://unpkg.com/three/src/audio/Audio.js';
import { AudioLoader } from "audioloader"; //'https://unpkg.com/three/src/loaders/AudioLoader.js';
import { AudioListener } from "audiolistener"; //'https://unpkg.com/three/src/audio/AudioListener.js';

/*
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass';
import {FXAAShader} from 'three/examples/jsm/shaders/FXAAShader';

import {CustomOutlinePass} from './CustomOutlinePass.js'; // CustomOutlinePass has imports that need fixing...
*/


/* ---------------------------- Declare scenes --------------------------- */
const visualScene = new THREE.Scene();

/* ---------------------------- Setup the camera ---------------------------- */
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 7.5;


/* -------------------------- Setup the renderer -------------------------- */
const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({canvas});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio); // Adjust pixel ratio (to improve mobile quality)
document.body.appendChild(renderer.domElement);
const renderTarget = new THREE.WebGLRenderTarget(
    window.innerWidth,
    window.innerHeight
);


/* ---------- Setup the composer (renderer with post processing) ---------- */
const composer = new EffectComposer(renderer, renderTarget);

// 1) Render pass
// Skipping the regular render pass as to only render a custom outline.

// 2) Post processing
// Outline pass
const customOutline = new CustomOutlinePass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    visualScene,
    camera
);
composer.addPass(customOutline);

// 3) Declare Custom Outline uniforms
const uniforms = customOutline.fsQuad.material.uniforms;

// Prepare colors for a fade in lerp
let currentOutlineColor = new THREE.Color();
var startOutlineColor;
var targetOutlineColor;
const userPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
if(userPrefersDark){
    startOutlineColor = new THREE.Color(0x000000); // black     
    targetOutlineColor = new THREE.Color(0xffffff); // white
}
else
{
    startOutlineColor = new THREE.Color(0xffffff); // white
    targetOutlineColor = new THREE.Color(0x000000); // black
}
currentOutlineColor = startOutlineColor;

uniforms.outlineColor.value.set(startOutlineColor); 

// Multiple scalar values packed into one uniform: Depth bias, depth multiplier, and same for normals
uniforms.multiplierParameters.value.x = 0.25;
uniforms.multiplierParameters.value.y = 10;
uniforms.multiplierParameters.value.z = 1;
uniforms.multiplierParameters.value.w = 0;
    
// 4) Anti-alias pass
const effectFXAA = new ShaderPass(FXAAShader);
effectFXAA.uniforms['resolution'].value.set(
1 / window.innerWidth,
1 / window.innerHeight
);
composer.addPass(effectFXAA);


/* ------------------------ Account for window resize ----------------------- */
function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    effectFXAA.setSize(window.innerWidth, window.innerHeight);
    customOutline.setSize(window.innerWidth, window.innerHeight);
}


/* -------------------------- Setup object selector ------------------------- */
class PickHelper
{
    constructor()
    {
        this.raycaster = new THREE.Raycaster();
        this.pickedObject = null;
    }

    getPickedObject(normalizedPosition, scene, camera)
    {
        let pickedObject = null;

        // Cast a ray through the frustum
        this.raycaster.setFromCamera(normalizedPosition, camera);
        // Get the list of objects the ray intersected
        const intersectedObjects = this.raycaster.intersectObjects(scene.children);

        if (intersectedObjects.length) {
            // Pick the first object. It's the closest one
            pickedObject = intersectedObjects[0].object.parent;
        }

        return pickedObject;
    }

    pick(normalizedPosition, scene, camera)
    {
        this.pickedObject = this.getPickedObject(normalizedPosition, scene, camera);

        if (this.pickedObject != null)
        {
            // Make the cursor a pointer hand
            if (!hasUserInteracted)
            {
                document.body.style.cursor = 'pointer';
            }
            else
            {
                document.body.style.cursor = 'default';
            }
        }
        else
        {
            // Reset the cursor
            document.body.style.cursor = 'default';
            
            // Reset the object
            this.pickedObject = null;
        }
    }
}

const pickHelper = new PickHelper();


/* ---------------------------- Setup controller ---------------------------- */
var mouse = new THREE.Vector2();
var hasUserInteracted = false;
var isDocumentVisible = true;

function onDocumentMouseMove(event)
{
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onDocumentMouseDown(event)
{
    if (pickHelper.pickedObject) {
        if (!hasUserInteracted) {
            switch (event.which) {
                case 1: // left click
                    hasUserInteracted = true;
                    console.log('Initial user interaction')
                    sound.play();
            }
        }
    }
}

function onDocumentVisibilityChange(event)
{
    if (sound)
    {
        if (document.visibilityState === 'visible')
        {
            sound.play();
        }
        else
        {
            sound.pause();
        }
    }
}


/* ------------------------------ Setup text ------------------------------ */
const labelContainerElem = document.querySelector('#labels');

const textObjects = [];

class textObject
{
    constructor(text, pivotPosition, hyperlink = null)
    {
        this.elem = document.createElement('div');
        this.subelem = document.createElement('a');
        this.subelem.textContent = text;
        this.elem.appendChild(this.subelem);
        labelContainerElem.appendChild(this.elem);

        this.pivot = new THREE.Object3D();
        this.pivotPosition = pivotPosition;

        if (hyperlink != null)
        {
            this.subelem.classList.add("hyperlink");
            this.subelem.href = hyperlink;
        }
    }

    positionPivot()
    {
        this.pivot.position.set(this.pivotPosition[0], this.pivotPosition[1], this.pivotPosition[2])
    }
}

function getPointsOnCircumference(numPoints, radius, offset)
{
    let points = [];
    let angle = offset;
    for (let i = 0; i < numPoints; i++)
    {
        points[i] = new Array(Math.sin(angle) * radius, -Math.cos(angle) * radius)
        angle = angle + 2 * Math.PI / numPoints;
    }
    return points;
}

const points = getPointsOnCircumference(4, 1.5, -Math.PI/2);
for (let i = 0; i < points.length; i++)
{
    points[i][2] = points[i][1];
    points[i][1] = 0;
}

textObjects[0] = new textObject("Number 1", points[0], "https://google.com")
textObjects[1] = new textObject("Number 2", points[1], "https://google.com")
textObjects[2] = new textObject("Number 3", points[2], "https://google.com")
textObjects[3] = new textObject("Number 4", points[3], "https://google.com")

// TODO: Add code for splitting circle circumference into positions (sine and cos, with angles equally disitrbuted between 0 and 3.14)



/* ---------------------------- Setup objects ---------------------------- */
function loadGLTF(path)
{
    return new Promise(resolve => {
        new GLTFLoader().load(path, resolve);
    });
}

const group = new THREE.Group();
const ringGroup = new THREE.Group();
var saturn, ring;

var areModelsLoaded = false;

// Import models with promises (regular models used for visuals and convex models used for hitboxes)
let promiseSaturn = loadGLTF('models/saturn/saturn.glb').then(result => { saturn = result.scene; });
let promiseRing = loadGLTF('models/saturn/ring.glb').then(result => { ring = result.scene; });

// Setup the objects in their scenes, once all the models have loaded
Promise.all([promiseSaturn, promiseRing]).then(() => {
    // Group visual objects
    ringGroup.add(ring);
    for (let i = 0; i < textObjects.length; i++) {
        ringGroup.add(textObjects[i].pivot);
    }
    group.add(saturn);
    group.add(ringGroup);

    // Translate objects
    group.position.set(5.75, -0.5, 4);
    for (let i = 0; i < textObjects.length; i++) {
        textObjects[i].positionPivot();
    }

    // Rotate objects
    ringGroup.rotation.set(22.5*3.14/180, 0, 0);

    // Rescale objects (some smaller versions of models are imported and upscaled to reduce their depth buffer range)
    group.scale.set(4, 4, 4);

    // Apply the custom outline to the visual objects
    saturn.traverse(node => node.applyOutline = true);
    ring.traverse(node => node.applyOutline = true);

    // Add the groups to their respective scenes
    visualScene.add(group);
    
    // Take note of some common variables for ease of use during updates
    areModelsLoaded = true;
});


/* ------------------------------ Setup audio ----------------------------- */
// Create an AudioListener and add it to the camera
const listener = new THREE.AudioListener();
camera.add(listener);

// Create a global audio source
const sound = new THREE.Audio(listener);

// Load a sound and set it as the Audio object's buffer
const audioLoader = new THREE.AudioLoader();
audioLoader.load('audio/blue_danube.ogg', function( buffer ) {
    sound.setBuffer( buffer );
    sound.setLoop( false );
    sound.setVolume( 0.1 );
    sound.setPlaybackRate(0);
});


/* ------------------------------- Render loop ------------------------------ */
var prevTime = performance.now();
var t = 0;

var hoverSpeed = 0;

var colorTimeRate = 0.00001;
const maxSpeed = 0.0005;

const tempV = new THREE.Vector3();

function update()
{
    requestAnimationFrame(update); // Only update when tab open

    if (areModelsLoaded)
    {
        // Update deltaTime and a counter 't', used for lerping
        var time = performance.now();
        var deltaTime = ( time - prevTime );
        prevTime = time;
        t += deltaTime;

        // Rotate the camera based on the mouse position
        camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, -mouse.x * Math.PI / 30, 0.1);
        camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, mouse.y * Math.PI / 30, 0.1);

        // Update mouse's selected object based on the physicalScene
        pickHelper.pick(mouse, visualScene, camera);

        // Lerp the custom outline color (used initially to fade in the models, and later on to fade to green)
        if (t * colorTimeRate < 1)
        {
            uniforms.outlineColor.value.set(currentOutlineColor.lerpColors(startOutlineColor, targetOutlineColor, t * colorTimeRate));
        }
        else
        {
            uniforms.outlineColor.value.set(targetOutlineColor);
        }



        if (pickHelper.pickedObject && isDocumentVisible) hoverSpeed += maxSpeed * 0.005 * deltaTime;
        else hoverSpeed -= hoverSpeed * 0.02 * deltaTime;
        hoverSpeed = THREE.MathUtils.clamp(hoverSpeed, 0, maxSpeed);
        var normalisedHoverSpeed = hoverSpeed * (1 / maxSpeed);
        var hoverAmount = normalisedHoverSpeed; // Mimics a lerp when the mouse hovers over the models


        // Scale the models based on the hoverAmount
        /*
        var scaleSaturn = 1 + 0.05 * hoverAmount; // Scale between 1 and 1.05
        var scaleRing = 1 + 0.05 * hoverAmount; // Scale between 1 and 1.05
        saturn.scale.set(scaleSaturn, scaleSaturn, scaleSaturn);
        ring.scale.set(scaleRing, scaleRing, scaleRing);
        */

        // Adjust the volume based on the hoverAmount
        sound.setVolume(0.1 + hoverAmount * 0.4);

        // Adjust the playback rate based on the normalisedOrionSpeed
        sound.setPlaybackRate(normalisedHoverSpeed);

        // Pause if playback rate is zero (to prevent constant speaker icon allocated to the tab)
        if (normalisedHoverSpeed < 0.01) {
            if (sound.isPlaying){
                sound.setPlaybackRate(1);
                sound.pause();
            }
        }
        else if (!sound.isPlaying) {
            sound.play();
        }

        // Rotate the models (visual and physical) based on the normalisedOrionSpeed
        saturn.rotation.y += deltaTime * normalisedHoverSpeed * 0.00025;
        ringGroup.rotation.y += deltaTime * normalisedHoverSpeed * 0.00025;



        for (let i = 0; i < textObjects.length; i++) {
            const textObject = textObjects[i];
            const elem = textObject.elem;
            const pivot = textObject.pivot;

            // get the position of the center of the cube
            pivot.updateWorldMatrix(true, false);
            pivot.getWorldPosition(tempV);

            var scale = 3.25 / camera.position.distanceTo(tempV);

            // get the normalized screen coordinate of that position
            // x and y will be in the -1 to +1 range with x = -1 being
            // on the left and y = -1 being on the bottom
            tempV.project(camera);

            // convert the normalized position to CSS coordinates
            const x = (tempV.x * .5 + .5) * canvas.clientWidth;
            const y = (tempV.y * -.5 + .5) * canvas.clientHeight;

            // move the elem to that position
            elem.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale}, ${scale})`;


            const pickedObject = pickHelper.getPickedObject(new THREE.Vector2(tempV.x, tempV.y), visualScene, camera);
            if (pickedObject == saturn)
            {
                elem.style.visibility = "hidden";
            }
            else
            {
                elem.style.visibility = "visible";
            }
        }
    }

    // Render the visual scene
    composer.render();
}


/* ----------------------- Check if WebGL is available ---------------------- */
function isWebGLAvailable()
{
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    }
    catch (e) {
        return false;
    }
}


/* ---------------- Call render loop and add event listeners ---------------- */
if (isWebGLAvailable())
{
    update();

    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('mousedown', onDocumentMouseDown, false);
    document.addEventListener('visibilitychange', onDocumentVisibilityChange, false);
      
    window.addEventListener('resize', onWindowResize, false);
}

/* ---------------- Transition from this page ---------------- */
var url = document.getElementById('delayed_link');

function triggerModelsFadeout()
{
    // Trigger fading out models
    t = 0;
    colorTimeRate = 1/10000;
    startOutlineColor = uniforms.outlineColor.value;
    targetOutlineColor = new THREE.Color(0x000000);
}

url.addEventListener('click', (e)=>{
    e.preventDefault();

    // Run page transition code here...
    triggerModelsFadeout()

    setTimeout(() => {
        window.location.href = url.href;
    }, 1000);
});


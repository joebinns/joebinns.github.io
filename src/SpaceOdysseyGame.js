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
// Conrols
import { FirstPersonControls } from "firstpersoncontrols";

/*
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass';
import {FXAAShader} from 'three/examples/jsm/shaders/FXAAShader';

import {CustomOutlinePass} from './CustomOutlinePass.js'; // CustomOutlinePass has imports that need fixing...
*/



/* ---------------------------- Utilities --------------------------- */

// Clamp number between two values with the following line:
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);


/* ---------------------------- Declare scenes --------------------------- */
const visualScene = new THREE.Scene();
const physicalScene = new THREE.Scene(); // An un-rendered scene which is used for raycasting to convex versions of the visual models.


/* ---------------------------- Setup the camera ---------------------------- */
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 7.5;


/* -------------------------- Setup the renderer -------------------------- */
const canvas = document.querySelector('#canvas3d');
const canvas2d = document.querySelector('#canvas2d');
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
const dummyComposer = new EffectComposer(new THREE.WebGLRenderer(), renderTarget); 

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

// 5) Un-seen outline pass on physical scene (otherwise it seems that the objects positions in the physicalScene do not update (?))
const dummyOutline = new CustomOutlinePass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    physicalScene,
    camera
);
dummyComposer.addPass(dummyOutline);


/* -------------------------- Setup object selector ------------------------- */
class PickHelper
{
    constructor()
    {
        this.raycaster = new THREE.Raycaster();
        this.pickedObject = null;
    }

    pick(normalizedPosition, scene, camera)
    {
        // Cast a ray through the frustum
        this.raycaster.setFromCamera(normalizedPosition, camera);
        // Get the list of objects the ray intersected
        const intersectedObjects = this.raycaster.intersectObjects(scene.children);

        if (intersectedObjects.length)
        {
            // Pick the first object. It's the closest one
            this.pickedObject = intersectedObjects[0].object.parent;

            // Make the cursor a pointer hand
            if (!hasUserInteracted)
            {
                document.body.style.cursor = 'pointer';
            }
            else if (!objectiveComplete)
            {
                document.body.style.cursor = 'default';
            }
            else
            {
                document.body.style.cursor = 'pointer';
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
        } else if (objectiveComplete) {
            switch (event.which) {
                case 1: // left click
                    window.open("https://github.com/joebinns/joebinns.github.io");
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

const clock = new THREE.Clock();
const controls = new FirstPersonControls( camera, renderer.domElement );
controls.movementSpeed = 5;
controls.lookSpeed = 0.1;


/* ------------------------------ Setup text ------------------------------ */
const labelContainerElem = document.querySelector('#labels');

class textObject
{
    constructor(text, pivot, hyperlink = null)
    {
        this.elem = document.createElement('div');
        this.subelem = document.createElement('a');
        this.subelem.textContent = text;
        this.subelem.classList.add("border");
        this.elem.appendChild(this.subelem);
        labelContainerElem.appendChild(this.elem);

        this.pivot = pivot;

        if (hyperlink != null)
        {
            this.subelem.classList.add("hyperlink");
            this.subelem.href = hyperlink;
        }
    }
}

let aboutTextObject;


/* ---------------------------- Setup objects ---------------------------- */
function loadGLTF(path)
{
    return new Promise(resolve => {
        new GLTFLoader().load(path, resolve);
    });
}

const group = new THREE.Group();
var spaceStationV, orion;
const groupConvex = new THREE.Group();
var spaceStationVConvex, orionConvex;

const spaceStationVDistance = 10;
const orionDistance = 4;
const totalDistance = spaceStationVDistance + orionDistance - 1.7; // Subtracting the distance from the center of SpaceStationV to the hangar

var orionStartPosition;
var areModelsLoaded = false;

// Import models with promises (regular models used for visuals and convex models used for hitboxes)
let promiseSpaceStationV = loadGLTF('models/space_station_v/SpaceStationV_Simplified.glb').then(result => { spaceStationV = result.scene; });
let promiseOrion = loadGLTF('models/orion/Orion_Simplified_Small.glb').then(result => { orion = result.scene; });
let promiseSpaceStationVConvex = loadGLTF('models/space_station_v/SpaceStationV_Simplified_Convex.glb').then(result => { spaceStationVConvex = result.scene; });
let promiseOrionConvex = loadGLTF('models/orion/Orion_Simplified_Convex_Small.glb').then(result => { orionConvex = result.scene; });

// Setup the objects in their scenes, once all the models have loaded
Promise.all([promiseSpaceStationV, promiseOrion, promiseSpaceStationVConvex, promiseOrionConvex]).then(() => {
    // Setup text objects
    aboutTextObject = new textObject("About", orion, "https://google.com");

    // Group visual objects
    group.add(spaceStationV);
    group.add(orion);
    // Group hitbox objects
    groupConvex.add(spaceStationVConvex);
    groupConvex.add(orionConvex);

    // Rotate groups
    group.rotation.set(0, 12.5*3.14/180, -26.5*3.14/180);
    groupConvex.rotation.set(0, 12.5*3.14/180, -26.5*3.14/180);

    // Rescale objects (some smaller versions of models are imported and upscaled to reduce their depth buffer range)
    orion.scale.set(10, 10, 10);
    orionConvex.scale.set(10, 10, 10);

    // Displace objects along their local axes
    spaceStationV.position.set(spaceStationVDistance, 0, 0);
    orion.position.set(-orionDistance, 0, 0);
    spaceStationVConvex.position.set(spaceStationVDistance, 0, 0);
    orionConvex.position.set(-orionDistance, 0, 0);

    // Apply the custom outline to the visual objects
    spaceStationV.traverse(node => node.applyOutline = true);
    orion.traverse(node => node.applyOutline = true);

    // Add the groups to their respective scenes
    visualScene.add(group);
    physicalScene.add(groupConvex);
    
    // Take note of some common variables for ease of use during updates
    orionStartPosition = orion.position.x;
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


/* ------------------------ Account for window resize ----------------------- */
function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    dummyComposer.setSize(window.innerWidth, window.innerHeight);
    effectFXAA.setSize(window.innerWidth, window.innerHeight);
    customOutline.setSize(window.innerWidth, window.innerHeight);

    //let ctx = canvas2d.getContext('2d');
    //ctx.canvas.width  = window.innerWidth;
    //ctx.canvas.height = window.innerHeight;
    //canvas2d.width = document.body.clientWidth;
    //canvas2d.height = document.body.clientHeight;

    controls.handleResize();
}

onWindowResize();


/* ------------------------------- Render loop ------------------------------ */
var prevTime = performance.now();
var t = 0;

var orionShouldMove = false;
var objectiveComplete = false;
var orionSpeed = 0;
var hoverSpeed = 0;

var colorTimeRate = 0.00001;
const maxSpeed = 0.0005;

const tempV = new THREE.Vector3();

let hoveredElement;

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

        /*
        // Rotate the camera based on the mouse position
        camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, -mouse.x * Math.PI / 30, 0.1);
        camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, mouse.y * Math.PI / 30, 0.1);
        */

        // Update mouse's selected object based on the physicalScene
        pickHelper.pick(mouse, physicalScene, camera);

        // If the user has clicked on an object and is currently hovering on an object, then set that the orion should be moving
        if (hasUserInteracted)
        {
            if (pickHelper.pickedObject)
            {
                orionShouldMove = true;
            }
            else
            {
                orionShouldMove = false;
            }
        }

        // Lerp the custom outline color (used initially to fade in the models, and later on to fade to green)
        if (t * colorTimeRate < 1)
        {
            uniforms.outlineColor.value.set(currentOutlineColor.lerpColors(startOutlineColor, targetOutlineColor, t * colorTimeRate));
        }
        else
        {
            uniforms.outlineColor.value.set(targetOutlineColor);
        }
        
        // If the orionShouldMove, then accelerate
        if (orionShouldMove && isDocumentVisible) orionSpeed += maxSpeed * 0.005 * deltaTime;
        // Otherwise, decelerate   
        else orionSpeed -= orionSpeed * 0.02 * deltaTime;
        // Clamp the orionSpeed to ensure it remains within a standard range
        orionSpeed = THREE.MathUtils.clamp(orionSpeed, 0, maxSpeed);

        // If the total distance to the hangar has not been exceeded then update the positions of the orion (visual and hitbox) 
        if (orion.position.x - orionStartPosition < totalDistance)
        {
            orion.position.x += (orionSpeed * deltaTime);
            orionConvex.position.x += (orionSpeed * deltaTime);
        }
        // Otherwise, prevent further movement and prepare the 'objectiveComplete' sequence
        else
        {
            if (objectiveComplete == false)
            {
                t = 0;
                startOutlineColor = targetOutlineColor;
                targetOutlineColor = new THREE.Color(0x00974c);
                objectiveComplete = true;
                colorTimeRate = 1/240;

                document.getElementById("notification_paragraph").style.display = "inline";
                document.getElementById("notification_division").classList.add("fade-in");
            }
        }    


        hoveredElement = document.querySelector(":hover");

        if ((pickHelper.pickedObject) && isDocumentVisible)
        {
            aboutTextObject.subelem.classList.replace("hyperlink", "hyperlink-hover");
        }
        else
        {
            aboutTextObject.subelem.classList.replace("hyperlink-hover", "hyperlink");
        }

        if ((pickHelper.pickedObject || hoveredElement != null) && isDocumentVisible)
        {
            hoverSpeed += maxSpeed * 0.01 * deltaTime;
        }
        else
        {
            hoverSpeed -= hoverSpeed * 0.02 * deltaTime;
        }

        var normalisedOrionSpeed = orionSpeed * (1 / maxSpeed);
        hoverSpeed = THREE.MathUtils.clamp(hoverSpeed, 0, maxSpeed);
        var normalisedHoverSpeed = hoverSpeed * (1 / maxSpeed);
        //var hoverAmount = normalisedOrionSpeed; // Mimics a lerp when the mouse hovers over the models
        var hoverAmount = normalisedHoverSpeed; // Mimics a lerp when the mouse hovers over the models


        // Scale the models based on the hoverAmount
        var scaleOrion = (1 + 0.1 * hoverAmount) * 10; // Scale between 10 and 11
        var scaleSpaceStationV = 1 + 0.05 * hoverAmount; // Scale between 1 and 1.05
        orion.scale.set(scaleOrion, scaleOrion, scaleOrion);
        spaceStationV.scale.set(scaleSpaceStationV, scaleSpaceStationV, scaleSpaceStationV);

        // Adjust the volume based on the hoverAmount
        sound.setVolume(0.1 + hoverAmount * 0.4);

        // Set the normalisedOrionSpeed to 1 to continue spinning once objectiveComplete
        if (objectiveComplete)
        {
            normalisedOrionSpeed = 1;
        }

        // Adjust the playback rate based on the normalisedOrionSpeed
        sound.setPlaybackRate(normalisedOrionSpeed);

        // Pause if playback rate is zero (to prevent constant speaker icon allocated to the tab)
        if (normalisedOrionSpeed < 0.01) {
            if (sound.isPlaying){
                sound.setPlaybackRate(1);
                sound.pause();
            }
        }
        else if (!sound.isPlaying) {
            sound.play();
        }

        controls.update( clock.getDelta() );

        // Rotate the models (visual and physical) based on the normalisedOrionSpeed
        spaceStationV.rotation.x += deltaTime * normalisedOrionSpeed * 0.00025;
        orion.rotation.x += deltaTime * normalisedOrionSpeed * 0.00025;
        spaceStationVConvex.rotation.x += deltaTime * normalisedOrionSpeed * 0.00025;
        orionConvex.rotation.x += deltaTime * normalisedOrionSpeed * 0.00025;


        // Render text objects
        const textObject = aboutTextObject;
        const elem = textObject.elem;
        const pivot = textObject.pivot;

        // get the position of the center of the cube
        pivot.updateWorldMatrix(true, false);
        pivot.getWorldPosition(tempV);

        var scale = 1 / camera.position.distanceTo(tempV);
        scale = Math.sqrt(scale);

        // get the normalized screen coordinate of that position
        // x and y will be in the -1 to +1 range with x = -1 being
        // on the left and y = -1 being on the bottom
        tempV.project(camera);

        /*
        const points = [];
        points.push(tempV);
        let displacedPosition;
        displacedPosition = tempV.add(new THREE.Vector3(0, 1 * scale, 0));
        points.push(displacedPosition);

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line( geometry );
        visualScene.add(line);
        */

        // convert the normalized position to CSS coordinates
        let x = (tempV.x * .5 + .5);
        let y = (tempV.y * -.5 + .5);
        let offsetY = ((tempV.y * -.5 + .5) - (0.3 * scale));

        /*
        x = clamp(x, 0, 1);
        y = clamp(y, 0, 1);
        offsetY = clamp(offsetY, 0, 1);
        */

        x *= canvas.clientWidth;
        y *= canvas.clientHeight;
        offsetY *= canvas.clientHeight;

        /*
        // draw line
        var ctx = canvas2d.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, offsetY);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2.5;
        ctx.stroke();
        */

        // move the elem to that position
        elem.style.transform = `translate(-50%, -50%) translate(${x}px, ${offsetY}px)`;
        if (isLookingAt(camera, pivot))
        {
            elem.style.visibility = "visible";
        }
        else
        {
            elem.style.visibility = "hidden";
        }
    }


    // Render the visual scene and the (hidden) physical scene 
    composer.render();
    dummyComposer.render();
}


function isLookingAt(camera, object)
{
    const cameraDir = new THREE.Vector3(0, 0, 0);
    camera.getWorldDirection(cameraDir);

    const cameraPos = new THREE.Vector3(0, 0, 0);
    camera.getWorldPosition(cameraPos);
    const objectPos = new THREE.Vector3(0, 0, 0);
    object.getWorldPosition(objectPos);
    const cameraToObjectDir = objectPos.sub(cameraPos);

    if(cameraDir.dot(cameraToObjectDir) > 0)
    {
        return true;
    }
    else
    {
        return false
    }
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
if (true)//(isWebGLAvailable())
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

/*
url.addEventListener('click', (e)=>{
    e.preventDefault();

    // Run page transition code here...
    triggerModelsFadeout();

    setTimeout(() => {
        window.location.href = url.href;
    }, 1000);
});
*/


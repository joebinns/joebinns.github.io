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
import { FirstPersonControls } from "./FirstPersonControls.js";

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
const canvas = document.getElementById('canvas3d');
const renderer = new THREE.WebGLRenderer({canvas:canvas});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio); // Adjust pixel ratio (to improve mobile quality)
//document.body.appendChild(renderer.domElement);
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

    getPickedObject(normalizedPosition, scene, camera)
    {
        let pickedObject = null;

        // Cast a ray through the frustum
        this.raycaster.setFromCamera(normalizedPosition, camera);
        // Get the list of objects the ray intersected
        const intersectedObjects = this.raycaster.intersectObjects(scene.children, true);

        if (intersectedObjects.length)
        {
            // Pick the first object. It's the closest one
            pickedObject = intersectedObjects[0].object.parent;
        }

        return pickedObject;
    }

    pick(normalizedPosition, scene, camera)
    {
        this.pickedObject = this.getPickedObject(normalizedPosition, scene, camera);
    }
}

const pickHelper = new PickHelper();


/* ---------------------------- Setup controller ---------------------------- */
var mouse = new THREE.Vector2();
var isDocumentVisible = true;

const controls = new FirstPersonControls( camera, renderer.domElement );
controls.movementSpeed = 5;
controls.lookSpeed = 0.1;

function onDocumentMouseMove(event)
{
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

window.openPopUp = (id, text, color, githubLink = "", youtubeLink  = "", itchdotioLink  = "", linkedinLink = "", mailLink = "") => {
    document.getElementById(id).hidden = false;
    document.getElementById("close-pop-up-button").hidden = false;
    clock.stop();
    document.body.style.cursor = 'default';
    uniforms.outlineColor.value.set(new THREE.Color(0xD0D0D)); // TODO: Change this color to 95% white if light mode is used.
    for (let i = 0; i < textObjects.length; i++)
    {
        textObjects[i].elem.style.opacity = 0.05;
    }
    // Render the visual scene and the (hidden) physical scene
    composer.render();
    dummyComposer.render();
    latestPopUpId = id;

    document.getElementById("header-text").textContent = text;
    document.getElementById("header-text").style.color = color;

    // TODO: Update hyperlink icons, based on the clicked text object?
    if (githubLink)
    {
        document.getElementById("github-link").href = githubLink;
    }
    else
    {
        document.getElementById("github-link").parentElement.hidden = true;
    }
    if (youtubeLink)
    {
        document.getElementById("youtube-link").href = youtubeLink;
    }
    else
    {
        document.getElementById("youtube-link").parentElement.hidden = true;
    }
    if (itchdotioLink)
    {
        document.getElementById("itchdotio-link").href = itchdotioLink;
    }
    else
    {
        document.getElementById("itchdotio-link").parentElement.hidden = true;
    }
    if (linkedinLink != "")
    {
        document.getElementById("linkedin-link").href = linkedinLink;
    }
    else
    {
        document.getElementById("linkedin-link").parentElement.hidden = true;
    }
    if (mailLink)
    {
        document.getElementById("mail-link").href = mailLink;
    }
    else
    {
        document.getElementById("mail-link").parentElement.hidden = true;
    }
};

let latestPopUpId;

window.closeLatestPopUp = () => {
    closePopUp(latestPopUpId);
}

function closePopUp(id)
{
    document.getElementById(id).hidden = true;
    document.getElementById("close-pop-up-button").hidden = true;
    clock = new THREE.Clock();

    document.getElementById("header-text").textContent = "Joe Binns";
    document.getElementById("header-text").style.color = "#FFFFFF"; // TODO: Change this to black if light mode used

    document.getElementById("github-link").href = "https://github.com/joebinns";
    document.getElementById("github-link").parentElement.hidden = false;
    document.getElementById("youtube-link").href = "https://www.youtube.com/@joebinns95";
    document.getElementById("youtube-link").parentElement.hidden = false;
    document.getElementById("itchdotio-link").href = "https://joebinns.itch.io/";
    document.getElementById("itchdotio-link").parentElement.hidden = false;
    document.getElementById("linkedin-link").href = "https://www.linkedin.com/in/joe-binns/";
    document.getElementById("linkedin-link").parentElement.hidden = false;
    document.getElementById("mail-link").href = "mailto:joebinns.95@gmail.com";
    document.getElementById("mail-link").parentElement.hidden = false;
};

window.togglePortfolio = () => {
    for (let i = 0; i < portfolioTextObjects.length; i++) {
        var isHidden = portfolioTextObjects[i].subelem.hidden;
        portfolioTextObjects[i].subelem.hidden = !isHidden;
    }
}

function onDocumentMouseDown(event) {
    let object = pickHelper.pickedObject;
    if (object) {
        let textObject = objectToTextObject(object)
        if (textObject) {
            textObject.subelem.click();
            textObject.subelem.classList.replace("hyperlink-hover", "hyperlink-active");
            prevPickedTextObject = textObject;
        }
    }
}


function onDocumentVisibilityChange(event)
{
    isDocumentVisible = (document.visibilityState === 'visible');
    if (isDocumentVisible)
    {
        clock = new THREE.Clock(); // Unfortunately, clock.stop(); does not work as expected.
    }
    else
    {
        clock.start();
    }
}


/* ------------------------------ Setup text ------------------------------ */
const labelContainerElem = document.querySelector('#labels');

class textObject
{
    constructor(text, pivot, hyperlink = null)
    {
        this.elem = document.createElement('div');
        this.elem.style.position = "absolute";
        this.elem.style.whiteSpace = "nowrap";
        this.subelem = document.createElement('a');
        this.subelem.textContent = text;
        this.subelem.classList.add("border");
        this.elem.appendChild(this.subelem);
        labelContainerElem.appendChild(this.elem);

        this.pivot = pivot;

        this.hyperlink = hyperlink;
        if (hyperlink != null)
        {
            this.subelem.classList.add("hyperlink");
            this.subelem.href = hyperlink;
        }
    }
}

const textObjects = [];
const portfolioTextObjects = [];


class hoverObject
{
    constructor(object, physicalObject, scaleRange, scaleMultiplier)
    {
        this.object = object;
        this.physicalObject = physicalObject;
        this.scaleRange = scaleRange;
        this.scaleMultiplier = scaleMultiplier;
        this.hoverAmount = 0;
    }
}

const hoverObjects = [];


/* ---------------------------- Setup objects ---------------------------- */
function loadGLTF(path)
{
    return new Promise(resolve => {
        new GLTFLoader().load(path, resolve);
    });
}

const group = new THREE.Group();
var spaceStationV, orion, orion2;
const groupConvex = new THREE.Group();
var spaceStationVConvex, orionConvex, orion2Convex;

const spaceStationVDistance = 10;
const orionDistance = 4;

var areModelsLoaded = false;

let prevPickedTextObject;

// Import models with promises (regular models used for visuals and convex models used for hitboxes)
let promiseSpaceStationV = loadGLTF('models/space_station_v/SpaceStationV_Simplified.glb').then(result => { spaceStationV = result.scene; });
let promiseOrion = loadGLTF('models/orion/Orion_Simplified_Small.glb').then(result => { orion = result.scene; });
let promiseSpaceStationVConvex = loadGLTF('models/space_station_v/SpaceStationV_Simplified_Convex.glb').then(result => { spaceStationVConvex = result.scene; });
let promiseOrionConvex = loadGLTF('models/orion/Orion_Simplified_Convex_Small.glb').then(result => { orionConvex = result.scene; });

const spaceStationVGroup = new THREE.Group();
const spaceStationVGroupConvex = new THREE.Group();

const sphere = new THREE.Group();
const sphereMesh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 7, 7));
sphere.add(sphereMesh);

const personalObject = sphere.clone();
const personalObjectConvex = sphere.clone();
const professionalObject = sphere.clone();
const professionalObjectConvex = sphere.clone();
const stylisedCharacterControllerObject = sphere.clone();
const stylisedCharacterControllerObjectConvex = sphere.clone();


// Setup the objects in their scenes, once all the models have loaded
Promise.all([promiseSpaceStationV, promiseOrion, promiseSpaceStationVConvex, promiseOrionConvex]).then(() => {
    // Clone orion
    orion2 = orion.clone();
    orion2Convex = orionConvex.clone();

    // Setup text objects
    textObjects.push(new textObject("About Me", orionConvex, "javascript:openPopUp('about-me', 'About Me', '#FFFFFF', 'https://github.com/joebinns', 'https://www.youtube.com/@joebinns95', 'https://joebinns.itch.io/', 'https://www.linkedin.com/in/joe-binns/', 'mailto:joebinns.95@gmail.com');"));
    textObjects.push(new textObject("Curriculum Vitae", orion2Convex, "../documents/cv/cv_joe_binns_2022_08_17.pdf"));
    textObjects.push(new textObject("Portfolio", spaceStationVConvex, "javascript:togglePortfolio();"));

    textObjects.push(new textObject("Stylised Character Controller", stylisedCharacterControllerObjectConvex, "javascript:openPopUp('stylised-character-controller', 'Stylised Character Controller', '#FF6A00', 'https://github.com/joebinns/stylised-character-controller', 'https://youtube.com/playlist?list=PLfhw9nZBPNEVGPNXxcTTfsVsaMRHZAg_W', 'https://joebinns.itch.io/stylised-character-controller');"));
    textObjects.at(-1).subelem.hidden = true;
    portfolioTextObjects.push(textObjects.at(-1));

    textObjects.push(new textObject("Personal", personalObjectConvex));
    textObjects.at(-1).subelem.hidden = true;
    portfolioTextObjects.push(textObjects.at(-1));
    textObjects.push(new textObject("Professional", professionalObjectConvex));
    textObjects.at(-1).subelem.hidden = true;
    portfolioTextObjects.push(textObjects.at(-1));

    prevPickedTextObject = textObjects[0];

    // Setup hover objects
    hoverObjects.push(new hoverObject(orion, orionConvex, 0.1, 10));
    hoverObjects.push(new hoverObject(orion2, orion2Convex, 0.1, 10));
    hoverObjects.push(new hoverObject(spaceStationV, spaceStationVConvex, 0.05, 1));
    hoverObjects.push(new hoverObject(stylisedCharacterControllerObject, stylisedCharacterControllerObjectConvex, 0.4, 1));

    // Group visual objects
    spaceStationVGroup.add(spaceStationV);
    spaceStationVGroup.add(personalObject);
    spaceStationVGroup.add(professionalObject);
    spaceStationVGroup.add(stylisedCharacterControllerObject);
    group.add(spaceStationVGroup);
    group.add(orion);
    group.add(orion2);

    // Group hitbox objects
    spaceStationVGroupConvex.add(spaceStationVConvex);
    spaceStationVGroupConvex.add(personalObjectConvex);
    spaceStationVGroupConvex.add(professionalObjectConvex);
    spaceStationVGroupConvex.add(stylisedCharacterControllerObjectConvex);
    groupConvex.add(spaceStationVGroupConvex);
    groupConvex.add(orionConvex);
    groupConvex.add(orion2Convex);

    // Rotate groups
    //group.rotation.set(90*3.14/180, 12.5*3.14/180, -26.5*3.14/180);
    //groupConvex.rotation.set(90*3.14/180, 12.5*3.14/180, -26.5*3.14/180);

    // Rescale objects (some smaller versions of models are imported and upscaled to reduce their depth buffer range)
    orion.scale.set(10, 10, 10);
    orion2.scale.set(10, 10, 10);
    orionConvex.scale.set(10, 10, 10);
    orion2Convex.scale.set(10, 10, 10)

    // Displace objects along their local axes
    spaceStationVGroup.position.set(spaceStationVDistance, 0, 0);
    personalObject.position.set(0, 0, 15);
    professionalObject.position.set(0, 0, -15);
    stylisedCharacterControllerObject.position.set(0, 0, 20);
    orion.position.set(-orionDistance, 0, 0);
    orion2.position.set(2 * spaceStationVDistance + orionDistance, 0, 0);

    spaceStationVGroupConvex.position.set(spaceStationVDistance, 0, 0);
    personalObjectConvex.position.set(0, 0, 15);
    professionalObjectConvex.position.set(0, 0, -15);
    stylisedCharacterControllerObjectConvex.position.set(0, 0, 20);
    orionConvex.position.set(-orionDistance, 0, 0);
    orion2Convex.position.set(2 * spaceStationVDistance + orionDistance, 0, 0);

    // Apply the custom outline to the visual objects
    group.traverse(node => node.applyOutline = true);

    // Add the groups to their respective scenes
    visualScene.add(group);
    physicalScene.add(groupConvex);

    // Take note of some common variables for ease of use during updates
    areModelsLoaded = true;
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

    controls.handleResize();
}

onWindowResize();

/* ------------------------------- Render loop ------------------------------ */
let clock = new THREE.Clock();
var t = 0;

var colorTimeRate = 0.01;

const tempV = new THREE.Vector3();

function objectToTextObject(object) {
    let textObject;
    for (let i = 0; i < textObjects.length; i++) {
        if (textObjects[i].pivot == object)
        {
            textObject = textObjects[i];
            break;
        }
    }
    return textObject;
}

function isObjectHovered(object)
{
    if (pickHelper.pickedObject == null)
    {
        return false;
    }
    return object == pickHelper.pickedObject;
}

function isElementHovered(element)
{
    return element == document.querySelector(":hover");
}

function update()
{
    requestAnimationFrame(update); // Only update when tab open

    var deltaTime = clock.getDelta();

    if (areModelsLoaded && deltaTime != 0)
    {
        // Update counter t, used for lerping
        t += deltaTime;

        // Update mouse's selected object based on the physicalScene
        pickHelper.pick(mouse, physicalScene, camera);

        // Lerp the custom outline color (used initially to fade in the models, and later on to fade to green)
        if (t * colorTimeRate < 1)
        {
            uniforms.outlineColor.value.set(currentOutlineColor.lerpColors(startOutlineColor, targetOutlineColor, t * colorTimeRate));
        }
        else
        {
            uniforms.outlineColor.value.set(targetOutlineColor);
        }

        for (let i = 0; i < hoverObjects.length; i++)
        {
            let hoverObject = hoverObjects[i];
            let object = hoverObject.object;
            let physicalObject = hoverObject.physicalObject;
            let hoverAmount = hoverObject.hoverAmount;
            if (isObjectHovered(physicalObject) || isElementHovered(objectToTextObject(physicalObject).subelem))
            {
                hoverAmount += 10 * deltaTime;
            }
            else
            {
                hoverAmount -= 10 * deltaTime;
            }
            hoverAmount = clamp(hoverAmount, 0, 1);
            hoverObject.hoverAmount = hoverAmount;

            let scale = (1 + hoverObject.scaleRange * hoverAmount) * hoverObject.scaleMultiplier;
            object.scale.set(scale, scale, scale);
        }

        if (pickHelper.pickedObject)
        {
            let textObject = objectToTextObject(pickHelper.pickedObject);
            if (textObject != null)
            {
                textObject.subelem.classList.replace("hyperlink", "hyperlink-hover");
                prevPickedTextObject.subelem.classList.replace("hyperlink-active", "hyperlink-hover");
                prevPickedTextObject = textObject;
                if (textObject.hyperlink != null)
                {
                    document.body.style.cursor = 'pointer';
                }
            }
        }
        else
        {
            prevPickedTextObject.subelem.classList.replace("hyperlink-hover", "hyperlink");
            prevPickedTextObject.subelem.classList.replace("hyperlink-active", "hyperlink");
            document.body.style.cursor = 'default';
        }

        controls.update( deltaTime );


        // Rotate the models (visual and physical)
        spaceStationV.rotation.x += deltaTime * 0.075;
        orion.rotation.x += deltaTime * 0.075;
        orion2.rotation.x += deltaTime * 0.075;
        spaceStationVConvex.rotation.x += deltaTime * 0.075;
        orionConvex.rotation.x += deltaTime * 0.075;
        orion2Convex.rotation.x += deltaTime * 0.075;


        // Render text objects
        for (let i = 0; i < textObjects.length; i++)
        {
            let textObject = textObjects[i];
            let elem = textObject.elem;
            let pivot = textObject.pivot;


            // Set opacity based on distance and camera view
            let relevance = isLookingAt(camera, pivot);
            const farDistance = 5;
            let distance = getDisplacement(camera, pivot).length();
            let proximity = relevance * farDistance / Math.sqrt(distance);
            let opacity = 1 / (1 + Math.exp(10*(1-proximity)));
            elem.style.opacity = opacity;



            // get the position of the center of the cube
            pivot.updateWorldMatrix(true, false);
            pivot.getWorldPosition(tempV);

            var scale = 1 / camera.position.distanceTo(tempV);
            scale = Math.sqrt(scale);

            // get the normalized screen coordinate of that position
            // x and y will be in the -1 to +1 range with x = -1 being
            // on the left and y = -1 being on the bottom
            tempV.project(camera);

            // convert the normalized position to CSS coordinates
            let x = (tempV.x * .5 + .5);
            let y = (tempV.y * -.5 + .5);
            let offsetY = (y - (0.3 * scale));


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
            //elem.style.transform = `translate(${x}px, ${y}px)`;
            //elem.style.transform = `translate()`;



            // Set visibility based on if it's blocked from or out of view
            const pickedObject = pickHelper.getPickedObject(new THREE.Vector2(tempV.x, tempV.y), physicalScene, camera);
            let isBlockedFromView = false;
            //if (pickedObject) isBlockedFromView = pickedObject != pivot;
            let isOutOfView = relevance < 0;
            if (isOutOfView || isBlockedFromView)
            {
                elem.hidden = true;
            }
            else
            {
                elem.hidden = false;
            }
        }

        // Render the visual scene and the (hidden) physical scene
        composer.render();
        dummyComposer.render();
    }
}

function getDisplacement(objectA, objectB)
{
    const objectAPos = new THREE.Vector3(0, 0, 0);
    objectA.getWorldPosition(objectAPos);
    var objectBPos = new THREE.Vector3(0, 0, 0);
    objectB.getWorldPosition(objectBPos);
    var displacement = objectBPos.sub(objectAPos);
    return displacement;
}

function isLookingAt(camera, object)
{
    const cameraDir = new THREE.Vector3(0, 0, 0);
    camera.getWorldDirection(cameraDir);

    let cameraToObjectDir = getDisplacement(camera, object);
    cameraToObjectDir = cameraToObjectDir.divideScalar(cameraToObjectDir.length());

    return cameraDir.dot(cameraToObjectDir);
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

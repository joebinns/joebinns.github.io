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



/* ---------------------------- Utilities --------------------------- */

// Clamp number between two values with the following line:
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);


/* ---------------------------- Declare scenes --------------------------- */
const visualScene = new THREE.Scene();
const physicalScene = new THREE.Scene(); // An un-rendered scene which is used for raycasting to convex versions of the visual models.


/* ---------------------------- Setup the camera ---------------------------- */
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
//camera.position.z = 2.5;


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

function onDocumentMouseMove(event)
{
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

const headerHyperImageIDs = [];
headerHyperImageIDs.push("github-link", "youtube-link", "itchdotio-link", "linkedin-link", "mail-link");

let isPopUpOpen = false;

window.openPopUp = (id, text, color, headerHyperImageLinks = ["", "", "", "", ""]) => {
    isPopUpOpen = true;
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

    for (let i = 0; i < headerHyperImageLinks.length; i++) {
        let id = headerHyperImageIDs[i];
        let link = headerHyperImageLinks[i];
        let elem = document.getElementById(id);
        if (link)
        {
            elem.href = link;
        }
        else
        {
            disableHyperImage(id);
        }
    }
};

function disableHyperImage(id)
{
    let elem = document.getElementById(id);
    elem.setAttribute("data-href", elem.href);
    elem.removeAttribute("href");
    elem.classList.remove("hyperimage");
    elem.classList.add("disabled");
}

function enableHyperImage(id)
{
    let elem = document.getElementById(id);
    elem.href = elem.getAttribute("data-href");
    elem.classList.remove("disabled");
    elem.classList.add("hyperimage");
}

let latestPopUpId;

window.closeLatestPopUp = () => {
    closePopUp(latestPopUpId);
}

function closePopUp(id)
{
    isPopUpOpen = false;
    document.getElementById(id).hidden = true;
    document.getElementById("close-pop-up-button").hidden = true;
    clock = new THREE.Clock();

    document.getElementById("header-text").textContent = isPortfolioHidden ? "Joe Binns" : "Portfolio";
    document.getElementById("header-text").style.color = "#FFFFFF"; // TODO: Change this to black if light mode used

    for (let i = 0; i < headerHyperImageIDs.length; i++) {
        let id = headerHyperImageIDs[i];
        enableHyperImage(id);
    }
};

let isPortfolioHidden = true;

window.togglePortfolio = () => {
    isPortfolioHidden = portfolioTextObjects[1].subelem.hidden;
    if (isPortfolioHidden)
    {
        enablePortfolio();
    }
    else
    {
        disablePortfolio();
    }
    isPortfolioHidden = !isPortfolioHidden;
}

const physicalToVisualObjects = {
};

function enablePortfolio()
{
    document.getElementById("header-text").textContent = "Portfolio";
    for (let i = 1; i < portfolioTextObjects.length; i++) {
        portfolioTextObjects[i].subelem.hidden = false;
        portfolioVisualObjects[i].visible = true;
    }
    portfolioTextObjects[0].subelem.hidden = true;
}

function disablePortfolio()
{
    document.getElementById("header-text").textContent = "Joe Binns";
    for (let i = 1; i < portfolioTextObjects.length; i++) {
        portfolioTextObjects[i].subelem.hidden = true;
        portfolioVisualObjects[i].visible = false;
    }
    portfolioTextObjects[0].subelem.hidden = false;
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
    if (isPopUpOpen) {return;}
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
    constructor(text, pivot, hyperlink = null, offset = new THREE.Vector2(0, 0.3))
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
            if (!hyperlink.includes("javascript"))
            {
                this.subelem.target = "_blank";
            }
        }

        this.offset = offset;
    }
}

const textObjects = [];
const portfolioTextObjects = [];
const portfolioVisualObjects = [];


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

const spaceStationVDistance = 25;

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
const wormsObject = sphere.clone();
const wormsObjectConvex = sphere.clone();


let discreteCameraPositionsIndex = 0;
let targetCameraPosition = new THREE.Vector3(0, 0, 0);
const discreteCameraPositions = [];

// Setup the objects in their scenes, once all the models have loaded
Promise.all([promiseSpaceStationV, promiseOrion, promiseSpaceStationVConvex, promiseOrionConvex]).then(() => {
    // Clone orion
    orion2 = orion.clone();
    orion2Convex = orionConvex.clone();

    // Setup text objects
    textObjects.push(new textObject("About Me", orionConvex, "javascript:openPopUp('about-me', 'About Me', '#FFFFFF', ['https://github.com/joebinns', 'https://www.youtube.com/@joebinns95', 'https://joebinns.itch.io/', 'https://www.linkedin.com/in/joe-binns/', 'mailto:joebinns.95@gmail.com']);"));
    textObjects.push(new textObject("Curriculum Vitae", orion2Convex, "../documents/cv/cv_joe_binns_2022_08_17.pdf"));
    textObjects.push(new textObject("Portfolio", spaceStationVConvex, "javascript:togglePortfolio();"));
    portfolioTextObjects.push(textObjects.at(-1));
    portfolioVisualObjects.push(spaceStationV);

    textObjects.push(new textObject("Stylised Character Controller", stylisedCharacterControllerObjectConvex, "javascript:openPopUp('stylised-character-controller', 'Stylised Character Controller', '#FF6A00', ['https://github.com/joebinns/stylised-character-controller', 'https://youtube.com/playlist?list=PLfhw9nZBPNEVGPNXxcTTfsVsaMRHZAg_W', 'https://joebinns.itch.io/stylised-character-controller', '', '']);", new THREE.Vector2(0.05, 0)));
    portfolioTextObjects.push(textObjects.at(-1));
    portfolioVisualObjects.push(stylisedCharacterControllerObject);
    textObjects.push(new textObject("Worms", wormsObjectConvex, "javascript:openPopUp('worms', 'Worms', '#FF6A00', ['https://github.com/joebinns/worms', 'https://youtube.com/playlist?list=PLfhw9nZBPNEVK3fsC4BPVcO-bX6TIf6AC', 'https://joebinns.itch.io/3d-worms-like', '', '']);", new THREE.Vector2(0.05, 0)));
    portfolioTextObjects.push(textObjects.at(-1));
    portfolioVisualObjects.push(wormsObject);

    textObjects.push(new textObject("Personal", personalObjectConvex, null, new THREE.Vector2(0.05, 0)));
    portfolioTextObjects.push(textObjects.at(-1));
    portfolioVisualObjects.push(personalObject);
    textObjects.push(new textObject("Professional", professionalObjectConvex, null, new THREE.Vector2(-0.05, 0)));
    portfolioTextObjects.push(textObjects.at(-1));
    portfolioVisualObjects.push(professionalObject);

    prevPickedTextObject = textObjects[0];

    // Setup hover objects
    hoverObjects.push(new hoverObject(orion, orionConvex, 0.1, 10));
    hoverObjects.push(new hoverObject(orion2, orion2Convex, 0.1, 10));
    hoverObjects.push(new hoverObject(spaceStationV, spaceStationVConvex, 0.05, 1));
    hoverObjects.push(new hoverObject(stylisedCharacterControllerObject, stylisedCharacterControllerObjectConvex, 0.4, 1));
    hoverObjects.push(new hoverObject(wormsObject, wormsObjectConvex, 0.4, 1));

    // Group visual objects
    spaceStationVGroup.add(spaceStationV);
    spaceStationVGroup.add(personalObject);
    spaceStationVGroup.add(professionalObject);
    spaceStationVGroup.add(stylisedCharacterControllerObject);
    spaceStationVGroup.add(wormsObject);
    group.add(spaceStationVGroup);
    group.add(orion);
    group.add(orion2);

    // Group hitbox objects
    spaceStationVGroupConvex.add(spaceStationVConvex);
    spaceStationVGroupConvex.add(personalObjectConvex);
    spaceStationVGroupConvex.add(professionalObjectConvex);
    spaceStationVGroupConvex.add(stylisedCharacterControllerObjectConvex);
    spaceStationVGroupConvex.add(wormsObjectConvex);
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
    personalObject.position.set(5, 3.5, 0);
    professionalObject.position.set(-5, 3.5, 0);
    stylisedCharacterControllerObject.position.set(5, 2.5, 0);
    wormsObject.position.set(5, 1.5, 0);
    orion.position.set(0, 0, 0);
    orion2.position.set(2 * spaceStationVDistance, 0, 0);

    spaceStationVGroupConvex.position.set(spaceStationVDistance, 0, 0);
    personalObjectConvex.position.set(5, 3.5, 0);
    professionalObjectConvex.position.set(-5, 3.5, 0);
    stylisedCharacterControllerObjectConvex.position.set(5, 2.5, 0);
    wormsObjectConvex.position.set(5, 1.5, 0);
    orionConvex.position.set(0, 0, 0);
    orion2Convex.position.set(2 * spaceStationVDistance, 0, 0);

    orion.getWorldPosition(tempV);
    discreteCameraPositions.push((new THREE.Vector3(0, 0.25, 2.5)).add(tempV));
    camera.position.x = discreteCameraPositions[0].x;
    camera.position.y = discreteCameraPositions[0].y;
    camera.position.z = discreteCameraPositions[0].z;
    targetCameraPosition = discreteCameraPositions[0];
    camera.getWorldPosition(tempV);
    spaceStationV.getWorldPosition(tempV);
    discreteCameraPositions.push((new THREE.Vector3(0, 0.5, 10)).add(tempV));
    orion2.getWorldPosition(tempV);
    discreteCameraPositions.push((new THREE.Vector3(0, 0.25, 2.5)).add(tempV));

    // Apply the custom outline to the visual objects
    group.traverse(node => node.applyOutline = true);

    // Add the groups to their respective scenes
    visualScene.add(group);
    physicalScene.add(groupConvex);

    // Take note of some common variables for ease of use during updates
    areModelsLoaded = true;


    for (let i = 1; i < portfolioTextObjects.length; i++) {
        portfolioTextObjects[i].subelem.hidden = true;
        portfolioVisualObjects[i].visible = false;
    }
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
}

onWindowResize();


/* ------------------------ Controls ----------------------- */
function onKeyDown ( event ) {
    switch ( event.code ) {
        case 'Escape': {
            closeLatestPopUp();
            break;
        }
    }
    if (isPopUpOpen) {return;}

    switch ( event.code ) {
        /*
        case 'ArrowUp':
        case 'KeyW': this.moveForward = true; break;
        */

        case 'ArrowLeft':
        case 'KeyA':
        {
            discreteCameraPositionsIndex--;
            discreteCameraPositionsIndex = clamp(discreteCameraPositionsIndex, 0, discreteCameraPositions.length - 1);
            if (discreteCameraPositionsIndex != 1)
            {
                disablePortfolio();
            }
            targetCameraPosition = discreteCameraPositions[discreteCameraPositionsIndex];
            break;
        }

        /*
        case 'ArrowDown':
        case 'KeyS': this.moveBackward = true; break;
        */

        case 'ArrowRight':
        case 'KeyD':
        {
            discreteCameraPositionsIndex++;
            discreteCameraPositionsIndex = clamp(discreteCameraPositionsIndex, 0, discreteCameraPositions.length - 1);
            if (discreteCameraPositionsIndex != 1)
            {
                disablePortfolio();
            }
            targetCameraPosition = discreteCameraPositions[discreteCameraPositionsIndex];
            break;
        }
    }
}

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
    return element == element.parentElement.querySelector(":hover");
}

function update()
{
    requestAnimationFrame(update); // Only update when tab open

    var deltaTime = clock.getDelta();

    if (areModelsLoaded && deltaTime != 0)
    {
        // Update counter t, used for lerping
        t += deltaTime;

        // Rotate the camera based on the mouse position
        camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, -mouse.x * Math.PI / 30, 0.1);
        camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, mouse.y * Math.PI / 30, 0.1);

        camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCameraPosition.x, 0.05);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCameraPosition.y, 0.05);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCameraPosition.z, 0.05);

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

            let offset = textObject.offset;

            // convert the normalized position to CSS coordinates
            let x = (tempV.x * .5 + .5);
            let y = (tempV.y * -.5 + .5);
            let offsetX = (x + (offset.x * scale));
            let offsetY = (y - (offset.y * scale));


            x *= canvas.clientWidth;
            y *= canvas.clientHeight;
            offsetX *= canvas.clientWidth;
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
            if (offset.x > 0)
            {
                elem.style.transform = `translate(0, -50%) translate(${offsetX}px, ${offsetY}px)`;
            }
            else if(offset.x < 0)
            {
                elem.style.transform = `translate(-100%, -50%) translate(${offsetX}px, ${offsetY}px)`;
            }
            else
            {
                elem.style.transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px)`;
            }

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

    document.addEventListener('keydown', onKeyDown, false);

    document.addEventListener('visibilitychange', onDocumentVisibilityChange, false);
    window.addEventListener('resize', onWindowResize, false);
}

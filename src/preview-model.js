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


let scene, camera, renderer, composer, pass, customOutline, effectFXAA;

const dimensions = () => {
    return {
        width: 386,
        height: (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) - 300,
    };
};

init();
render();

function onWindowResize() {
    camera.aspect = dimensions().width / dimensions().height;
    camera.updateProjectionMatrix();

    renderer.setSize(dimensions().width, dimensions().height);
    composer.setSize(dimensions().width, dimensions().height);
    effectFXAA.setSize(dimensions().width, dimensions().height);
    customOutline.setSize(dimensions().width, dimensions().height);

    render();
}

function init() {
    // Canvas
    const canvas = document.querySelector('canvas.webgl');

    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(55, dimensions().width / dimensions().height, 0.1, 1000);
    camera.position.z = 3;
    scene.add(camera);

    // Renderer
    renderer = new THREE.WebGLRenderer({
        canvas: canvas
    });
    renderer.setSize(dimensions().width, dimensions().height);
    /*
    renderer.setPixelRatio(window.devicePixelRatio);
    */

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
    const group = new THREE.Group();

    // Load models
    const loader = new GLTFLoader().setPath('../models/');
    loader.load('mitre.glb', function (gltf) {
        group.add(gltf.scene);
        render();
    });

    // Object
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    group.traverse(node => node.applyOutline = true);
    scene.add(group);

    render();

    // Subscribe to window resize
    window.addEventListener( 'resize', onWindowResize );
    onWindowResize();
}

function render() {
    composer.render();
}
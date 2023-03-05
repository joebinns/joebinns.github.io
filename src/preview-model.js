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


let scene, camera, renderer;

const dimensions = () => {
    return {
        width: 386,
        height: (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) - 300,
    };
};

init();
render();

function init() {
    // Canvas
    const canvas = document.querySelector('canvas.webgl')

    // Scene
    scene = new THREE.Scene()

    // Camera
    camera = new THREE.PerspectiveCamera(55, dimensions().width / dimensions().height)
    camera.position.z = 3
    scene.add(camera)

    // Renderer
    renderer = new THREE.WebGLRenderer({
        canvas: canvas
    })
    renderer.setSize(dimensions().width, dimensions().height)

    // Load models
    const loader = new GLTFLoader().setPath( '../models/' );
    loader.load( 'mitre.glb', function ( gltf ) {
        scene.add( gltf.scene );
        render();
    });

    //
    window.addEventListener( 'resize', onWindowResize );
}

function onWindowResize() {
    camera.aspect = dimensions().width / dimensions().height;
    camera.updateProjectionMatrix();

    renderer.setSize(dimensions().width, dimensions().height);

    render();
}

function render() {
    renderer.render(scene, camera)
}
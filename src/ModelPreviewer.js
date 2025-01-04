// Three.js
import * as THREE from "three";

// Render requirements
import { EffectComposer } from "effect-composer";
import { ShaderPass } from "shader-pass";
import { FXAAShader } from "fxaa-shader";

// Custom outline
import { CustomOutlinePass } from '/src/CustomOutlinePass.js';


let scene, camera, renderer, composer, customOutline, effectFXAA, objects, clock, time, mouse, picker, hoverRate, appearRate, hovered, speed, maximumDisplacement, angularSpeed, defaultAngularSpeed, angularDamper, preview, mesh;

const dimensions = () => {
    return {
        width: shouldDisplayPreview() ? 386 : 0,
        height: shouldDisplayPreview() ? (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) - 241 : 0,
    };
};

function shouldDisplayPreview() {
    return (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) > 800;
}

function onWindowResize() {
    const dimensions1 = dimensions();

    camera.aspect = dimensions1.width / dimensions1.height;
    camera.updateProjectionMatrix();

    preview.style.width = `${dimensions1.width}px`;
    preview.style.height = `${dimensions1.height}px`;

    renderer.setSize(dimensions1.width, dimensions1.height);
}

export class ModelPreviewer{
    constructor(portfolioItems) {
        this.portfolioItems = portfolioItems;
        this.Init();
        this.Update();
    }

    Init () {
        // Model preview
        preview = document.querySelector('.model-preview');

        // Canvas
        const canvas = document.querySelector('canvas.webgl');

        // Scene
        scene = new THREE.Scene();

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

        scene.add(new THREE.AmbientLight(0x404040)) 
  
        let geometry = new THREE.TorusGeometry(1, 0.4, 12, 48)
        let material = new THREE.PointsMaterial({ color: 0xFFFFFF, size: 0.02 })
        mesh = new THREE.Points(geometry, material)
        
        scene.add(mesh)

        // Subscribe to events
        window.addEventListener('resize', onWindowResize);
        onWindowResize();
    }

    Update () {
        requestAnimationFrame(()=>this.Update()); // Only update when tab open
        if (!shouldDisplayPreview()) return;

        renderer.render(scene, camera)
    }
}

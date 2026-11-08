import * as THREE from 'three';
import { EffectComposer } from 'effect-composer';
import { ShaderPass } from 'shader-pass';
import { BloomPass } from 'bloom-pass';
import { OutlinePass } from './OutlinePass.js';
import { IntensityBasedCircleGridShader } from './IntensityBasedCircleGridShader.js';
import { PreviewPhysics } from './PreviewPhysics.js';
import { shouldDisplayPreview } from './Preview.js';
import { isElementHovered } from './Utilities.js';

const SIZE = 386;
const axes = ['x', 'y', 'z'];

export class ModelPreviewer {
    constructor(items) {
        this.items = items;
        this.physics = new PreviewPhysics();
        this.preview = document.querySelector('.model-preview');
        this.canvas = this.preview.querySelector('canvas');
        this.mouse = new THREE.Vector2(-100, -100);
        this.raycaster = new THREE.Raycaster();
        this.hits = [];
        this.offset = new THREE.Vector3();
        // Match the former kick at 60 FPS, now as an instantaneous impulse.
        this.impulse = new THREE.Vector3(0, 0, -1100 / 60);
        this.shockwaveTime = 1;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x090909);
        this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 10);
        this.camera.position.z = 6;
        this.objects = new THREE.Group();
        for (const item of items) {
            item.object.visible = false;
            this.objects.add(item.object);
        }
        this.scene.add(this.objects);
        this.defaultItem = items.find(item => !item.element);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true });
        // The dot grid is intentionally rendered at CSS resolution.
        this.renderer.setSize(SIZE, SIZE);
        this.composer = new EffectComposer(this.renderer, new THREE.WebGLRenderTarget(SIZE, SIZE));
        this.outline = new OutlinePass(new THREE.Vector2(SIZE, SIZE), this.scene, this.camera);
        const uniforms = this.outline.fsQuad.material.uniforms;
        uniforms.outlineColor.value.set(0xffffff);
        // Bloom/grid consume a white-on-black mask; theme inversion happens last.
        uniforms.isDarkMode.value = true;
        uniforms.multiplierParameters.value.set(0.5, 75);
        this.composer.addPass(this.outline);
        this.composer.addPass(new BloomPass(1, 25, 4));
        this.grid = new ShaderPass(IntensityBasedCircleGridShader);
        this.grid.uniforms.iResolution.value.set(SIZE, SIZE, 1);
        this.composer.addPass(this.grid);
        this.darkMode = window.matchMedia('(prefers-color-scheme: dark)');
        this.motion = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.updateTheme = () => { this.grid.uniforms.IS_DARK_MODE.value = this.darkMode.matches; };
        this.updateTheme();
        this.darkMode.addEventListener('change', this.updateTheme);
        this.update = this.update.bind(this);
        this.sync = this.sync.bind(this);
        this.canvas.addEventListener('pointermove', event => this.updateMouse(event));
        this.canvas.addEventListener('pointerleave', () => {
            this.mouse.set(-100, -100);
            this.canvas.style.cursor = '';
        });
        this.canvas.addEventListener('pointerdown', event => {
            if (event.button !== 0) return;
            this.updateMouse(event);
            const hit = this.pick();
            if (hit) {
                this.offset.copy(hit.point).sub(this.objects.position);
                this.physics.applyImpulse(this.impulse, this.offset);
                this.shockwaveTime = 0;
            }
        });
        window.addEventListener('resize', this.sync);
        document.addEventListener('visibilitychange', this.sync);
        this.motion.addEventListener('change', this.sync);
        this.sync();
    }

    updateMouse(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.set((event.clientX - rect.left) / rect.width * 2 - 1,
            1 - (event.clientY - rect.top) / rect.height * 2);
    }

    pick() {
        if (Math.abs(this.mouse.x) > 1 || Math.abs(this.mouse.y) > 1) return null;
        this.scene.updateMatrixWorld();
        this.raycaster.setFromCamera(this.mouse, this.camera);
        this.hits.length = 0;
        // Raycaster also intersects invisible objects: only pass visible roots.
        for (const item of this.items) {
            if (item.object.visible) this.raycaster.intersectObject(item.object, true, this.hits);
        }
        const hit = this.hits.sort((a, b) => a.distance - b.distance)[0];
        this.canvas.style.cursor = hit ? 'pointer' : '';
        return hit;
    }

    sync() {
        const visible = shouldDisplayPreview();
        this.preview.style.width = visible ? `${SIZE}px` : '0px';
        this.preview.style.height = visible ? `${SIZE}px` : '0px';
        this.preview.hidden = !visible;
        const running = visible && !document.hidden;
        if (this.frame) cancelAnimationFrame(this.frame);
        this.frame = null;
        this.previousTime = null;
        this.physics.accumulator = 0;
        if (running) this.frame = requestAnimationFrame(this.update);
    }

    update(timestamp) {
        const delta = this.previousTime === null ? 0 : Math.min((timestamp - this.previousTime) / 1000, 0.25);
        this.previousTime = timestamp;
        this.shockwaveTime += delta;
        this.grid.uniforms.iTime.value = this.shockwaveTime;
        this.grid.uniforms.iMouse.value.copy(this.mouse);
        let selected = this.items.find(item => item.element && isElementHovered(item.element));
        selected ??= this.defaultItem;
        for (const item of this.items) {
            item.appeared = THREE.MathUtils.clamp(item.appeared + (item === selected ? 6 : -6) * delta, 0, 1);
            item.object.visible = item.appeared > 0;
            item.object.scale.setScalar(item.appeared);
        }
        const alpha = this.physics.advance(delta);
        for (const axis of axes) {
            this.objects.position[axis] = THREE.MathUtils.lerp(this.physics.previousPosition[axis], this.physics.position[axis], alpha);
            this.objects.rotation[axis] = THREE.MathUtils.lerp(this.physics.previousRotation[axis], this.physics.rotation[axis], alpha);
        }
        this.composer.render(delta);
        this.pick();
        this.frame = requestAnimationFrame(this.update);
    }
}

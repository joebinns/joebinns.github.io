// Three.js
import * as THREE from "three";

// Utilities
import { clamp, isElementHovered } from '../src/Utilities.js';

export class VideoSelector {
    constructor(videoItems) {
        this.videoItems = videoItems;

        this.Init();
        this.Update();
    }

    Init() {
        // Time
        this.clock = new THREE.Clock();
        this.time = 0;

        // Overlay
        this.overlay = document.getElementById('videotintoverlay');

        // Parameters
        this.rate = 4;
        this.maxOpacity = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 0.5 : 0.65;
    }

    Update() {
        requestAnimationFrame(()=>this.Update()); // Only update when tab open

        // Update time
        let deltaTime = this.clock.getDelta();
        this.time += deltaTime;

        // Update trigger elements
        this.videoItems.forEach(item => {
            if (isElementHovered(item.triggerElement)){
                item.isHovered = true;
                item.on += this.rate * deltaTime;
            }
            else {
                item.isHovered = false;
                item.on -= this.rate * deltaTime;
            }
            item.on = clamp(item.on, 0.0, 1.0);
        });

        // Update overlay
        let maxOn = 0;
        this.videoItems.forEach(item => {
            maxOn = Math.max(maxOn, item.on);
        });
        this.overlay.style.setProperty('--blur', 32 * (1 - maxOn) + 'px');

        // Update video elements
        this.videoItems.forEach(item => {
            item.videoElement.style.opacity = (item.on * this.maxOpacity).toString();
            item.videoElement.hidden = (item.on <= 0);
            item.wasHovered = item.isHovered;
        });

    }
}
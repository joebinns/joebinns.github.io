// Utilities
import { isElementHovered } from '../src/Utilities.js';

export class VideoSelector {
    constructor(videoItems) {
        this.videoItems = videoItems;
        this.videoItemsToFadeOut = [];
        this.videoItemToFadeIn = this.videoItems[0];

        this.Init();
        this.Update();
    }

    Init() {
        // Time
        this.time = performance.now() / 1000;

        // Overlay
        this.overlay = document.getElementById('videotintoverlay');

        // Parameters
        this.rate = 4;
        this.maxOpacity = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 0.5 : 0.65;
    }

    Update() {
        requestAnimationFrame(()=>this.Update()); // Only update when tab open

        // Update time
        const previousTime = this.time;
        this.time = performance.now() / 1000;
        const deltaTime = this.time - previousTime;

        // Find the currently hovered video (if any)
        let hoveredItem = null;

        for (const item of this.videoItems) {
            if (isElementHovered(item.triggerElement)) {
                hoveredItem = item;
                break;
            }
        }

        // Switch active video only if a different one is hovered
        if (hoveredItem && hoveredItem !== this.videoItemToFadeIn) {

            // Fade out the previous active video (only once)
            if (
                this.videoItemToFadeIn &&
                !this.videoItemsToFadeOut.includes(this.videoItemToFadeIn)
            ) {
                this.videoItemsToFadeOut.push(this.videoItemToFadeIn);
            }

            // Ensure the new active video isn't also fading out
            this.videoItemsToFadeOut = this.videoItemsToFadeOut.filter(
                item => item !== hoveredItem
            );

            this.videoItemToFadeIn = hoveredItem;
        }

        // Fade in the active video
        if (this.videoItemToFadeIn) {
            this.videoItemToFadeIn.on += this.rate * deltaTime;
            this.videoItemToFadeIn.on = Math.min(this.videoItemToFadeIn.on, 1);
        }

        // Fade out inactive videos
        for (let i = this.videoItemsToFadeOut.length - 1; i >= 0; i--) {
            const item = this.videoItemsToFadeOut[i];

            item.on -= this.rate * deltaTime;
            item.on = Math.max(item.on, 0);

            if (item.on === 0) {
                this.videoItemsToFadeOut.splice(i, 1);
            }
        }

        // Update overlay
        let maxOn = 0;
        for (const item of this.videoItems) {
            maxOn = Math.max(maxOn, item.on);
        }

        this.overlay.style.setProperty('--blur', `${32 * (1 - maxOn)}px`);

        // Update video elements
        for (const item of this.videoItems) {
            item.videoElement.style.opacity = (item.on * this.maxOpacity).toString();
            item.videoElement.hidden = item.on <= 0;
        }
    }
}
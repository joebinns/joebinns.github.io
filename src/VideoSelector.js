export class VideoSelector {
    constructor(items) {
        this.items = items.filter(item => item.videoElement && item.triggerElement);
        this.active = this.items[0];
        this.overlay = document.getElementById('videotintoverlay');
        this.motion = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.darkMode = window.matchMedia('(prefers-color-scheme: dark)');
        this.update = this.update.bind(this);
        for (const item of this.items) {
            item.triggerElement.addEventListener('pointerenter', () => this.select(item));
            item.triggerElement.addEventListener('focus', () => this.select(item));
        }
        document.addEventListener('visibilitychange', () => this.sync());
        this.motion.addEventListener('change', () => this.sync());
        this.darkMode.addEventListener('change', () => this.start());
        this.sync();
    }

    play(item) {
        const video = item.videoElement;
        if (!video.dataset.loaded) {
            for (const source of video.querySelectorAll('source[data-src]')) source.src = source.dataset.src;
            video.dataset.loaded = 'true';
            video.load();
        }
        // Muted inline autoplay can still be denied by browser/user policy.
        video.play().catch(() => {});
    }

    select(item) {
        if (this.active === item) return;
        this.active = item;
        this.sync();
    }

    sync() {
        if (this.frame) cancelAnimationFrame(this.frame);
        this.frame = null;
        if (document.hidden || this.motion.matches) {
            for (const item of this.items) {
                item.videoElement.pause();
                if (this.motion.matches) {
                    item.on = 0;
                    item.videoElement.hidden = true;
                }
            }
            return;
        }
        if (this.active) this.play(this.active);
        this.start();
    }

    start() {
        if (this.frame || document.hidden || this.motion.matches) return;
        this.previousTime = null;
        this.frame = requestAnimationFrame(this.update);
    }

    update(timestamp) {
        const delta = this.previousTime === null ? 0 : Math.min((timestamp - this.previousTime) / 1000, 0.25);
        this.previousTime = timestamp;
        const maxOpacity = this.darkMode.matches ? 0.5 : 0.65;
        let moving = false;
        let maxOn = 0;
        for (const item of this.items) {
            const target = item === this.active ? 1 : 0;
            item.on = Math.max(0, Math.min(1, item.on + (target ? 4 : -4) * delta));
            moving ||= item.on !== target;
            maxOn = Math.max(maxOn, item.on);
            item.videoElement.style.opacity = String(item.on * maxOpacity);
            item.videoElement.hidden = item.on === 0;
            if (item.on === 0 && item !== this.active) item.videoElement.pause();
        }
        this.overlay.style.setProperty('--blur', `${32 * (1 - maxOn)}px`);
        this.frame = moving ? requestAnimationFrame(this.update) : null;
    }
}

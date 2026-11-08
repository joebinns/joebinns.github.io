export function shouldDisplayPreview() {
    return window.innerWidth > 800 && window.innerHeight >= 692 &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Keep Three.js and model downloads out of the mobile page's initial load.
export function startModelPreview(items) {
    let loading = false;
    let loaded = null;
    let Previewer;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const stopListening = () => {
        window.removeEventListener('resize', start);
        document.removeEventListener('visibilitychange', start);
        motion.removeEventListener('change', start);
    };
    async function start() {
        if (loading || document.hidden || !shouldDisplayPreview()) return;
        if (loaded) {
            stopListening();
            if (loaded.length) {
                try { new Previewer(loaded); }
                catch (error) {
                    document.querySelector('.model-preview').hidden = true;
                    console.warn('Model preview unavailable:', error);
                }
            }
            return;
        }
        loading = true;
        try {
            const [module, models] = await Promise.all([
                import('./ModelPreviewer.js'),
                Promise.all(items.map(item => item.load())),
            ]);
            Previewer = module.ModelPreviewer;
            loaded = models.filter(Boolean);
        } catch (error) {
            stopListening();
            console.warn('Model preview unavailable:', error);
        } finally { loading = false; }
        if (loaded) start();
    }
    window.addEventListener('resize', start);
    document.addEventListener('visibilitychange', start);
    motion.addEventListener('change', start);
    start();
}

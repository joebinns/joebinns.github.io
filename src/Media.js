// Load article clips only when visible, including clips inside closed details.
const videos = [...document.querySelectorAll('video[data-autoplay]')];
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const visible = new Set();
function load(video) {
    if (video.dataset.loaded) return;
    for (const source of video.querySelectorAll('source[data-src]')) {
        source.src = source.dataset.src;
    }
    video.dataset.loaded = 'true';
    video.load();
}
function update(video) {
    if (visible.has(video) && !document.hidden) {
        load(video);
        if (!motion.matches) video.play().catch(() => {});
    } else video.pause();
}
if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
            if (entry.isIntersecting) visible.add(entry.target);
            else visible.delete(entry.target);
            update(entry.target);
        }
    });
    for (const video of videos) observer.observe(video);
} else {
    for (const video of videos) { visible.add(video); update(video); }
}
document.addEventListener('visibilitychange', () => videos.forEach(update));
motion.addEventListener('change', () => {
    for (const video of videos) {
        if (motion.matches) video.pause();
        else update(video);
    }
});

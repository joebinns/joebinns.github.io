// Each page has a different subset of icons. Remember its light-mode sources.
export function registerThemeImages(sources, attribute = 'src') {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const images = Object.entries(sources).flatMap(([id, dark]) => {
        const element = document.getElementById(id);
        return element ? [{ element, dark, light: element.getAttribute(attribute) }] : [];
    });
    const update = () => {
        for (const { element, dark, light } of images) {
            element.setAttribute(attribute, media.matches ? dark : light);
        }
    };
    media.addEventListener('change', update);
    update();
}

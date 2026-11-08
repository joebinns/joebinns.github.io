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

// The HTML href stays the light PDF so the CV also opens without JavaScript.
export function registerThemeLinks() {
    if (!window.matchMedia) return;
    // Match the CSS: light is an override of the site's default dark palette.
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const links = [...document.querySelectorAll('a[data-theme-dark]')].map(element => ({
        element,
        light: element.getAttribute('href'),
        dark: element.dataset.themeDark,
    }));
    const update = () => {
        for (const { element, light, dark } of links) {
            element.setAttribute('href', media.matches ? light : dark);
        }
    };
    media.addEventListener('change', update);
    update();
}

// Portfolio item
import { PortfolioItem } from '../src/PortfolioItem.js';

// Model previewer
import { startModelPreview } from './Preview.js';

let fidgettoytext = document.getElementById("fidget-toy-text");
let fidgettoyarrow = document.getElementById("fidget-toy-arrow");
let portfolioItems = [];

portfolioItems.push(
    new PortfolioItem(null, 'teapot-preview.glb'),
);

startModelPreview(portfolioItems);

import { registerThemeImages } from './Theme.js';
registerThemeImages({ 'fidget-toy-arrow': '/images/about/arrow.svg' });

function updateHint() {
    const visible = window.innerWidth > 800 && window.innerHeight >= 692 &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    fidgettoytext.hidden = !visible;
    fidgettoyarrow.hidden = !visible;
}
window.addEventListener('resize', updateHint);
window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', updateHint);
updateHint();

// Portfolio item
import { PortfolioItem } from '../src/PortfolioItem.js';

// Model previewer
import { ModelPreviewer } from '../src/ModelPreviewer.js';

let fidgettoytext = document.getElementById("fidget-toy-text");
let fidgettoyarrow = document.getElementById("fidget-toy-arrow");
let preview = document.querySelector('.model-preview');
let portfolioItems = [];

portfolioItems.push(
    new PortfolioItem(null, 'teapot.glb'),
);

let promises = [];
portfolioItems.forEach(item => {
    promises.push(item.promise)
});
Promise.all(promises).then(() => {
    new ModelPreviewer(portfolioItems);
});



// Dark mode
const userPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
if (userPrefersDark) {
    fidgettoyarrow.src="/images/about/arrow.svg";
}

Update();

function Update() {
    requestAnimationFrame(() => Update()); // Only update when tab open

    const isHidden = preview.style.width == `0px`;
    fidgettoytext.hidden = isHidden;
    fidgettoyarrow.hidden = isHidden;
}

/*
window.addEventListener('resize', onWindowResize);
onWindowResize();

function onWindowResize() {
    if (!shouldDisplayPreview()) {
        fidgettoy.hidden = false;
    }
}
*/

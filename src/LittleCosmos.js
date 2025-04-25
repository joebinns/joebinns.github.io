// Portfolio item
import { PortfolioItem } from '../src/PortfolioItem.js';

// Model previewer
import { ModelPreviewer } from '../src/ModelPreviewer.js';


let portfolioItems = [];

portfolioItems.push(
    new PortfolioItem(null, 'space-helmet.glb'),
    new PortfolioItem('njuma', 'easel.glb'),
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
    document.getElementById("normals").src="/images/little-cosmos/normals-dark.svg";
    document.getElementById("centers").src="/images/little-cosmos/center-distance-dark.svg";
    document.getElementById("surfaces").src="/images/little-cosmos/surface-distance-dark.svg";
    document.getElementById("sdf").src="/images/little-cosmos/sdf-dark.svg";
}
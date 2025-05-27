// Portfolio item
import { PortfolioItem } from './PortfolioItem.js';

// Model previewer
import { ModelPreviewer } from './ModelPreviewer.js';


let portfolioItems = [];

portfolioItems.push(
    new PortfolioItem(null, 'skull.glb'),
    new PortfolioItem('gardenOfTheSea', 'watering-can.glb'),
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
}
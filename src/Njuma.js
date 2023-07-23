// Portfolio item
import { PortfolioItem } from '../src/PortfolioItem.js';

// Model previewer
import { ModelPreviewer } from '../src/ModelPreviewer.js';


let portfolioItems = [];

portfolioItems.push(
    new PortfolioItem(null, 'car.glb'),
    new PortfolioItem('getMeOut', 'plane.glb'),
);

let promises = [];
portfolioItems.forEach(item => {
    promises.push(item.promise)
});
Promise.all(promises).then(() => {
    new ModelPreviewer(portfolioItems);
});
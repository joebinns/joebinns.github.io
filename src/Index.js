// Portfolio item
import { PortfolioItem } from '../src/PortfolioItem.js';

// Model previewer
import { ModelPreviewer } from '../src/ModelPreviewer.js';


let portfolioItems = [];

portfolioItems.push(
    new PortfolioItem('worms', 'crown.glb'),
    new PortfolioItem('ann', 'robot.glb'),
    new PortfolioItem('scc', 'question-mark-block.glb'),
    new PortfolioItem('pde', 'painting.glb'),
    new PortfolioItem('mLabs', 'arc-de-triomphe.glb'),
    new PortfolioItem('nBody', 'space-shuttle.glb')
);

let promises = [];
portfolioItems.forEach(item => {
    promises.push(item.promise)
});
Promise.all(promises).then(() => {
    new ModelPreviewer(portfolioItems);
});
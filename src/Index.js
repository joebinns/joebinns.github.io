// Portfolio item
import { PortfolioItem } from '../src/PortfolioItem.js';

// Model previewer
import { ModelPreviewer } from '../src/ModelPreviewer.js';


let portfolioItems = [];

portfolioItems.push(
    new PortfolioItem('njuma', 'question-mark-block.glb', 'worms2.mp4'),
    new PortfolioItem('getMeOut', 'plane.glb', 'worms.mp4'),
    new PortfolioItem('wordle', 'alphabet-block.glb', 'worms2.mp4'),
    new PortfolioItem('worms', 'crown.glb', 'worms.mp4'),
    new PortfolioItem('scc', 'spring.glb', 'worms2.mp4'),
    new PortfolioItem('mLabs', 'arc-de-triomphe.glb', 'worms2.mp4'),
    new PortfolioItem('ann', 'robot.glb', 'worms.mp4'),
    new PortfolioItem('pde', 'painting.glb', 'worms2.mp4'),
    new PortfolioItem('nBody', 'space-shuttle.glb', 'worms.mp4'),

);

let promises = [];
portfolioItems.forEach(item => {
    promises.push(item.promise)
});
Promise.all(promises).then(() => {
    new ModelPreviewer(portfolioItems);
});
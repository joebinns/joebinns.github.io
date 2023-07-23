// Portfolio item
import { PortfolioItem } from '../src/PortfolioItem.js';

// Model previewer
import { ModelPreviewer } from '../src/ModelPreviewer.js';


let portfolioItems = [];

portfolioItems.push(
    new PortfolioItem('njuma', 'car.glb', 'njuma.mp4'),
    new PortfolioItem('getMeOut', 'plane.glb', 'get-me-out.mp4'),
    new PortfolioItem('wordle', 'moka.glb', 'wordle.mp4'),
    new PortfolioItem('worms', 'crown.glb', 'worms.mp4'),
    new PortfolioItem('scc', 'saloon.glb', 'stylised-character-controller.mp4'),
    new PortfolioItem('mLabs', 'arc-de-triomphe.glb', ''),
    new PortfolioItem('ann', 'robot.glb', ''),
    new PortfolioItem('pde', 'painting.glb', ''),
    new PortfolioItem('nBody', 'space-shuttle.glb', ''),

);

let promises = [];
portfolioItems.forEach(item => {
    promises.push(item.promise)
});
Promise.all(promises).then(() => {
    new ModelPreviewer(portfolioItems);
});
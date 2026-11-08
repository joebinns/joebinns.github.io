// Portfolio item
import { PortfolioItem } from '../src/PortfolioItem.js';

// Model previewer
import { startModelPreview } from './Preview.js';


let portfolioItems = [];

portfolioItems.push(
    new PortfolioItem(null, 'robot.glb'),
    new PortfolioItem('pde', 'painting.glb'),
);

startModelPreview(portfolioItems);
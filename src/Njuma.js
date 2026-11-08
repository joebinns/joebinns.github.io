// Portfolio item
import { PortfolioItem } from '../src/PortfolioItem.js';

// Model previewer
import { startModelPreview } from './Preview.js';


let portfolioItems = [];

portfolioItems.push(
    new PortfolioItem(null, 'easel.glb'),
    new PortfolioItem('getMeOut', 'plane.glb'),
);

startModelPreview(portfolioItems);
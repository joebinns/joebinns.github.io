// Portfolio item
import { PortfolioItem } from '../src/PortfolioItem.js';

// Model previewer
import { startModelPreview } from './Preview.js';


let portfolioItems = [];

portfolioItems.push(
    new PortfolioItem(null, 'arc-de-triomphe.glb'),
    new PortfolioItem('cell', 'skull.glb'),
);

startModelPreview(portfolioItems);

// Portfolio item
import { PortfolioItem } from '../src/PortfolioItem.js';

// Model previewer
import { startModelPreview } from './Preview.js';


let portfolioItems = [];

portfolioItems.push(
    new PortfolioItem(null, 'crown.glb'),
    new PortfolioItem('scc', 'saloon.glb'),
);

startModelPreview(portfolioItems);
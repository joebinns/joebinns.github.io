// Portfolio item
import { PortfolioItem } from '../src/PortfolioItem.js';

// Model previewer
import { startModelPreview } from './Preview.js';


let portfolioItems = [];

portfolioItems.push(
    new PortfolioItem(null, 'saloon.glb'),
    new PortfolioItem('mLabs', 'arc-de-triomphe.glb'),
);

startModelPreview(portfolioItems);
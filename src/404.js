// Portfolio item
import { PortfolioItem } from '../src/PortfolioItem.js';

// Model previewer
import { startModelPreview } from './Preview.js';


let portfolioItems = [];

portfolioItems.push(
    new PortfolioItem(null, 'question-mark-block.glb'),
);

startModelPreview(portfolioItems);
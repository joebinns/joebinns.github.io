// Portfolio item
import { PortfolioItem } from '../src/PortfolioItem.js';

// Model previewer
import { startModelPreview } from './Preview.js';


let portfolioItems = [];

portfolioItems.push(
    new PortfolioItem(null, 'realistic-tree.glb'),
    new PortfolioItem('ann', 'robot.glb'),
);

startModelPreview(portfolioItems);

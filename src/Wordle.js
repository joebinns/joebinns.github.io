// Portfolio item
import { PortfolioItem } from '../src/PortfolioItem.js';

// Model previewer
import { startModelPreview } from './Preview.js';


let portfolioItems = [];

portfolioItems.push(
    new PortfolioItem(null, 'moka.glb'),
    new PortfolioItem('worms', 'crown.glb'),
);

startModelPreview(portfolioItems);
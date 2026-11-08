// Portfolio item
import { PortfolioItem } from '../src/PortfolioItem.js';

// Model previewer
import { startModelPreview } from './Preview.js';


let portfolioItems = [];

portfolioItems.push(
    new PortfolioItem(null, 'plane.glb'),
    new PortfolioItem('wordle', 'moka.glb'),
);

startModelPreview(portfolioItems);
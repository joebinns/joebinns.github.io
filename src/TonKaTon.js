// Portfolio item
import { PortfolioItem } from './PortfolioItem.js';

// Model previewer
import { startModelPreview } from './Preview.js';


let portfolioItems = [];

portfolioItems.push(
    new PortfolioItem(null, 'barricade.glb'),
    new PortfolioItem('crossings', 'skull.glb'),
);

startModelPreview(portfolioItems);
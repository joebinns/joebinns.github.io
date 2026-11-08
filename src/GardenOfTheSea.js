// Portfolio item
import { PortfolioItem } from './PortfolioItem.js';

// Model previewer
import { startModelPreview } from './Preview.js';


let portfolioItems = [];

portfolioItems.push(
    new PortfolioItem(null, 'watering-can.glb'),
    new PortfolioItem('littleCosmos', 'space-helmet.glb'),
);

startModelPreview(portfolioItems);



// Dark mode
const userPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
if (userPrefersDark) {
}
// Portfolio item
import { PortfolioItem } from './PortfolioItem.js';

// Model previewer
import { startModelPreview } from './Preview.js';


let portfolioItems = [];

portfolioItems.push(
    new PortfolioItem(null, 'skull.glb'),
    new PortfolioItem('gardenOfTheSea', 'watering-can.glb'),
);

startModelPreview(portfolioItems);



// Dark mode
const userPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
if (userPrefersDark) {
}
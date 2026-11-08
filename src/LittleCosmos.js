// Portfolio item
import { PortfolioItem } from '../src/PortfolioItem.js';

// Model previewer
import { startModelPreview } from './Preview.js';


let portfolioItems = [];

portfolioItems.push(
    new PortfolioItem(null, 'space-helmet.glb'),
    new PortfolioItem('njuma', 'easel.glb'),
);

startModelPreview(portfolioItems);



import { registerThemeImages } from './Theme.js';
registerThemeImages({
    normals: '/images/little-cosmos/normals-dark.svg',
    centers: '/images/little-cosmos/center-distance-dark.svg',
    surfaces: '/images/little-cosmos/surface-distance-dark.svg',
    sdf: '/images/little-cosmos/sdf-dark.svg',
});

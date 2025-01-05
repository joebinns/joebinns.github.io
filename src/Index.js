// Video item
import { VideoItem } from '../src/VideoItem.js';

// Video selector
import { VideoSelector } from '../src/VideoSelector.js';

// Portfolio item
import { PortfolioItem } from '../src/PortfolioItem.js';

// Model previewer
import { ModelPreviewer } from '../src/ModelPreviewer.js';

// Videos
let videoItems = [];
videoItems.push(
    new VideoItem('gardenOfTheSea', 'gardenOfTheSeaVid'),
    new VideoItem('littleCosmos', 'littleCosmosVid'),
    new VideoItem('njuma', 'njumaVid'),
    new VideoItem('getMeOut', 'getMeOutVid'),
    new VideoItem('wordle', 'wordleVid'),
    new VideoItem('worms', 'wormsVid'),
    new VideoItem('scc', 'sccVid'),
);

new VideoSelector(videoItems);

// Portfolio Items
let portfolioItems = [];

portfolioItems.push(
    new PortfolioItem('gardenOfTheSea', 'crystal-pedestal.glb'),
    new PortfolioItem('littleCosmos', 'space-helmet.glb'),
    new PortfolioItem('njuma', 'car.glb'),
    new PortfolioItem('getMeOut', 'plane.glb'),
    new PortfolioItem('wordle', 'moka.glb'),
    new PortfolioItem('worms', 'crown.glb'),
    new PortfolioItem('scc', 'saloon.glb'),
    new PortfolioItem('mLabs', 'arc-de-triomphe.glb'),
    new PortfolioItem('ann', 'robot.glb'),
    new PortfolioItem('pde', 'painting.glb'),
    new PortfolioItem('nBody', 'space-shuttle.glb')
);

let promises = [];
portfolioItems.forEach(item => {
    promises.push(item.promise)
});
Promise.all(promises).then(() => {
    new ModelPreviewer(portfolioItems);
});
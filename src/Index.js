// Video item
import { VideoItem } from '../src/VideoItem.js';

// Video selector
import { VideoSelector } from '../src/VideoSelector.js';

// Videos
let videoItems = [];
videoItems.push(
    new VideoItem('littleCosmos', 'littleCosmosVid'),
    new VideoItem('njuma', 'njumaVid'),
    new VideoItem('getMeOut', 'getMeOutVid'),
    new VideoItem('wordle', 'wordleVid'),
    new VideoItem('worms', 'wormsVid'),
    new VideoItem('scc', 'sccVid'),
);

new VideoSelector(videoItems);
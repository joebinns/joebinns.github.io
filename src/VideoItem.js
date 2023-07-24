export class VideoItem {
    constructor(triggerID, videoID) {
        this.triggerID = triggerID;
        this.videoID = videoID;

        this.triggerElement = triggerID ? document.getElementById(triggerID) : null;
        this.videoElement = videoID ? document.getElementById(videoID) : null;

        this.on = 0;
        this.isHovered = false;
        this.wasHovered = false;
    }
}
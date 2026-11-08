export class PortfolioItem {
    constructor(id, model) {
        this.element = id ? document.getElementById(id) : null;
        this.model = model;
        this.appeared = 0;
    }

    load() {
        if (!this.promise) {
            this.promise = import('gltf-loader')
                .then(({ GLTFLoader }) => new GLTFLoader().loadAsync(new URL('../models/' + this.model, import.meta.url).href))
                .then(gltf => { this.object = gltf.scene; return this; })
                .catch(error => { console.warn(`Could not load ${this.model}:`, error); return null; });
        }
        return this.promise;
    }
}

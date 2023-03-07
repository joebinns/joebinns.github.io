// glTF model loader
import { GLTFLoader } from "gltf-loader";


function loadGLTF(path) {
    return new Promise(resolve => {
        new GLTFLoader().load('../models/' + path, resolve);
    });
}

export class PortfolioItem {
    constructor(id, object) {
        this.id = id;
        if (id) this.element = document.getElementById(id);
        else this.element = null;

        this.promise = loadGLTF(object).then(gltf => { this.object = gltf.scene; });

        this.appeared = 0;
        this.hovered = 0;
    }
}
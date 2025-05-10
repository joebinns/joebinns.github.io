import * as THREE from "three";
import { Pass, FullScreenQuad } from "pass";

class BloomPass extends Pass {
    constructor(resolution, scene, camera) {
        super();

        this.renderScene = scene;
        this.renderCamera = camera;
        this.resolution = new THREE.Vector2(resolution.x, resolution.y);

        this.fsQuad = new FullScreenQuad(null);
        this.fsQuad.material = this.createBloomPostProcessMaterial();

        // Create a buffer to store the depth of the scene
        const depthTarget = new THREE.WebGLRenderTarget(
            this.resolution.x,
            this.resolution.y
        );
        depthTarget.texture.format = THREE.RGBAFormat;
        depthTarget.texture.minFilter = THREE.NearestFilter;
        depthTarget.texture.magFilter = THREE.NearestFilter;
        depthTarget.texture.generateMipmaps = false;
        depthTarget.stencilBuffer = false;
        depthTarget.depthBuffer = true;
        depthTarget.depthTexture = new THREE.DepthTexture();
        depthTarget.depthTexture.type = THREE.UnsignedShortType;
        this.depthTarget = depthTarget;
    }

    dispose() {
        this.depthTarget.dispose();
        this.fsQuad.dispose();
    }

    setSize(width, height) {
        this.resolution.set(width, height);

        this.fsQuad.material.uniforms.screenSize.value.set(
            this.resolution.x,
            this.resolution.y,
            1 / this.resolution.x,
            1 / this.resolution.y
        );
    }

    render(renderer, writeBuffer, readBuffer) {
        // Turn off writing to the depth buffer
        // because we need to read from it in the subsequent passes.
        const depthBufferValue = writeBuffer.depthBuffer;
        writeBuffer.depthBuffer = false;

        renderer.setRenderTarget(this.depthTarget);

        renderer.render(this.renderScene, this.renderCamera);

        this.fsQuad.material.uniforms["depthBuffer"].value =
            this.depthTarget.depthTexture;

        if (this.renderToScreen) {
            // If this is the last effect, then renderToScreen is true.
            // So we should render to the screen by setting target null
            // Otherwise, just render into the writeBuffer that the next effect will use as its read buffer.
            renderer.setRenderTarget(null);
            this.fsQuad.render(renderer);
        } else {
            renderer.setRenderTarget(writeBuffer);
            this.fsQuad.render(renderer);
        }

        // Reset the depthBuffer value so we continue writing to it in the next render.
        writeBuffer.depthBuffer = depthBufferValue;
    }

    get vertexShader() {
        return `
			varying vec2 vUv;
			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}
			`;
    }
    get fragmentShader() {
        return `
			#include <packing>
			// The above include imports "perspectiveDepthToViewZ"
			// and other GLSL functions from ThreeJS we need for reading depth.
			uniform sampler2D depthBuffer;
			uniform float cameraNear;
			uniform float cameraFar;
			uniform vec4 screenSize;

			varying vec2 vUv;

			// Helper functions for reading from depth buffer.
			float readDepth (sampler2D depthSampler, vec2 coord) {
				float fragCoordZ = texture2D(depthSampler, coord).x;
				float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
				return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
			}
			float getLinearDepth(vec3 pos) {
				return -(viewMatrix * vec4(pos, 1.0)).z;
			}

			float getLinearScreenDepth(sampler2D map) {
					vec2 uv = gl_FragCoord.xy * screenSize.zw;
					return readDepth(map,uv);
			}

			void main() {
				float depth = readDepth(depthBuffer, vUv + screenSize.zw);
				vec3 fragColor = vec3(step(depth, 0.99));
				vec4 fullFragColor = vec4(fragColor, 1.0);			
				gl_FragColor = fullFragColor;
			}
			`;
    }

    createBloomPostProcessMaterial() {
        return new THREE.ShaderMaterial({
            uniforms: {
                depthBuffer: {},
                cameraNear: { value: this.renderCamera.near },
                cameraFar: { value: this.renderCamera.far },
                screenSize: {
                    value: new THREE.Vector4(
                        this.resolution.x,
                        this.resolution.y,
                        1 / this.resolution.x,
                        1 / this.resolution.y
                    ),
                },
            },
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader,
        });
    }
}

export { BloomPass };
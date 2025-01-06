import * as THREE from "three";

// Based on this ShaderToy I made: https://www.shadertoy.com/view/lXKczD
const IntensityBasedCircleGridShader = {

	name: 'IntensityBasedCircleGridShader',
    
    uniforms: {
        tDiffuse: { value: null },
        iResolution: { value: new THREE.Vector3(window.innerWidth, window.innerHeight, 1) },
        GRID_HEIGHT: { value: 64.0 },
        MIN_RADIUS: { value: 0.0 },
        MAX_RADIUS: { value: 1.0 },
        MIN_INTENSITY: { value: 0.0 },
        MAX_INTENSITY: { value: 0.8 },
        IS_DARK_MODE: { value: false }
    },

    vertexShader: [`
        varying vec2 vUv;

        void main()
        {
            gl_Position = vec4(position.xy, 0.0, 1.0);
            vUv = uv;
        }
    `].join( "\n" ),

    fragmentShader: [`
        uniform sampler2D tDiffuse;
        uniform vec3 iResolution;

        uniform float GRID_HEIGHT;
        uniform float MIN_RADIUS;
        uniform float MAX_RADIUS;
        uniform float MIN_INTENSITY;
        uniform float MAX_INTENSITY;
        uniform bool IS_DARK_MODE;

        varying vec2 vUv;

        float circle(in vec2 st, in float radius)
        {
            float dist = length(st - 0.5);
            return radius == 0.0 ? 0.0 : smoothstep(GRID_HEIGHT / iResolution.y * 1.5, 0.0, dist - radius / 2.0);
        }

        float intensity(in vec3 col)
        { 
            return 0.299 * col.r + 0.587 * col.g + 0.114 * col.b;
        }

        float remap(float inMin, float inMax, float outMin, float outMax, float value)
        {
            float normalizedValue = clamp((value - inMin) / (inMax - inMin), 0.0, 1.0);
            return mix(outMin, outMax, normalizedValue);
        }

        void main()
        {
            vec2 gv = (vUv - 0.5) * iResolution.xy / iResolution.y;
            vec2 ouv = gv + 0.5;
            gv = fract(gv * GRID_HEIGHT);
            ouv = floor(ouv * GRID_HEIGHT) / GRID_HEIGHT;

            float mask = 0.0;
            for (float y = -1.0; y <= 1.0; y++) {
                for (float x = -1.0; x <= 1.0; x++) {
                    vec2 offset = vec2(x, y);
                    vec3 texCol = texture2D(tDiffuse, ouv + offset / GRID_HEIGHT).rgb;
                    float intensity = intensity(texCol);
                    float radius = remap(MIN_INTENSITY, MAX_INTENSITY, MIN_RADIUS, MAX_RADIUS, intensity * intensity);            
                    mask = max(mask, circle(gv - offset, radius));
                }
            }

            gl_FragColor = vec4(vec3(IS_DARK_MODE ? mask : 1.0 - mask), 1.0);
        }
        `
    ].join( "\n" )
};

export { IntensityBasedCircleGridShader };
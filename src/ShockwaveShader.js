import * as THREE from "three";

const ShockwaveShader = {

	name: 'ShockwaveShader',
    
    uniforms: {
        tDiffuse: { value: null },
        iResolution: { value: new THREE.Vector3(window.innerWidth, window.innerHeight, 1) },
        iMouse: { value: new THREE.Vector2(0.0, 0.0) },
        iTime: { value: 10.0 }
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
        uniform vec2 iMouse;
        uniform float iTime;

        varying vec2 vUv;

        void main()
        {
            float WaveParam1 = 20.0;
            float WaveParam2 = 0.8;
            float WaveParam3 = 0.12;
            
            vec2 texCoord = vUv;
            
            vec4 Color = texture2D(tDiffuse, texCoord);
            
            //Use this if you want to place the centre with the mouse instead
            vec2 WaveCentre = iMouse * 0.5 + vec2(0.5);

            float ratio = iResolution.y / iResolution.x;
            float Dist = distance(
                vec2(texCoord.x, texCoord.y * ratio),
                vec2(WaveCentre.x, WaveCentre.y * ratio)
            );
            
            //Below is optional and a change from the original but to my eyes it looks better,
            // it effectively removes the first few frames of the "animation"
            Dist = max(Dist, 0.12);
            
            //Sawtooth function to pulse from centre
            float CurrentTime = iTime * 0.8;
            
            //Only distort the pixels within the parameter distance from the centre
            if ((Dist <= ((CurrentTime) + (WaveParam3))) &&
                (Dist >= ((CurrentTime) - (WaveParam3))))
            {
                //The pixel offset distance based on the input parameters
                float Diff = (Dist - CurrentTime);
                float ScaleDiff = (1.0 - pow(abs(Diff * WaveParam1), WaveParam2));
                float DiffTime = (Diff * ScaleDiff);
                
                //The direction of the distortion
                vec2 DiffTexCoord = normalize(texCoord - WaveCentre);
                
                //Perform the distortion and reduce the effect over time
                texCoord += ((DiffTexCoord * DiffTime) / (CurrentTime * Dist * 50.0));
                Color = texture2D(tDiffuse, texCoord);
                
                //Blow out the color and reduce the effect over time
                Color += (Color * ScaleDiff) / (CurrentTime * Dist * 50.0);
            }
            
            //gl_FragColor = Color;

            gl_FragColor = texture2D(tDiffuse, texCoord);
        }
        `
    ].join( "\n" )
};

export { ShockwaveShader };
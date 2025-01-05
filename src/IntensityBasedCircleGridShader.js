const IntensityBasedCircleGridShader = {

	name: 'IntensityBasedCircleGridShader',
    
    uniforms: {
        "tDiffuse": { type: "t", value: null }
    },

    vertexShader: [`
        varying vec2 vUv;

        void main()
        {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `].join( "\n" ),

    fragmentShader: [`
        #define GRID_HEIGHT 48.0
        #define MIN_RADIUS 0.0
        #define MAX_RADIUS 1.4
        #define MIN_INTENSITY 0.1
        #define MAX_INTENSITY 1.0
        #define BACKGROUND 15.0/256.0
        #define FOREGROUND vec3(248.0/256.0, 239.0/256.0, 226.0/256.0)

        uniform sampler2D tDiffuse;

        varying vec2 vUv;

        void main()
        {
            vec4 texel = texture2D( tDiffuse, vUv );
            vec3 luma = vec3( 0.299, 0.587, 0.114 );
            float v = dot( texel.xyz, luma );
            gl_FragColor = vec4( v, 0.0, 0.0, texel.w );
        }
        `
    ].join( "\n" )
};

export { IntensityBasedCircleGridShader };

precision mediump float;

uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uTime;
uniform float uScroll;

varying vec2 vUv;


vec2 withRatio(vec2 uv, vec2 canvasSize, vec2 textureSize) {
    vec2 ratio = vec2(
        min((canvasSize.x / canvasSize.y) / (textureSize.x / textureSize.y), 1.0),
        min((canvasSize.y / canvasSize.x) / (textureSize.y / textureSize.x), 1.0)
    );

    return vec2(
        uv.x * ratio.x + (1.0 - ratio.x) * 0.5,
        uv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );
}

#pragma glslify: cnoise2 = require(glsl-noise/classic/2d)

void main() {
    float noise = cnoise2(vUv * 2. + 0.5 + sin(uTime / 2.));
    // mix: x(1 - a) + y * 1を返す（つまり線形補間）
    vec3 color = mix(uColor1, uColor2, noise);

    gl_FragColor.rgb = color;
    gl_FragColor.a = 1.0;
}
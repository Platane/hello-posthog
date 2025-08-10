#version 300 es
precision highp float;

uniform sampler2D u_colorTexture;



out vec4 outColor;

void main() {

    outColor = vec4(0.0, 0.0, 0.0, 0.0);

    ivec2 texSize_i = textureSize(u_colorTexture, 0).xy;
    vec2 texSize = vec2(texSize_i.x, texSize_i.y);

    float count = 0.0;
    float separation = 1.8;

    int size = 3;
     for (int i = -size; i <= size; ++i) {
        for (int j = -size; j <= size; ++j) {

            vec2 c =  (gl_FragCoord.xy + vec2(i, j) * separation) / texSize;

            outColor += texture(u_colorTexture, c);

            count += 1.0;
        }
    }

    outColor.rgba /= count;
}

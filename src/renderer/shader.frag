#version 300 es
precision highp float;

uniform sampler2D u_colorTexture;

in vec2 v_texCoord;
in float v_hue;

out vec4 outColor;

void main() {
    outColor = texture(u_colorTexture, v_texCoord);

    outColor.rgb = mix( outColor.rgb, vec3(0.30, 0.15, 0.03), v_hue * 0.2);

    // outColor.rgb *= (v_hue*0.1+1.0);

    // outColor = vec4(v_texCoord, 1.0, 1.0);

    if( outColor.a <= 0.0 ) {
        outColor = vec4(0.0, 1.0, 1.0, 0.5);
        discard;
    }
}

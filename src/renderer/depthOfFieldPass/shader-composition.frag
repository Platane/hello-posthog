#version 300 es
precision highp float;


uniform vec4 u_parameters;
uniform sampler2D u_colorTexture;
uniform sampler2D u_blurredTexture;
uniform sampler2D u_depthTexture;

out vec4 outColor;


void main() {

    float near = u_parameters[0];
    float far = u_parameters[1];
    float depthFocus = u_parameters[2];
    float depthFocusSpread = u_parameters[3];

    ivec2 texSize_i = textureSize(u_colorTexture, 0).xy;
    vec2 texSize = vec2(texSize_i.x, texSize_i.y);

    vec2 c =  gl_FragCoord.xy / texSize;

    float ndc = 2.0 * texture(u_depthTexture, c).r - 1.0;
    float depth = -(2.0 * far * near) / (ndc * (far - near) - far - near);

    float h = abs( depth - depthFocus) / depthFocusSpread;
    outColor = vec4(h,h,h, 1.0);

    outColor = mix( texture(u_colorTexture, c), texture(u_blurredTexture, c), clamp(h, 0.0, 1.0) );
}

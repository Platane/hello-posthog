#version 300 es


in vec2 a_position;
in vec2 a_texCoord;

in vec4 a_objectMatrix1;
in vec4 a_objectMatrix2;
in vec4 a_objectMatrix3;
in vec4 a_objectMatrix4;
in vec4 a_spriteBox;

uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;


out vec2 v_texCoord;
out vec4 v_color;


void main() {

    // as it is not possible to pass a mat as attribute,
    // pass 4 vec4 instead and reconstruct here
    mat4 a_objectMatrix = mat4(a_objectMatrix1, a_objectMatrix2, a_objectMatrix3, a_objectMatrix4);


    vec4 p = vec4(a_position,0.0,1.0);

    gl_Position = u_projectionMatrix * u_viewMatrix * a_objectMatrix * p;
    v_texCoord = mix( a_spriteBox.xy,a_spriteBox.zw, a_texCoord);
}

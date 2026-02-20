varying vec2 vUv;
uniform sampler2D uTexture;
uniform float uTime;
uniform float uIntensity;
uniform float uRandom;

void main() {
  vec2 uv = vUv;
  float offset = uIntensity * 0.08 * sin(uTime * 4.0 + uRandom);
  float r = texture2D(uTexture, uv + vec2(offset, 0.0)).r;
  float g = texture2D(uTexture, uv).g;
  float b = texture2D(uTexture, uv - vec2(offset, 0.0)).b;
  vec3 color = vec3(r + uIntensity * 0.3, g + uIntensity * 0.1, b - uIntensity * 0.2);
  gl_FragColor = vec4(color, 1.0);
}

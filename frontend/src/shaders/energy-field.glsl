varying vec2 vUv;
uniform sampler2D uTexture;
uniform float uTime;
uniform float uIntensity;
uniform vec3 uColor1;
uniform vec3 uColor2;

void main() {
  vec2 uv = vUv;
  vec2 displacement = uIntensity * 0.15 * vec2(sin(uv.y * 8.0 + uTime * 2.0), cos(uv.x * 8.0 - uTime * 1.5) * 0.5);
  vec4 color1 = texture2D(uTexture, uv + displacement);
  vec4 color2 = texture2D(uTexture, uv - displacement * 0.5);
  float mixFactor = 0.5 + 0.5 * sin(uTime * 2.0);
  vec3 blended = mix(color1.rgb, color2.rgb, mixFactor);
  float glow = uIntensity * 0.5 * sin(uTime * 5.0);
  vec3 energyColor = blended + glow * (uColor1 * 0.5 + uColor2 * 0.5);
  gl_FragColor = vec4(energyColor, 1.0);
}

varying vec2 vUv;
uniform sampler2D uTexture;
uniform float uTime;
uniform float uIntensity;
uniform vec3 uColor;

void main() {
  vec2 uv = vUv - 0.5;
  float dist = length(uv);
  float ripple = sin(dist * 30.0 - uTime * 6.0);
  ripple *= smoothstep(1.0, 0.0, dist);
  ripple *= uIntensity;
  vec3 fringe = vec3(ripple * 0.6, ripple * 0.9, ripple * 0.7);
  vec4 base = texture2D(uTexture, vUv);
  vec3 finalColor = base.rgb + fringe * uColor * 0.4;
  gl_FragColor = vec4(finalColor, 1.0);
}

varying vec2 vUv;
uniform sampler2D uTexture;
uniform float uTime;
uniform float uIntensity;
uniform float uProgress;
uniform vec3 uFromColor;
uniform vec3 uToColor;

void main() {
  vec2 uv = vUv;
  float alpha = 1.0 - uProgress;
  alpha *= uIntensity * smoothstep(0.3, 0.7, uProgress);
  vec3 glow = uToColor * (sin(uTime * 8.0 + uv.x * 10.0) * 0.5 + 0.5);
  vec3 color = mix(uFromColor, uToColor, uProgress + uv.y * 0.1);
  vec3 finalColor = color + glow * 0.3;
  gl_FragColor = vec4(finalColor, alpha);
}

varying vec2 vUv;
uniform sampler2D uTexture;
uniform float uTime;
uniform float uIntensity;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uCellSize;

vec2 random2D(vec2 p) {
  return fract(sin(vec2(dot(p, vec2(127.1, 311.7))) * 43758.5453));
}

void main() {
  vec2 uv = vUv;
  vec2 cell = floor(uv * uCellSize);
  vec2 local = fract(uv * uCellSize);
  vec2 point = random2D(cell);
  float dist = distance(local, point);
  float edge = 1.0 - smoothstep(0.02, 0.06, dist);
  float shatterX = sin(uTime * 12.0 + edge * 10.0) * uIntensity * 0.03;
  float shatterY = cos(uTime * 9.0 + edge * 8.0) * uIntensity * 0.03;
  vec4 color = texture2D(uTexture, uv + vec2(shatterX, shatterY));
  vec3 shattered = mix(uColor1, uColor2, edge);
  float chaos = uIntensity * edge * sin(uTime * 5.0);
  vec3 finalColor = shattered + chaos * vec3(0.2, 0.1, 0.3);
  gl_FragColor = vec4(finalColor, 1.0);
}

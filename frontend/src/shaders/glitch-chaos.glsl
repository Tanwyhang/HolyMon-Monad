varying vec2 vUv;
uniform sampler2D uTexture;
uniform float uTime;
uniform float uIntensity;
uniform float uRandom;

void main() {
  vec2 uv = vUv;
  vec2 blockOffset = floor(uv * 6.0) / 6.0;
  float blockNoise = fract(sin(dot(blockOffset, vec2(127.1, 311.7))) * 43758.5453) * uIntensity * 0.1;
  float chromaOffset = sin(uTime * 15.0 + uRandom) * uIntensity * 0.08;
  vec4 colorR = texture2D(uTexture, uv + vec2(chromaOffset, 0.0));
  vec4 colorG = texture2D(uTexture, uv);
  vec4 colorB = texture2D(uTexture, uv - vec2(chromaOffset, 0.0));
  float swap = step(0.5, fract(sin(dot(uv + uTime * 0.1, vec2(12.9898, 78.233)) * 43758.5453));
  vec4 final = mix(vec4(colorR.r, colorG.g, colorB.b, 1.0), vec4(colorG.r, colorB.g, colorR.b, 1.0), swap);
  float scanline = sin(uv.y * 100.0 + uTime * 10.0) * 0.5;
  final.rgb *= 1.0 - scanline * uIntensity * 0.3;
  gl_FragColor = final + blockNoise * 0.2;
}

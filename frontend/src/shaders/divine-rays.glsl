varying vec2 vUv;
uniform sampler2D uTexture;
uniform float uTime;
uniform float uIntensity;
uniform vec3 uColor;

void main() {
  vec2 uv = vUv;
  float beamCount = 5.0;
  float beamAngle = 3.14159 / beamCount;
  float beamIndex = floor(atan(uv.y - 1.0, uv.x) / beamAngle);
  float beam = smoothstep(0.96, 1.0, abs(sin(beamIndex * beamAngle + uTime * 2.0) * 0.5 - uv.x));
  beam *= uIntensity * sin(uTime * 3.0 + beamIndex) * 0.5;
  beam *= smoothstep(0.0, 1.0, 1.0 - uv.y);
  vec3 rayColor = uColor * beam;
  vec3 halo = uColor * (sin(uTime * 4.0) * 0.3 + 0.5) * uIntensity * 0.2;
  vec3 finalColor = rayColor + halo;
  gl_FragColor = vec4(finalColor, beam * 0.8);
}

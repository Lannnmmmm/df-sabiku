// ---------- partikel ----------

export const PARTICLE_VERT = /* glsl */ `
uniform float uTime;
uniform float uGrow;
uniform float uSpiral;
uniform float uCalm;
uniform float uIntro;
uniform float uScale;
uniform float uSizeK;
uniform float uMouseOn;
uniform float uAlpha;
uniform vec3 uOffset;
uniform vec2 uMouse;

attribute vec3 aPlant;
attribute vec3 aSpiral;
attribute vec3 aCalm;
attribute vec4 aRand;
attribute float aT;
attribute vec3 aColor;
attribute float aSize;

varying vec3 vColor;
varying float vAlpha;

const float PI = 3.14159265;

vec2 rot(vec2 v, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
}

void main() {
  // 0. awan biji; saat intro mengumpul dari sebaran yang lebih lebar
  vec3 cloud = position * mix(1.55, 1.0, uIntro);

  // 1. bergabung ke tumbuhan sesuai urutan tumbuh (aT)
  float jr = clamp((uGrow * 1.15 - aT) / 0.12, 0.0, 1.0);
  float j = jr * jr * (3.0 - 2.0 * jr);
  vec3 toPlant = aPlant - cloud;
  vec3 p = cloud + toPlant * j + cross(vec3(0.0, 0.0, 1.0), toPlant) * 0.18 * sin(PI * j);

  // 2. membentuk spiral filotaksis, berputar pelan
  float spr = clamp(uSpiral * 1.5 - aRand.w * 0.5, 0.0, 1.0);
  float sp = spr * spr * (3.0 - 2.0 * spr);
  vec3 sTarget = aSpiral;
  sTarget.xy = rot(sTarget.xy, uTime * 0.05 * (1.0 - uCalm));
  vec3 toSpiral = sTarget - p;
  p += toSpiral * sp + cross(vec3(0.0, 0.0, 1.0), toSpiral) * 0.12 * sin(PI * sp);

  // 3. menyebar kembali sebagai biji
  float cr = clamp(uCalm * 1.5 - aRand.z * 0.5, 0.0, 1.0);
  float ca = cr * cr * (3.0 - 2.0 * cr);
  vec3 toCalm = aCalm - p;
  p += toCalm * ca + cross(vec3(0.0, 0.0, 1.0), toCalm) * 0.1 * sin(PI * ca);

  // gerak halus: bebas untuk biji yang melayang, kecil untuk yang sudah menempel
  float loose = (1.0 - j) * (1.0 - sp);
  float amp = mix(0.05, 0.3, loose);
  amp = mix(amp, 0.34, ca);
  p += vec3(
    sin(uTime * 0.55 + aRand.x * 6.2831 + p.y * 0.9),
    sin(uTime * 0.47 + aRand.y * 6.2831 + p.x * 0.8),
    sin(uTime * 0.51 + aRand.z * 6.2831 + p.y * 0.7)
  ) * amp;
  // daun bergoyang tertiup angin
  p.x += sin(uTime * 0.8 + aPlant.y * 0.6) * 0.07 * j * clamp((aPlant.y + 3.0) / 6.0, 0.0, 1.0) * (1.0 - sp);

  p = p * uScale + uOffset;

  // partikel menjauh dari kursor
  vec2 d = p.xy - uMouse;
  float f = exp(-dot(d, d) * 0.5) * uMouseOn;
  p.xy += normalize(d + vec2(1e-4)) * f * 0.9;
  p.z += f * 0.8;

  // warna
  vec3 spiralCol = mix(vec3(0.18, 0.80, 0.44), vec3(0.66, 0.90, 0.81), clamp(length(aSpiral.xy) / 3.7, 0.0, 1.0));
  if (aRand.y > 0.94) spiralCol = vec3(0.95, 0.78, 0.76);
  vec3 col = mix(aColor, spiralCol, sp);
  col = mix(col, vec3(0.66, 0.90, 0.81) * 0.92, ca * 0.5);
  vColor = col;

  // kemunculan bertahap saat intro
  float ir = clamp(uIntro * 1.5 - aRand.x * 0.5, 0.0, 1.0);

  float grown = smoothstep(0.0, 0.25, uGrow) * (1.0 - sp);
  float twinkle = 0.78 + 0.22 * sin(uTime * 1.3 + aRand.x * 40.0);
  vAlpha = uAlpha * mix(0.9, 0.3 + 0.7 * j, grown) * twinkle * mix(1.0, 0.7, ca) * ir;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float sz = aSize * mix(1.0, 0.75, j) * ir;
  gl_PointSize = max(sz * uSizeK / -mv.z, 1.0);
}
`

export const PARTICLE_FRAG = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;

void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float core = smoothstep(0.5, 0.0, d);
  float a = core * core;
  gl_FragColor = vec4(vColor * (0.55 + 0.9 * a), a * vAlpha);
}
`

// ---------- foto semi-3D ----------

export const PHOTO_VERT = /* glsl */ `
uniform sampler2D uDepth;
uniform float uDepthAmt;
varying vec2 vUv;

void main() {
  vUv = uv;
  float d = texture2D(uDepth, uv).r;
  vec3 p = position;
  p.z += d * uDepthAmt;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`

export const PHOTO_FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform sampler2D uDepth;
uniform vec2 uMouse;
uniform vec2 uTexel;
uniform float uDissolve;
uniform float uOpacity;
uniform float uTime;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

void main() {
  float d = texture2D(uDepth, vUv).r;

  // paralaks: bagian yang lebih dekat bergeser lebih jauh saat mouse bergerak
  vec2 uv = clamp(vUv + uMouse * (d - 0.35) * 0.045, vec2(0.002), vec2(0.998));
  vec4 c = texture2D(uMap, uv);

  // cahaya lembut dari normal yang diturunkan dari peta kedalaman
  float dx = texture2D(uDepth, vUv + vec2(uTexel.x * 6.0, 0.0)).r - texture2D(uDepth, vUv - vec2(uTexel.x * 6.0, 0.0)).r;
  float dy = texture2D(uDepth, vUv + vec2(0.0, uTexel.y * 6.0)).r - texture2D(uDepth, vUv - vec2(0.0, uTexel.y * 6.0)).r;
  vec3 n = normalize(vec3(-dx * 3.0, -dy * 3.0, 1.0));
  vec3 L = normalize(vec3(uMouse.x * 0.8 - 0.3, uMouse.y * 0.8 + 0.5, 0.9));
  float lit = dot(n, L);
  c.rgb *= 0.93 + 0.2 * lit;

  // foto terurai menjadi partikel, dari bawah ke kepala
  float val = vnoise(vUv * 16.0 + uTime * 0.04) * 0.65 + vUv.y * 0.35;
  float thr = uDissolve * 1.08;
  if (val < thr) discard;
  float edge = smoothstep(thr + 0.07, thr, val);
  vec3 glow = vec3(0.50, 0.81, 0.63);
  c.rgb = mix(c.rgb, glow, edge * 0.85);

  float a = c.a * uOpacity;
  if (a < 0.01) discard;
  gl_FragColor = vec4(c.rgb, a);
}
`

// ---------- latar ----------

export const BG_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.999, 1.0);
}
`

export const BG_FRAG = /* glsl */ `
uniform float uGlow;
uniform vec2 uCenter;
uniform float uAspect;
varying vec2 vUv;

void main() {
  vec3 top = vec3(0.039, 0.122, 0.075);   // #0A1F13
  vec3 bottom = vec3(0.059, 0.165, 0.102); // #0F2A1A
  vec3 col = mix(bottom, top, smoothstep(0.0, 1.0, vUv.y));
  vec2 q = (vUv - uCenter) * vec2(uAspect, 1.0);
  float g = exp(-dot(q, q) * 2.6);
  col += vec3(0.07, 0.24, 0.15) * g * (0.45 + 0.55 * uGlow);
  // vinyet halus
  vec2 v = vUv - 0.5;
  col *= 1.0 - dot(v, v) * 0.55;
  gl_FragColor = vec4(col, 1.0);
}
`

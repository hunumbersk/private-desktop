import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const vertexShader = `
varying vec2 v_uv;
void main() {
  v_uv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const gridFragmentShader = `
uniform float u_time;
uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_gridSpeed;
uniform float u_lineWidth;

varying vec2 v_uv;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = (v_uv - vec2(0.5)) * u_resolution / min(u_resolution.x, u_resolution.y);
  float t = u_time * u_gridSpeed;
  float lineWidth = u_lineWidth / min(u_resolution.x, u_resolution.y);
  float grid = smoothstep(lineWidth, 0.0, abs(fract(uv.x * 5.0 + snoise(uv * 3.0 + t) * 0.5) - 0.5))
             + smoothstep(lineWidth, 0.0, abs(fract(uv.y * 5.0 + snoise(uv * 3.0 + t + 100.0) * 0.5) - 0.5));
  vec3 col = mix(vec3(0.0), vec3(0.02), snoise(uv * 2.0 + t * 0.1));
  float gridIntensity = smoothstep(0.1, 0.3, snoise(uv * 2.0 + t * 0.2));
  col += vec3(0.34, 0.61, 0.84) * gridIntensity * grid;
  gl_FragColor = vec4(col, 1.0);
}
`;

const crtFragmentShader = `
uniform float u_time;
uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_crtSpeed;
uniform sampler2D u_gridTexture;

varying vec2 v_uv;

void main() {
  vec2 uv = v_uv;
  // CRT barrel distortion
  uv = uv * 2.0 - 1.0;
  uv *= 1.1;
  float barrel = 1.0 + 0.2 * dot(uv, uv);
  uv *= barrel;
  uv = uv * 0.5 + 0.5;

  vec4 grid = texture2D(u_gridTexture, uv);
  vec3 color = vec3(0.0);

  // Scanline banding
  float scanline = sin(uv.y * 600.0 + u_time * u_crtSpeed * 10.0);
  color += grid.rgb * scanline;

  // RGB channel split
  float rgbSplit = 0.01;
  color.r += texture2D(u_gridTexture, uv + vec2(rgbSplit, 0.0)).r;
  color.g += texture2D(u_gridTexture, uv + vec2(-rgbSplit, 0.0)).g;
  color.b += texture2D(u_gridTexture, uv + vec2(0.0, rgbSplit)).b;

  // Vignette
  float vignette = 1.0 - 0.5 * length(v_uv - vec2(0.5));
  color *= vignette;

  // Center grid overlay
  float gridOverlay = smoothstep(0.01, 0.02, abs(fract(uv.x * 20.0) - 0.5));
  gridOverlay *= smoothstep(0.01, 0.02, abs(fract(uv.y * 20.0) - 0.5));
  color += gridOverlay * 0.1;

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
`;

function FullScreenTriangle(mesh: THREE.Mesh) {
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]);
  const uvs = new Float32Array([0, 0, 2, 0, 0, 2]);
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  mesh.geometry = geometry;
}

export default function CRTBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Cleanup any existing canvas
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const w = window.innerWidth;
    const h = window.innerHeight;

    // Camera
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Scenes
    const gridScene = new THREE.Scene();
    const crtScene = new THREE.Scene();

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Render target for grid pass
    const gridRenderTarget = new THREE.WebGLRenderTarget(w, h, {
      type: THREE.HalfFloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });

    // Grid material
    const gridUniforms = {
      u_time: { value: 0 },
      u_mouse: { value: new THREE.Vector2() },
      u_resolution: { value: new THREE.Vector2(w, h) },
      u_gridSpeed: { value: 0.2 },
      u_lineWidth: { value: 0.5 },
    };
    const gridMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: gridFragmentShader,
      uniforms: gridUniforms,
    });
    const gridMesh = new THREE.Mesh(new THREE.BufferGeometry(), gridMaterial);
    FullScreenTriangle(gridMesh);
    gridScene.add(gridMesh);

    // CRT material
    const crtUniforms = {
      u_time: { value: 0 },
      u_mouse: { value: new THREE.Vector2() },
      u_resolution: { value: new THREE.Vector2(w, h) },
      u_crtSpeed: { value: 0.1 },
      u_gridTexture: { value: gridRenderTarget.texture },
    };
    const crtMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: crtFragmentShader,
      uniforms: crtUniforms,
    });
    const crtMesh = new THREE.Mesh(new THREE.BufferGeometry(), crtMaterial);
    FullScreenTriangle(crtMesh);
    crtScene.add(crtMesh);

    // Clock
    const clock = new THREE.Clock();
    let disposed = false;

    // Animation loop
    const animate = () => {
      if (disposed) return;
      frameRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const t = delta * 0.001;

      crtMaterial.uniforms.u_time.value += t;
      gridMaterial.uniforms.u_time.value += t;

      // Render grid pass to texture
      renderer.setRenderTarget(gridRenderTarget);
      renderer.render(gridScene, camera);

      // Render CRT pass to screen
      renderer.setRenderTarget(null);
      renderer.render(crtScene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (disposed) return;
      const nw = window.innerWidth;
      const nh = window.innerHeight;
      renderer.setSize(nw, nh);
      gridRenderTarget.setSize(nw, nh);
      crtMaterial.uniforms.u_resolution.value.set(nw, nh);
      gridMaterial.uniforms.u_resolution.value.set(nw, nh);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      gridRenderTarget.dispose();
      gridMaterial.dispose();
      crtMaterial.dispose();
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="workspace-bg"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    />
  );
}

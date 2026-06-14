import { useEffect, useRef, useState } from 'react';

export default function SafeCRTBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'three' | 'css'>('three');

  useEffect(() => {
    // Check WebGL
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!gl) { setMode('css'); return; }
    } catch { setMode('css'); return; }

    // Try loading Three.js dynamically
    import('three').then((THREE) => {
      const container = containerRef.current;
      if (!container) return;
      try {
        const w = window.innerWidth, h = window.innerHeight;
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const scene = new THREE.Scene();
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.style.display = 'block';
        container.appendChild(renderer.domElement);

        // Simple grid shader
        const material = new THREE.ShaderMaterial({
          vertexShader: `varying vec2 v_uv; void main(){ v_uv=uv; gl_Position=vec4(position,1.0); }`,
          fragmentShader: `varying vec2 v_uv; uniform float u_time; void main(){ vec2 uv=v_uv; float g=smoothstep(0.02,0.0,abs(fract(uv.x*20.0)-0.5))+smoothstep(0.02,0.0,abs(fract(uv.y*20.0)-0.5)); vec3 col=vec3(0.02)+vec3(0.1,0.2,0.35)*g; gl_FragColor=vec4(col,1.0); }`,
          uniforms: { u_time: { value: 0 } },
        });

        const geo = new THREE.BufferGeometry();
        const v = new Float32Array([-1,-1,0, 3,-1,0, -1,3,0]);
        const u = new Float32Array([0,0, 2,0, 0,2]);
        geo.setAttribute('position', new THREE.BufferAttribute(v, 3));
        geo.setAttribute('uv', new THREE.BufferAttribute(u, 2));
        const mesh = new THREE.Mesh(geo, material);
        scene.add(mesh);

        let frame = 0;
        const clock = new THREE.Clock();
        const animate = () => {
          frame = requestAnimationFrame(animate);
          material.uniforms.u_time.value += clock.getDelta() * 0.001;
          renderer.render(scene, camera);
        };
        animate();

        const onResize = () => { renderer.setSize(window.innerWidth, window.innerHeight); };
        window.addEventListener('resize', onResize);

        (container as any).__cleanup = () => {
          cancelAnimationFrame(frame);
          window.removeEventListener('resize', onResize);
          renderer.dispose();
          geo.dispose();
          material.dispose();
          if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
        };
      } catch {
        setMode('css');
      }
    }).catch(() => setMode('css'));

    return () => {
      const c = containerRef.current;
      if (c && (c as any).__cleanup) (c as any).__cleanup();
    };
  }, []);

  if (mode === 'css') {
    return <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #0d0d0d 100%)', zIndex: 0 }} />;
  }

  return <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }} />;
}

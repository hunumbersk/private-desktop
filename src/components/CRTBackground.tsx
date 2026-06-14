import { useEffect, useRef, useState } from 'react';

export default function CRTBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(false);

  useEffect(() => {
    // Check WebGL support
    let supported = false;
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) supported = true;
    } catch { /* ignore */ }
    setHasWebGL(supported);
  }, []);

  useEffect(() => {
    if (!hasWebGL || !containerRef.current) return;

    let disposed = false;
    let frameId = 0;
    const container = containerRef.current;

    // Dynamic import Three.js to avoid crash during module loading
    import('three').then((THREE) => {
      if (disposed) return;

      try {
        const w = window.innerWidth;
        const h = window.innerHeight;

        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const gridScene = new THREE.Scene();
        const crtScene = new THREE.Scene();

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.style.display = 'block';
        container.appendChild(renderer.domElement);

        const gridRenderTarget = new THREE.WebGLRenderTarget(w, h, {
          type: THREE.HalfFloatType,
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
        });

        // Shaders
        const vertexShader = `
          varying vec2 v_uv;
          void main() { v_uv = uv; gl_Position = vec4(position, 1.0); }
        `;

        const gridFragmentShader = `
          uniform float u_time;
          uniform vec2 u_resolution;
          varying vec2 v_uv;
          vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
          float snoise(vec2 v) {
            const vec4 C = vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
            vec2 i=floor(v+dot(v,C.yy)); vec2 x0=v-i+dot(i,C.xx);
            vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
            vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1; i=mod(i,289.0);
            vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
            vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
            m=m*m; m=m*m;
            vec3 x=2.0*fract(p*C.www)-1.0;
            vec3 h=abs(x)-0.5; vec3 ox=floor(x+0.5); vec3 a0=x-ox;
            m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
            vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw;
            return 130.0*dot(m,g);
          }
          void main() {
            vec2 uv=(v_uv-vec2(0.5))*u_resolution/min(u_resolution.x,u_resolution.y);
            float t=u_time*0.2;
            float lw=0.5/min(u_resolution.x,u_resolution.y);
            float grid=smoothstep(lw,0.0,abs(fract(uv.x*5.0+snoise(uv*3.0+t)*0.5)-0.5))
                      +smoothstep(lw,0.0,abs(fract(uv.y*5.0+snoise(uv*3.0+t+100.0)*0.5)-0.5));
            vec3 col=mix(vec3(0.0),vec3(0.02),snoise(uv*2.0+t*0.1));
            float gi=smoothstep(0.1,0.3,snoise(uv*2.0+t*0.2));
            col+=vec3(0.34,0.61,0.84)*gi*grid;
            gl_FragColor=vec4(col,1.0);
          }
        `;

        const crtFragmentShader = `
          uniform float u_time;
          uniform vec2 u_resolution;
          uniform sampler2D u_gridTexture;
          varying vec2 v_uv;
          void main() {
            vec2 uv=v_uv*2.0-1.0; uv*=1.1;
            float barrel=1.0+0.2*dot(uv,uv); uv*=barrel; uv=uv*0.5+0.5;
            vec4 grid=texture2D(u_gridTexture,uv);
            vec3 color=vec3(0.0);
            float scanline=sin(uv.y*600.0+u_time*1.0);
            color+=grid.rgb*scanline;
            float rgbSplit=0.01;
            color.r+=texture2D(u_gridTexture,uv+vec2(rgbSplit,0.0)).r;
            color.g+=texture2D(u_gridTexture,uv+vec2(-rgbSplit,0.0)).g;
            color.b+=texture2D(u_gridTexture,uv+vec2(0.0,rgbSplit)).b;
            float vignette=1.0-0.5*length(v_uv-vec2(0.5));
            color*=vignette;
            float gridOverlay=smoothstep(0.01,0.02,abs(fract(uv.x*20.0)-0.5));
            gridOverlay*=smoothstep(0.01,0.02,abs(fract(uv.y*20.0)-0.5));
            color+=gridOverlay*0.1;
            gl_FragColor=vec4(color,1.0);
          }
        `;

        // Full screen triangle geometry
        const fsGeo = new THREE.BufferGeometry();
        const vertices = new Float32Array([-1,-1,0,3,-1,0,-1,3,0]);
        const uvs = new Float32Array([0,0,2,0,0,2]);
        fsGeo.setAttribute('position', new THREE.BufferAttribute(vertices,3));
        fsGeo.setAttribute('uv', new THREE.BufferAttribute(uvs,2));

        // Grid pass
        const gridUniforms = {
          u_time:{value:0},u_resolution:{value:new THREE.Vector2(w,h)},
        };
        const gridMat = new THREE.ShaderMaterial({
          vertexShader,fragmentShader:gridFragmentShader,uniforms:gridUniforms,
        });
        const gridMesh = new THREE.Mesh(fsGeo,gridMat);
        gridScene.add(gridMesh);

        // CRT pass
        const crtUniforms = {
          u_time:{value:0},u_resolution:{value:new THREE.Vector2(w,h)},
          u_gridTexture:{value:gridRenderTarget.texture},
        };
        const crtMat = new THREE.ShaderMaterial({
          vertexShader,fragmentShader:crtFragmentShader,uniforms:crtUniforms,
        });
        const crtMesh = new THREE.Mesh(fsGeo.clone(),crtMat);
        crtScene.add(crtMesh);

        const clock = new THREE.Clock();

        const animate = () => {
          if (disposed) return;
          frameId = requestAnimationFrame(animate);
          const t = clock.getDelta()*0.001;
          crtMat.uniforms.u_time.value += t;
          gridMat.uniforms.u_time.value += t;
          renderer.setRenderTarget(gridRenderTarget);renderer.render(gridScene,camera);
          renderer.setRenderTarget(null);renderer.render(crtScene,camera);
        };
        animate();

        const handleResize = () => {
          if (disposed) return;
          const nw=window.innerWidth,nh=window.innerHeight;
          renderer.setSize(nw,nh);gridRenderTarget.setSize(nw,nh);
          crtMat.uniforms.u_resolution.value.set(nw,nh);
          gridMat.uniforms.u_resolution.value.set(nw,nh);
        };
        window.addEventListener('resize',handleResize);

        // Store cleanup
        (container as any).__cleanup = () => {
          disposed = true;
          cancelAnimationFrame(frameId);
          window.removeEventListener('resize',handleResize);
          renderer.dispose();
          gridRenderTarget.dispose();
          gridMat.dispose();
          crtMat.dispose();
          fsGeo.dispose();
          if (renderer.domElement.parentNode === container) {
            container.removeChild(renderer.domElement);
          }
        };
      } catch (err) {
        console.error('[CRT] Three.js init failed:', err);
      }
    }).catch((err) => {
      console.error('[CRT] Three.js import failed:', err);
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      if ((container as any).__cleanup) {
        (container as any).__cleanup();
      }
    };
  }, [hasWebGL]);

  if (!hasWebGL) {
    return (
      <div style={{ position:'absolute',top:0,left:0,width:'100%',height:'100%',zIndex:0,
        background:'radial-gradient(ellipse at center,#1a1a1a 0%,#0d0d0d 100%)' }} />
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ position:'absolute',top:0,left:0,width:'100%',height:'100%',zIndex:0 }}
    />
  );
}

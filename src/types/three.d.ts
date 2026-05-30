declare module 'three' {
  export class WebGLRenderer {
    constructor(options?: { alpha?: boolean; antialias?: boolean });
    setSize(w: number, h: number): void;
    setPixelRatio(v: number): void;
    get domElement(): HTMLCanvasElement;
    dispose(): void;
    setRenderTarget(target: WebGLRenderTarget | null): void;
    render(scene: Scene, camera: Camera): void;
  }
  export class Scene {
    add(obj: Object3D): void;
  }
  export class Object3D {
    geometry: BufferGeometry;
    material: Material;
    layers: Layers;
  }
  export class Layers {
    enable(id: number): void;
    disable(id: number): void;
  }
  export class Mesh extends Object3D {
    constructor(geometry?: BufferGeometry, material?: Material);
  }
  export class BufferGeometry {
    setAttribute(name: string, attribute: BufferAttribute): void;
  }
  export class BufferAttribute {
    constructor(array: Float32Array, itemSize: number);
  }
  export class ShaderMaterial extends Material {
    constructor(options: { vertexShader: string; fragmentShader: string; uniforms: Record<string, { value: any }> });
    uniforms: Record<string, { value: any }>;
    dispose(): void;
  }
  export class Material {
    dispose(): void;
  }
  export class OrthographicCamera extends Object3D {
    constructor(left: number, right: number, top: number, bottom: number, near: number, far: number);
  }
  export class WebGLRenderTarget {
    constructor(w: number, h: number, options?: { type?: number; minFilter?: number; magFilter?: number });
    texture: Texture;
    setSize(w: number, h: number): void;
    dispose(): void;
  }
  export class Texture {
    dispose(): void;
  }
  export class Clock {
    getDelta(): number;
  }
  export class Vector2 {
    constructor(x?: number, y?: number);
    set(x: number, y: number): void;
  }
  export const HalfFloatType: number;
  export const LinearFilter: number;
  export const Camera: typeof Object3D;
}

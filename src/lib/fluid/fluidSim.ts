import {
  GPUComposer,
  GPULayer,
  GPUProgram,
  FLOAT,
  INT,
  REPEAT,
  NEAREST,
  LINEAR,
  WEBGL2,
  GLSL3,
  GLSL1,
  isWebGL2Supported,
} from 'gpu-io';
import { FLUID_CONFIG } from './config';

const {
  VELOCITY_SCALE_FACTOR,
  NUM_JACOBI_ITERATIONS,
  MAX_VELOCITY,
  TOUCH_FORCE_SCALE,
  TOUCH_FORCE_SCALE_MOBILE,
  TOUCH_THICKNESS,
  TOUCH_THICKNESS_MOBILE,
  VECTOR_SPACING_DESKTOP,
  VECTOR_SPACING_MOBILE,
  VECTOR_SCALE,
  VECTOR_SCALE_MOBILE,
  MARKER_COLOR,
  MARKER_COLOR_MOBILE,
  MARKER_COLOR_HOVER,
  HOVER_HALO_INNER_PX,
  HOVER_HALO_OUTER_PX,
  HOVER_TRAIL_DECAY,
} = FLUID_CONFIG;

const PRESSURE_CALC_ALPHA = -1;
const PRESSURE_CALC_BETA = 0.25;

export class FluidSimulation {
  private composer!: GPUComposer;
  private velocityState!: GPULayer;
  private divergenceState!: GPULayer;
  private pressureState!: GPULayer;
  private trailState!: GPULayer;

  private advection!: GPUProgram;
  private divergence2D!: GPUProgram;
  private jacobi!: GPUProgram;
  private gradientSubtraction!: GPUProgram;
  private touchProgram!: GPUProgram;
  private trailProgram!: GPUProgram;
  private dashColorProgram!: GPUProgram;

  private canvas: HTMLCanvasElement;
  private isMobile: boolean;
  private animFrameId: number | null = null;
  private _initialized = false;
  private frameCount = 0;

  private activeTouches: Record<number, { current: [number, number]; last?: [number, number] }> = {};

  // Hover-color state. Cursor in CSS pixels, halo intensity in [0, 1].
  // Desktop: latches to 1 on first pointermove (fades back if pointer leaves
  // the viewport). Mobile: lifts on pointerdown, fades on pointerup.
  private cursorPx: [number, number] = [-9999, -9999];
  private cursorActive = false;
  private haloIntensity = 0;
  private canvasSizePx: [number, number] = [1, 1];

  // Mobile scroll protection
  private isScrolling = false;
  private scrollTimeout: number | null = null;

  // Bound handlers for cleanup
  private boundPointerMove: (e: PointerEvent) => void;
  private boundPointerStop: (e: PointerEvent) => void;
  private boundContextLost: (e: Event) => void;
  private boundScroll: () => void;
  private boundCursorEnter: () => void;
  private boundCursorLeave: () => void;

  constructor(canvas: HTMLCanvasElement, isMobile: boolean) {
    this.canvas = canvas;
    this.isMobile = isMobile;

    this.boundPointerMove = this.onPointerMove.bind(this);
    this.boundPointerStop = this.onPointerStop.bind(this);
    this.boundContextLost = (e: Event) => { e.preventDefault(); this.pause(); };
    this.boundScroll = () => {
      this.isScrolling = true;
      if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
      this.scrollTimeout = window.setTimeout(() => { this.isScrolling = false; }, 150);
    };
    this.boundCursorEnter = () => { this.cursorActive = true; };
    this.boundCursorLeave = () => { this.cursorActive = false; };

    try {
      const glslVersion = isWebGL2Supported() ? GLSL3 : GLSL1;
      const contextID = isWebGL2Supported() ? WEBGL2 : 'webgl';

      this.composer = new GPUComposer({
        canvas,
        contextID,
        glslVersion,
        clearValue: 0,
      });

      const width = canvas.clientWidth || window.innerWidth;
      const height = canvas.clientHeight || window.innerHeight;
      const velW = Math.ceil(width / VELOCITY_SCALE_FACTOR);
      const velH = Math.ceil(height / VELOCITY_SCALE_FACTOR);

      // --- GPU Layers ---
      this.velocityState = new GPULayer(this.composer, {
        name: 'velocity',
        dimensions: [velW, velH],
        type: FLOAT,
        filter: LINEAR,
        numComponents: 2,
        wrapX: REPEAT,
        wrapY: REPEAT,
        numBuffers: 2,
      });

      this.divergenceState = new GPULayer(this.composer, {
        name: 'divergence',
        dimensions: [velW, velH],
        type: FLOAT,
        filter: NEAREST,
        numComponents: 1,
        wrapX: REPEAT,
        wrapY: REPEAT,
      });

      this.pressureState = new GPULayer(this.composer, {
        name: 'pressure',
        dimensions: [velW, velH],
        type: FLOAT,
        filter: NEAREST,
        numComponents: 1,
        wrapX: REPEAT,
        wrapY: REPEAT,
        numBuffers: 2,
      });

      // Hover trail — single-channel scalar at velocity-layer resolution.
      // LINEAR filter so the dash shader reads a smooth value across the
      // (lower-res) layer.
      this.trailState = new GPULayer(this.composer, {
        name: 'trail',
        dimensions: [velW, velH],
        type: FLOAT,
        filter: LINEAR,
        numComponents: 1,
        numBuffers: 2,
      });

      // --- GPU Programs ---
      this.advection = new GPUProgram(this.composer, {
        name: 'advection',
        fragmentShader: `
          in vec2 v_uv;
          uniform sampler2D u_state;
          uniform sampler2D u_velocity;
          uniform vec2 u_dimensions;
          out vec2 out_state;
          void main() {
            out_state = texture(u_state, v_uv - texture(u_velocity, v_uv).xy / u_dimensions).xy;
          }`,
        uniforms: [
          { name: 'u_state', value: 0, type: INT },
          { name: 'u_velocity', value: 1, type: INT },
          { name: 'u_dimensions', value: [width, height], type: FLOAT },
        ],
      });

      this.divergence2D = new GPUProgram(this.composer, {
        name: 'divergence2D',
        fragmentShader: `
          in vec2 v_uv;
          uniform sampler2D u_vectorField;
          uniform vec2 u_pxSize;
          out float out_divergence;
          void main() {
            float n = texture(u_vectorField, v_uv + vec2(0, u_pxSize.y)).y;
            float s = texture(u_vectorField, v_uv - vec2(0, u_pxSize.y)).y;
            float e = texture(u_vectorField, v_uv + vec2(u_pxSize.x, 0)).x;
            float w = texture(u_vectorField, v_uv - vec2(u_pxSize.x, 0)).x;
            out_divergence = 0.5 * (e - w + n - s);
          }`,
        uniforms: [
          { name: 'u_vectorField', value: 0, type: INT },
          { name: 'u_pxSize', value: [1 / velW, 1 / velH], type: FLOAT },
        ],
      });

      this.jacobi = new GPUProgram(this.composer, {
        name: 'jacobi',
        fragmentShader: `
          in vec2 v_uv;
          uniform float u_alpha;
          uniform float u_beta;
          uniform vec2 u_pxSize;
          uniform sampler2D u_previousState;
          uniform sampler2D u_divergence;
          out vec4 out_jacobi;
          void main() {
            vec4 n = texture(u_previousState, v_uv + vec2(0, u_pxSize.y));
            vec4 s = texture(u_previousState, v_uv - vec2(0, u_pxSize.y));
            vec4 e = texture(u_previousState, v_uv + vec2(u_pxSize.x, 0));
            vec4 w = texture(u_previousState, v_uv - vec2(u_pxSize.x, 0));
            vec4 d = texture(u_divergence, v_uv);
            out_jacobi = (n + s + e + w + u_alpha * d) * u_beta;
          }`,
        uniforms: [
          { name: 'u_alpha', value: PRESSURE_CALC_ALPHA, type: FLOAT },
          { name: 'u_beta', value: PRESSURE_CALC_BETA, type: FLOAT },
          { name: 'u_pxSize', value: [1 / velW, 1 / velH], type: FLOAT },
          { name: 'u_previousState', value: 0, type: INT },
          { name: 'u_divergence', value: 1, type: INT },
        ],
      });

      this.gradientSubtraction = new GPUProgram(this.composer, {
        name: 'gradientSubtraction',
        fragmentShader: `
          in vec2 v_uv;
          uniform vec2 u_pxSize;
          uniform sampler2D u_scalarField;
          uniform sampler2D u_vectorField;
          out vec2 out_result;
          void main() {
            float n = texture(u_scalarField, v_uv + vec2(0, u_pxSize.y)).r;
            float s = texture(u_scalarField, v_uv - vec2(0, u_pxSize.y)).r;
            float e = texture(u_scalarField, v_uv + vec2(u_pxSize.x, 0)).r;
            float w = texture(u_scalarField, v_uv - vec2(u_pxSize.x, 0)).r;
            out_result = texture(u_vectorField, v_uv).xy - 0.5 * vec2(e - w, n - s);
          }`,
        uniforms: [
          { name: 'u_pxSize', value: [1 / velW, 1 / velH], type: FLOAT },
          { name: 'u_scalarField', value: 0, type: INT },
          { name: 'u_vectorField', value: 1, type: INT },
        ],
      });

      this.touchProgram = new GPUProgram(this.composer, {
        name: 'touch',
        fragmentShader: `
          in vec2 v_uv;
          in vec2 v_uv_local;
          uniform sampler2D u_velocity;
          uniform vec2 u_vector;
          uniform float u_forceScale;
          out vec2 out_velocity;
          void main() {
            vec2 radialVec = (v_uv_local * 2.0 - 1.0);
            float radiusSq = dot(radialVec, radialVec);
            vec2 velocity = texture(u_velocity, v_uv).xy + (1.0 - radiusSq) * u_vector * u_forceScale;
            float velocityMag = length(velocity);
            out_velocity = velocity / max(velocityMag, 0.001) * min(velocityMag, ${MAX_VELOCITY.toFixed(1)});
          }`,
        uniforms: [
          { name: 'u_velocity', value: 0, type: INT },
          { name: 'u_vector', value: [0, 0], type: FLOAT },
          { name: 'u_forceScale', value: isMobile ? TOUCH_FORCE_SCALE_MOBILE : TOUCH_FORCE_SCALE, type: FLOAT },
        ],
      });

      // Trail update — runs each frame, reading the previous trail value,
      // applying decay, and OR-ing in the current cursor halo. The result is
      // a soft scalar field that lights up where the cursor is and fades
      // smoothly behind it.
      this.trailProgram = new GPUProgram(this.composer, {
        name: 'trailUpdate',
        fragmentShader: `
          in vec2 v_uv;
          uniform sampler2D u_previousTrail;
          uniform vec2 u_canvasSize;
          uniform vec2 u_cursor;
          uniform float u_haloIntensity;
          uniform float u_haloInnerPx;
          uniform float u_haloOuterPx;
          uniform float u_decay;
          out float out_trail;
          void main() {
            float previous = texture(u_previousTrail, v_uv).r * u_decay;
            vec2 dPx = (v_uv - u_cursor) * u_canvasSize;
            float distPx = length(dPx);
            float currentHalo = (1.0 - smoothstep(u_haloInnerPx, u_haloOuterPx, distPx)) * u_haloIntensity;
            out_trail = max(previous, currentHalo);
          }`,
        uniforms: [
          { name: 'u_previousTrail', value: 0, type: INT },
          { name: 'u_canvasSize', value: [width, height], type: FLOAT },
          { name: 'u_cursor', value: [-1, -1], type: FLOAT },
          { name: 'u_haloIntensity', value: 0, type: FLOAT },
          { name: 'u_haloInnerPx', value: HOVER_HALO_INNER_PX, type: FLOAT },
          { name: 'u_haloOuterPx', value: HOVER_HALO_OUTER_PX, type: FLOAT },
          { name: 'u_decay', value: HOVER_TRAIL_DECAY, type: FLOAT },
        ],
      });

      // Dash colour program — custom shader for drawLayerAsVectorField.
      // Reads the trail layer (input 0) and lerps base→hover by its value.
      // The vector-field velocity layer is appended at input index 1; we
      // don't sample it here, but the gpu-io vertex shader uses it for line
      // displacement.
      const baseColor = isMobile ? MARKER_COLOR_MOBILE : MARKER_COLOR;
      this.dashColorProgram = new GPUProgram(this.composer, {
        name: 'dashColor',
        fragmentShader: `
          in vec2 v_uv;
          uniform sampler2D u_trail;
          uniform vec3 u_baseColor;
          uniform vec3 u_hoverColor;
          out vec4 out_color;
          void main() {
            float t = clamp(texture(u_trail, v_uv).r, 0.0, 1.0);
            vec3 color = mix(u_baseColor, u_hoverColor, t);
            out_color = vec4(color, 1.0);
          }`,
        uniforms: [
          { name: 'u_trail', value: 0, type: INT },
          { name: 'u_baseColor', value: baseColor, type: FLOAT },
          { name: 'u_hoverColor', value: MARKER_COLOR_HOVER, type: FLOAT },
        ],
      });

      this.canvasSizePx = [width, height];

      // --- Events ---
      window.addEventListener('pointermove', this.boundPointerMove);
      window.addEventListener('pointerup', this.boundPointerStop);
      canvas.addEventListener('webglcontextlost', this.boundContextLost);
      if (isMobile) {
        window.addEventListener('scroll', this.boundScroll, { passive: true });
      } else {
        // Desktop: track when the cursor leaves/re-enters the viewport so
        // the halo doesn't stay frozen at the page edge.
        document.documentElement.addEventListener('mouseenter', this.boundCursorEnter);
        document.documentElement.addEventListener('mouseleave', this.boundCursorLeave);
      }

      // Initial resize to set canvas pixel dimensions
      this.resize();

      this._initialized = true;
    } catch (e) {
      console.warn('FluidSimulation: WebGL init failed', e);
      this._initialized = false;
      // Properties will be undefined, but isInitialized() returns false
      // so no methods should be called.
      return;
    }
  }

  isInitialized(): boolean {
    return this._initialized;
  }

  start(): void {
    if (!this._initialized || this.animFrameId !== null) return;

    // Mobile: fire initial splats so the fluid has motion before anyone touches
    if (this.isMobile) {
      const w = this.canvas.width;
      const h = this.canvas.height;
      for (let i = 0; i < 3; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const angle = Math.random() * Math.PI * 2;
        const force = 5 + Math.random() * 10;
        const length = 80 + Math.random() * 120;
        this.touchProgram.setUniform('u_vector', [Math.cos(angle) * force, Math.sin(angle) * force]);
        this.composer.stepSegment({
          program: this.touchProgram,
          input: this.velocityState,
          output: this.velocityState,
          position1: [x, y],
          position2: [x + Math.cos(angle) * length, y + Math.sin(angle) * length],
          thickness: 50,
          endCaps: true,
        });
      }
    }

    this.loop();
  }

  pause(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  resume(): void {
    if (!this._initialized || this.animFrameId !== null) return;
    this.loop();
  }

  resize(): void {
    if (!this._initialized) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.composer.resize([width, height]);

    const velDims: [number, number] = [
      Math.ceil(width / VELOCITY_SCALE_FACTOR),
      Math.ceil(height / VELOCITY_SCALE_FACTOR),
    ];

    this.velocityState.resize(velDims);
    this.divergenceState.resize(velDims);
    this.pressureState.resize(velDims);
    this.trailState.resize(velDims);

    this.advection.setUniform('u_dimensions', [width, height]);
    const pxSize: [number, number] = [1 / velDims[0], 1 / velDims[1]];
    this.divergence2D.setUniform('u_pxSize', pxSize);
    this.jacobi.setUniform('u_pxSize', pxSize);
    this.gradientSubtraction.setUniform('u_pxSize', pxSize);

    this.canvasSizePx = [width, height];
    this.trailProgram.setUniform('u_canvasSize', [width, height]);
  }

  dispose(): void {
    this.pause();

    window.removeEventListener('pointermove', this.boundPointerMove);
    window.removeEventListener('pointerup', this.boundPointerStop);
    window.removeEventListener('scroll', this.boundScroll);
    document.documentElement.removeEventListener('mouseenter', this.boundCursorEnter);
    document.documentElement.removeEventListener('mouseleave', this.boundCursorLeave);
    this.canvas.removeEventListener('webglcontextlost', this.boundContextLost);
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);

    if (!this._initialized) return;

    this.velocityState.dispose();
    this.divergenceState.dispose();
    this.pressureState.dispose();
    this.trailState.dispose();
    this.advection.dispose();
    this.divergence2D.dispose();
    this.jacobi.dispose();
    this.gradientSubtraction.dispose();
    this.touchProgram.dispose();
    this.trailProgram.dispose();
    this.dashColorProgram.dispose();
    this.composer.dispose();
  }

  // --- Private ---

  private loop = (): void => {
    this.animFrameId = requestAnimationFrame(this.loop);
    this.frameCount++;

    // Throttle to ~30fps on mobile (skip odd frames)
    if (this.isMobile && this.frameCount % 2 !== 0) return;

    // Mobile keepalive: one gentle splat every ~3s to keep dashes alive
    if (this.isMobile && this.frameCount % 90 === 0) {
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height;
      const angle = Math.random() * Math.PI * 2;
      const length = 60 + Math.random() * 80;
      this.touchProgram.setUniform('u_vector', [Math.cos(angle) * 3, Math.sin(angle) * 3]);
      this.composer.stepSegment({
        program: this.touchProgram,
        input: this.velocityState,
        output: this.velocityState,
        position1: [x, y],
        position2: [x + Math.cos(angle) * length, y + Math.sin(angle) * length],
        thickness: 40,
        endCaps: true,
      });
    }

    this.step();
  };

  private step(): void {
    const { composer, velocityState, divergenceState, pressureState } = this;

    // 1. Advect velocity
    composer.step({
      program: this.advection,
      input: [velocityState, velocityState],
      output: velocityState,
    });

    // 2. Compute divergence
    composer.step({
      program: this.divergence2D,
      input: velocityState,
      output: divergenceState,
    });

    // 3. Jacobi pressure solve
    for (let i = 0; i < NUM_JACOBI_ITERATIONS; i++) {
      composer.step({
        program: this.jacobi,
        input: [pressureState, divergenceState],
        output: pressureState,
      });
    }

    // 4. Subtract pressure gradient
    composer.step({
      program: this.gradientSubtraction,
      input: [pressureState, velocityState],
      output: velocityState,
    });

    // 5. Update the hover trail (decay previous + stamp current halo).
    // Smoothly approach the target halo intensity (1 when cursor active, 0
    // otherwise). Same factor on desktop and mobile — mobile renders at half
    // the rate so the perceived fade is ~2× longer, which feels right for
    // touch release.
    const target = this.cursorActive ? 1 : 0;
    this.haloIntensity += (target - this.haloIntensity) * 0.18;
    const [cw, ch] = this.canvasSizePx;
    this.trailProgram.setUniform('u_cursor', [
      this.cursorPx[0] / cw,
      1 - this.cursorPx[1] / ch,
    ]);
    this.trailProgram.setUniform('u_haloIntensity', this.haloIntensity);
    composer.step({
      program: this.trailProgram,
      input: this.trailState,
      output: this.trailState,
    });

    // 6. Clear canvas to black and draw velocity field, coloured by trail.
    composer.clear();
    composer.drawLayerAsVectorField({
      layer: velocityState,
      vectorSpacing: this.isMobile ? VECTOR_SPACING_MOBILE : VECTOR_SPACING_DESKTOP,
      vectorScale: this.isMobile ? VECTOR_SCALE_MOBILE : VECTOR_SCALE,
      program: this.dashColorProgram,
      input: this.trailState,
    });
  }

  private onPointerMove = (e: PointerEvent): void => {
    // On mobile, don't apply force during scroll — it kills the fluid
    if (this.isMobile && this.isScrolling) return;

    const x = e.clientX;
    const y = e.clientY;

    // Hover-color tracking: always update cursor pos; on mobile the halo
    // only lights while a touch is in progress (mouse pointers latch on).
    this.cursorPx = [x, y];
    if (this.isMobile) {
      this.cursorActive = e.pointerType !== 'mouse' ? true : this.cursorActive;
    } else {
      this.cursorActive = true;
    }

    if (this.activeTouches[e.pointerId] === undefined) {
      this.activeTouches[e.pointerId] = { current: [x, y] };
      return;
    }

    this.activeTouches[e.pointerId].last = this.activeTouches[e.pointerId].current;
    this.activeTouches[e.pointerId].current = [x, y];

    const { current, last } = this.activeTouches[e.pointerId];
    if (!last || (current[0] === last[0] && current[1] === last[1])) return;

    this.touchProgram.setUniform('u_vector', [current[0] - last[0], -(current[1] - last[1])]);

    const canvasH = this.canvas.clientHeight;
    this.composer.stepSegment({
      program: this.touchProgram,
      input: this.velocityState,
      output: this.velocityState,
      position1: [current[0], canvasH - current[1]],
      position2: [last[0], canvasH - last[1]],
      thickness: this.isMobile ? TOUCH_THICKNESS_MOBILE : TOUCH_THICKNESS,
      endCaps: true,
    });
  };

  private onPointerStop = (e: PointerEvent): void => {
    delete this.activeTouches[e.pointerId];
    if (this.isMobile && e.pointerType !== 'mouse') {
      this.cursorActive = false;
    }
  };
}

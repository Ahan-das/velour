"use client";

/**
 * The hero's signature piece: a giant wordmark whose letters run down into
 * tall rounded columns (the "BLOOM" blend from the reference), filled with a
 * live GLSL shader that reads as brushed, light-catching hair. Moving the
 * pointer parts the strands like fingers running through them, hovering a
 * column lets it fall a little longer, and scrolling slides the strands.
 *
 * Raw WebGL rather than Three.js: this is one full-screen quad and one
 * fragment shader, so a scene graph would add ~150 KB for nothing.
 *
 * Photo mode: pass `photo` and `cutout` (the same frame with a transparent
 * background) and the letters become a window onto the photograph while the
 * cut-out model is drawn in front of them, so her head breaks over the
 * wordmark like the reference. All three planes are composited in the one
 * shader and drift apart slightly with the pointer.
 */

import { useReducedMotion, type MotionValue } from "motion/react";
import { useEffect, useRef } from "react";

type Props = {
  word: string;
  photo?: string;
  cutout?: string;
  /** Where the subject sits in the photo (0-1): x centre, y of the top of the hair. */
  focus?: readonly [number, number];
  scroll?: MotionValue<number>;
  className?: string;
};

const MAX_COLS = 8;
// Per-letter column length, so the bottoms do not line up like a bar chart.
const LENGTHS = [0.9, 1, 0.95, 1, 0.92, 0.98, 0.94, 1];

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2  uRes;
uniform float uTime;
uniform float uScroll;
uniform vec2  uMouse;
uniform float uMouseAmt;
uniform vec4  uCols[${MAX_COLS}];
uniform float uGrow[${MAX_COLS}];
uniform int   uCount;
uniform float uRadius;
uniform float uTextIn;
uniform sampler2D uText;
uniform sampler2D uPhoto;
uniform int   uMode;
uniform vec4  uPhotoFit;
uniform float uDark;
uniform sampler2D uCut;
uniform vec2  uLook;
uniform float uCutIn;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return v;
}
float sdBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

vec3 silk(vec2 p, float part) {
  float t = uTime * 0.05 + uScroll * 0.9;
  float w1 = fbm(vec2(p.x * 1.3, p.y * 0.45 - t));
  float w2 = fbm(vec2(p.x * 3.1 + 4.0, p.y * 1.1 - t * 1.7));
  float x = p.x + w1 * 0.38 + w2 * 0.09 + sin(p.y * 3.6 + p.x * 2.0 + uTime * 0.25) * 0.035;

  float s1 = sin(x * 150.0 + w2 * 9.0);
  float s2 = sin(x * 410.0 + w1 * 22.0);
  float fine = noise(vec2(x * 820.0, p.y * 5.0));
  float strands = 0.5 + 0.26 * s1 + 0.12 * s2 + 0.12 * (fine - 0.5) * 2.0;

  // Travelling S-curve highlights: the light a soft wave catches.
  float wave = sin(p.y * 6.5 - x * 3.2 + w1 * 5.5 - uTime * 0.32 - uScroll * 4.0);
  float sheen = pow(clamp(wave * 0.5 + 0.5, 0.0, 1.0), 5.0);
  float body = fbm(vec2(x * 1.8, p.y * 1.3 + t * 0.6));

  vec3 deep   = vec3(0.07, 0.042, 0.032);
  vec3 chest  = vec3(0.37, 0.195, 0.105);
  vec3 copper = vec3(0.82, 0.50, 0.29);
  vec3 glint  = vec3(1.0, 0.88, 0.74);

  vec3 col = mix(deep, chest, smoothstep(0.22, 0.78, body));
  col *= 0.68 + 0.62 * strands;
  col += copper * sheen * (0.3 + 0.7 * strands) * 0.6;
  col += glint * pow(sheen, 3.0) * pow(clamp(strands, 0.0, 1.0), 4.0) * 0.55;
  col += copper * part * 0.12;
  return col;
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y); // top-left origin, device px
  vec2 uv = px / uRes;

  // Mask: glyphs from the texture, columns as rounded-box SDFs.
  float textA = texture2D(uText, uv).a * uTextIn;
  float colA = 0.0;
  for (int i = 0; i < ${MAX_COLS}; i++) {
    if (i >= uCount) break;
    vec4 c = uCols[i];
    float bottom = mix(c.z, c.w, uGrow[i]);
    vec2 center = vec2((c.x + c.y) * 0.5, (c.z + bottom) * 0.5);
    vec2 hb = vec2((c.y - c.x) * 0.5, max((bottom - c.z) * 0.5, 0.0));
    float d = sdBox(px - center, hb, min(uRadius, hb.y));
    colA = max(colA, (1.0 - smoothstep(-0.75, 0.75, d)) * step(0.5, hb.y));
  }
  float mask = max(textA, colA);

  // Pointer: strands part around it, like fingers drawn through hair.
  vec2 p = px / uRes.y;
  vec2 m = uMouse / uRes.y;
  vec2 d = p - m;
  float part = exp(-dot(d, d) * 22.0) * uMouseAmt;
  float grain = (hash(px + fract(uTime)) - 0.5) * 0.025;
  float stillGrain = (hash(px) - 0.5) * 0.02;

  if (uMode == 1) {
    // Photo mode, three planes: the sky behind the letters drifts against
    // the pointer, the letters hold still, the cut-out model drifts with it.
    vec2 base = uv * uPhotoFit.xy + uPhotoFit.zw;
    vec2 bgUV = base - uLook * 0.006;
    vec3 bg = texture2D(uPhoto, bgUV).rgb;
    // Grade the white cloud toward a dusty sky blue so the letters hold
    // their shape against the paper (the reference's powder-blue letters).
    float l = dot(bg, vec3(0.2126, 0.7152, 0.0722));
    bg = mix(bg, bg * vec3(0.56, 0.66, 0.8), smoothstep(0.45, 0.85, l)) + stillGrain;
    vec2 cutUV = base + uLook * 0.004 + vec2(0.0, (1.0 - uCutIn) * 0.012);
    vec4 cut = texture2D(uCut, cutUV);
    float inside = step(0.0, cutUV.x) * step(cutUV.x, 1.0) * step(0.0, cutUV.y) * step(cutUV.y, 1.0);
    float ca = cut.a * uCutIn * inside;
    vec3 outc = cut.rgb * ca + bg * mask * (1.0 - ca);
    gl_FragColor = vec4(outc, ca + mask * (1.0 - ca));
    return;
  }

  if (mask < 0.002) { gl_FragColor = vec4(0.0); return; }
  p.x -= d.x * part * 0.9;
  p.y -= d.y * part * 0.25;
  vec3 col = silk(p, part);

  // On a dark page, lift the shadows so the letterforms keep their edge.
  col = mix(col, col * 1.35 + vec3(0.05, 0.03, 0.02), uDark);

  // Subtle grain so the gradients never band on large screens.
  col += grain;
  gl_FragColor = vec4(col * mask, mask);
}
`;

type Layout = {
  cols: Float32Array;
  ends: number[];
  count: number;
  radius: number;
  bounds: { x0: number; x1: number; top: number; glyphBottom: number }[];
};

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function easeOutExpo(t: number) {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

const DEFAULT_FOCUS = [0.5, 0.3] as const;

export function SilkWordmark({ word, photo, cutout, focus = DEFAULT_FOCUS, scroll, className }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const word_ = word.toUpperCase().slice(0, MAX_COLS);
    const textCanvas = document.createElement("canvas");
    const tctx = textCanvas.getContext("2d");
    if (!tctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;
    let layout: Layout | null = null;
    let raf = 0;
    let running = false;
    let disposed = false;
    const start = performance.now();
    const grow = new Float32Array(MAX_COLS);
    const growTarget = new Float32Array(MAX_COLS).fill(1);
    const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999, amt: 0, tamt: 0 };
    let hoverCol = -1;
    let lastFrame = performance.now();
    const look = [0, 0];
    const lookTarget = [0, 0];
    let textIn = reduce ? 1 : 0;

    const fontFamily =
      getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim() ||
      "Georgia, serif";

    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false, alpha: true });

    function computeLayout() {
      const rect = wrap!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.round(rect.width * dpr);
      H = Math.round(rect.height * dpr);
      canvas!.width = W;
      canvas!.height = H;
      textCanvas.width = W;
      textCanvas.height = H;

      const tracking = 0.012;
      const measure = (size: number) => {
        tctx!.font = `900 ${size}px ${fontFamily}`;
        let total = 0;
        for (const ch of word_) total += tctx!.measureText(ch).width + tracking * size;
        return total - tracking * size;
      };
      // Fit width first, then make sure the glyphs leave the columns room to fall.
      let size = (W * 0.965) / (measure(100) / 100);
      size = Math.min(size, H * 0.5);
      const total = measure(size);
      tctx!.font = `900 ${size}px ${fontFamily}`;
      tctx!.textBaseline = "alphabetic";
      tctx!.clearRect(0, 0, W, H);
      tctx!.fillStyle = "#fff";

      const probe = tctx!.measureText("H");
      const capH = probe.actualBoundingBoxAscent;
      const top = Math.round(H * 0.012);
      const baseline = top + capH;
      let x = (W - total) / 2;

      const cols = new Float32Array(MAX_COLS * 4);
      const ends: number[] = [];
      const bounds: Layout["bounds"] = [];
      const colBottom = H - 2 * dpr;
      const span = colBottom - baseline;
      let minInk = Infinity;

      [...word_].forEach((ch, i) => {
        const m = tctx!.measureText(ch);
        tctx!.fillText(ch, x, baseline);
        const inkL = x - m.actualBoundingBoxLeft;
        const inkR = x + m.actualBoundingBoxRight;
        const inkW = inkR - inkL;
        minInk = Math.min(minInk, inkW);
        const bw = inkW * 0.6;
        const cx = (inkL + inkR) / 2;
        const colTop = baseline - capH * 0.1;
        const end = baseline + span * LENGTHS[i % LENGTHS.length];
        cols.set([cx - bw / 2, cx + bw / 2, colTop, end], i * 4);
        ends.push(end);
        bounds.push({ x0: inkL, x1: inkR, top: top, glyphBottom: baseline });
        x += m.width + tracking * size;
      });

      layout = { cols, ends, count: word_.length, radius: minInk * 0.6 * 0.5, bounds };
    }

    // ---------- 2D fallback (no WebGL): flat chestnut letters, still on brand.
    if (!gl) {
      const draw = () => {
        computeLayout();
        const c2 = canvas.getContext("2d");
        if (!c2 || !layout) return;
        c2.clearRect(0, 0, W, H);
        c2.drawImage(textCanvas, 0, 0);
        for (let i = 0; i < layout.count; i++) {
          const [x0, x1, t, b] = layout.cols.slice(i * 4, i * 4 + 4);
          c2.beginPath();
          c2.roundRect(x0, t, x1 - x0, b - t, [0, 0, layout.radius, layout.radius]);
          c2.fillStyle = "#fff";
          c2.fill();
        }
        c2.globalCompositeOperation = "source-in";
        const g = c2.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#5e301a");
        g.addColorStop(1, "#1d110c");
        c2.fillStyle = g;
        c2.fillRect(0, 0, W, H);
        c2.globalCompositeOperation = "source-over";
      };
      document.fonts.load(`900 100px ${fontFamily}`).catch(() => undefined).then(draw);
      const ro = new ResizeObserver(draw);
      ro.observe(wrap);
      return () => ro.disconnect();
    }

    // ---------- WebGL setup
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const U = (n: string) => gl.getUniformLocation(prog, n);
    const u = {
      res: U("uRes"), time: U("uTime"), scroll: U("uScroll"), mouse: U("uMouse"),
      mouseAmt: U("uMouseAmt"), cols: U("uCols"), grow: U("uGrow"), count: U("uCount"),
      radius: U("uRadius"), textIn: U("uTextIn"), text: U("uText"), photo: U("uPhoto"),
      mode: U("uMode"), photoFit: U("uPhotoFit"), dark: U("uDark"),
      cut: U("uCut"), look: U("uLook"), cutIn: U("uCutIn"),
    };

    const makeTex = (unit: number) => {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
      return t;
    };
    const textTex = makeTex(0);
    const photoTex = makeTex(1);
    const cutTex = makeTex(2);
    gl.uniform1i(u.text, 0);
    gl.uniform1i(u.photo, 1);
    gl.uniform1i(u.cut, 2);
    gl.uniform1i(u.mode, 0);

    let photoImg: HTMLImageElement | null = null;
    let photoReadyAt = 0;
    const updatePhotoFit = () => {
      if (!photoImg) return;
      // Cover-fit, then slide the crop so the top of her hair sits just under
      // the cap line: the head breaks over the letters, the sky fills them.
      const ia = photoImg.naturalWidth / photoImg.naturalHeight;
      const ca = W / H;
      const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
      if (ca < ia) {
        const sx = ca / ia;
        gl.uniform4f(u.photoFit, sx, 1, clamp(focus[0] - sx / 2, 0, 1 - sx), 0);
      } else {
        const sy = ia / ca;
        gl.uniform4f(u.photoFit, 1, sy, 0, clamp(focus[1] - 0.1 * sy, 0, 1 - sy));
      }
    };
    const loadTex = (src: string, tex: WebGLTexture | null, unit: number) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => {
          if (disposed) return;
          gl.activeTexture(gl.TEXTURE0 + unit);
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          resolve(img);
        };
        img.onerror = reject;
        img.src = src;
      });
    if (photo && cutout) {
      Promise.all([loadTex(photo, photoTex, 1), loadTex(cutout, cutTex, 2)])
        .then(([img]) => {
          if (disposed) return;
          photoImg = img;
          photoReadyAt = performance.now();
          gl.uniform1i(u.mode, 1);
          updatePhotoFit();
          if (!running) frame();
        })
        .catch(() => undefined); // keep the silk shader if either image fails
    }

    const uploadText = () => {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
    };

    const relayout = () => {
      computeLayout();
      if (!layout) return;
      gl.viewport(0, 0, W, H);
      gl.uniform2f(u.res, W, H);
      gl.uniform4fv(u.cols, layout.cols);
      gl.uniform1i(u.count, layout.count);
      gl.uniform1f(u.radius, layout.radius);
      uploadText();
      updatePhotoFit();
    };

    const frame = () => {
      if (!layout) return;
      const now = performance.now();
      const t = (now - start) / 1000;
      // Exponential smoothing on real elapsed time, so the motion has the same
      // weight at 60 Hz, 120 Hz or after a dropped frame.
      const dt = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;
      const ease = (tau: number) => 1 - Math.exp(-dt / tau);

      // Intro: letters fade up, then each column falls in turn.
      if (!reduce) {
        textIn = Math.min(1, t / 0.9);
        for (let i = 0; i < layout.count; i++) {
          const local = Math.max(0, (t - 0.45 - i * 0.09) / 1.6);
          const base = easeOutExpo(Math.min(local, 1));
          const target = hoverCol === i && !photoReadyAt ? 1.04 : 1;
          growTarget[i] = base * target;
          grow[i] += (growTarget[i] - grow[i]) * (local < 1 ? 1 : ease(0.35));
        }
        pointer.x += (pointer.tx - pointer.x) * ease(0.12);
        pointer.y += (pointer.ty - pointer.y) * ease(0.12);
        pointer.amt += (pointer.tamt - pointer.amt) * ease(0.3);
        look[0] += (lookTarget[0] - look[0]) * ease(0.9);
        look[1] += (lookTarget[1] - look[1]) * ease(0.9);
      } else {
        grow.fill(1);
      }
      // The model steps forward once the letters have landed.
      const sinceReady = photoReadyAt ? (now - photoReadyAt) / 1000 : 0;
      const cutIn = reduce ? 1 : easeOutCubic(Math.min(1, Math.max(0, Math.min(t - 0.9, sinceReady) / 1.8)));

      // Columns cannot fall past the canvas edge, so clamp the hover stretch.
      const clamped = new Float32Array(MAX_COLS);
      for (let i = 0; i < layout.count; i++) {
        const c = layout.cols.subarray(i * 4, i * 4 + 4);
        const maxG = (H - 2 - c[2]) / Math.max(c[3] - c[2], 1);
        clamped[i] = Math.min(grow[i], maxG);
      }

      gl.uniform1f(u.time, reduce ? 12.0 : t);
      gl.uniform1f(u.scroll, scroll ? scroll.get() : 0);
      gl.uniform2f(u.mouse, pointer.x, pointer.y);
      gl.uniform1f(u.mouseAmt, pointer.amt);
      gl.uniform1fv(u.grow, clamped);
      gl.uniform1f(u.textIn, textIn);
      gl.uniform1f(u.dark, 0);
      gl.uniform2f(u.look, look[0], look[1]);
      gl.uniform1f(u.cutIn, cutIn);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (running) raf = requestAnimationFrame(frame);
    };

    const play = () => {
      if (running || reduce) return;
      running = true;
      lastFrame = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const pause = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onMove = (e: PointerEvent) => {
      // Touch drags are scrolls, not looks: only a mouse steers the planes.
      if (!layout || e.pointerType !== "mouse") return;
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) * dpr;
      const y = (e.clientY - r.top) * dpr;
      pointer.tx = x;
      pointer.ty = y;
      if (pointer.x < -999) { pointer.x = x; pointer.y = y; }
      pointer.tamt = 1;
      lookTarget[0] = (x / W) * 2 - 1;
      lookTarget[1] = (y / H) * 2 - 1;
      hoverCol = -1;
      for (let i = 0; i < layout.count; i++) {
        const c = layout.cols.subarray(i * 4, i * 4 + 4);
        if (x >= c[0] && x <= c[1] && y > c[2] && y <= H) hoverCol = i;
      }
    };
    const onLeave = () => {
      pointer.tamt = 0;
      lookTarget[0] = 0;
      lookTarget[1] = 0;
      hoverCol = -1;
    };

    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? play() : pause()));
    const onVis = () => (document.hidden ? pause() : play());
    const ro = new ResizeObserver(() => {
      relayout();
      if (!running) frame();
    });

    document.fonts.load(`900 100px ${fontFamily}`).catch(() => undefined).then(() => {
      if (disposed) return;
      relayout();
      frame();
      ro.observe(wrap);
      io.observe(wrap);
      document.addEventListener("visibilitychange", onVis);
      if (!reduce) {
        wrap.addEventListener("pointermove", onMove);
        wrap.addEventListener("pointerleave", onLeave);
      }
    });

    return () => {
      disposed = true;
      pause();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [word, photo, cutout, focus, reduce, scroll]);

  return (
    <div ref={wrapRef} className={`relative ${className ?? ""}`}>
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 size-full" />
    </div>
  );
}

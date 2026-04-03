"use client";

import { useEffect, useRef } from "react";

interface LaserFlowProps {
  color?: string;
  wispDensity?: number;
  flowSpeed?: number;
  verticalSizing?: number;
  horizontalSizing?: number;
  fogIntensity?: number;
  fogScale?: number;
  wispSpeed?: number;
  wispIntensity?: number;
  flowStrength?: number;
  decay?: number;
  horizontalBeamOffset?: number;
  verticalBeamOffset?: number;
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

const vsSource = `
  attribute vec2 a_pos;
  void main() { gl_Position = vec4(a_pos, 0, 1); }
`;

const fsSource = `
  precision highp float;
  uniform vec2 u_res;
  uniform float u_time;
  uniform vec3 u_color;
  uniform float u_flowSpeed;
  uniform float u_flowStrength;
  uniform float u_wispDensity;
  uniform float u_wispSpeed;
  uniform float u_wispIntensity;
  uniform float u_fogIntensity;
  uniform float u_fogScale;
  uniform float u_decay;
  uniform float u_vSize;
  uniform float u_hSize;
  uniform float u_hBeamOffset;
  uniform float u_vBeamOffset;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1,0)), u.x),
      mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p); p = p * 2.1 + vec2(1.7, 9.2); a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);
    uv.x = uv.x / u_hSize + u_hBeamOffset;
    uv.y = uv.y / u_vSize + u_vBeamOffset;

    float t = u_time * u_flowSpeed;

    // Main flow field
    vec2 flow = vec2(
      fbm(uv * 2.0 + vec2(t, 0.0)),
      fbm(uv * 2.0 + vec2(0.0, t * 0.7))
    ) - 0.5;
    vec2 warp = uv + flow * u_flowStrength;

    // Laser beams — multiple horizontal streaks
    float beams = 0.0;
    for (float i = 0.0; i < 6.0; i++) {
      if (i >= u_wispDensity * 6.0) break;
      float offset = (i / 6.0) * 2.0 - 1.0;
      float wt = u_time * u_wispSpeed * 0.05 + i * 1.3;
      float wy = offset + 0.15 * sin(wt + uv.x * 3.0);
      float bw = 0.003 + 0.008 * abs(sin(i * 2.0 + u_time * 0.3));
      float beam = exp(-pow((warp.y - wy) / bw, 2.0));
      float xFade = smoothstep(-1.0, -0.4, uv.x) * smoothstep(1.0, 0.4, uv.x);
      beams += beam * xFade * u_wispIntensity * 0.15;
    }

    // Fog / glow
    float fog = fbm(uv * u_fogScale * 3.0 + vec2(t * 0.4, t * 0.25));
    fog = pow(fog, 1.5) * u_fogIntensity;

    // Soft radial vignette so it fades at edges
    float vignette = 1.0 - smoothstep(0.5, 1.4, length(uv * vec2(u_hSize, u_vSize)));

    float total = (beams + fog) * vignette;
    total = 1.0 - exp(-total * u_decay);

    gl_FragColor = vec4(u_color * total, total * 0.88);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

export default function LaserFlow({
  color = "#7a7fff",
  wispDensity = 1,
  flowSpeed = 0.35,
  verticalSizing = 2,
  horizontalSizing = 0.5,
  fogIntensity = 0.45,
  fogScale = 0.3,
  wispSpeed = 15,
  wispIntensity = 5,
  flowStrength = 0.25,
  decay = 1.1,
  horizontalBeamOffset = 0,
  verticalBeamOffset = -0.5,
}: LaserFlowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER, vsSource));
    gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // Full-screen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uColor = gl.getUniformLocation(prog, "u_color");
    const uFlowSpeed = gl.getUniformLocation(prog, "u_flowSpeed");
    const uFlowStrength = gl.getUniformLocation(prog, "u_flowStrength");
    const uWispDensity = gl.getUniformLocation(prog, "u_wispDensity");
    const uWispSpeed = gl.getUniformLocation(prog, "u_wispSpeed");
    const uWispIntensity = gl.getUniformLocation(prog, "u_wispIntensity");
    const uFogIntensity = gl.getUniformLocation(prog, "u_fogIntensity");
    const uFogScale = gl.getUniformLocation(prog, "u_fogScale");
    const uDecay = gl.getUniformLocation(prog, "u_decay");
    const uVSize = gl.getUniformLocation(prog, "u_vSize");
    const uHSize = gl.getUniformLocation(prog, "u_hSize");
    const uHBeamOffset = gl.getUniformLocation(prog, "u_hBeamOffset");
    const uVBeamOffset = gl.getUniformLocation(prog, "u_vBeamOffset");

    const rgb = hexToRgb(color);

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const start = performance.now();
    const render = () => {
      const t = (performance.now() - start) * 0.001;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniform3fv(uColor, rgb);
      gl.uniform1f(uFlowSpeed, flowSpeed);
      gl.uniform1f(uFlowStrength, flowStrength);
      gl.uniform1f(uWispDensity, wispDensity);
      gl.uniform1f(uWispSpeed, wispSpeed);
      gl.uniform1f(uWispIntensity, wispIntensity);
      gl.uniform1f(uFogIntensity, fogIntensity);
      gl.uniform1f(uFogScale, fogScale);
      gl.uniform1f(uDecay, decay);
      gl.uniform1f(uVSize, verticalSizing);
      gl.uniform1f(uHSize, horizontalSizing);
      gl.uniform1f(uHBeamOffset, horizontalBeamOffset);
      gl.uniform1f(uVBeamOffset, verticalBeamOffset);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      gl.deleteProgram(prog);
    };
  }, [color, wispDensity, flowSpeed, verticalSizing, horizontalSizing, fogIntensity, fogScale, wispSpeed, wispIntensity, flowStrength, decay, horizontalBeamOffset, verticalBeamOffset]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: "block" }}
    />
  );
}

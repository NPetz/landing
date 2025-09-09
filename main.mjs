import * as THREE from "three";

const canvas = document.getElementById("caustics-canvas");
if (canvas) {
  // Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });

  // Scene & Camera
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // Shader material for caustics
  const uniforms = {
    u_time: { value: 0 },
    u_resolution: { value: new THREE.Vector2(canvas.width, canvas.height) },
  };

  // GLSL fragment shader for water caustics with chromatic aberration
  const fragmentShader = `
		precision highp float;
		uniform float u_time;
		uniform vec2 u_resolution;

		// Simple 2D noise
		float hash(vec2 p) {
			return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
		}
		float noise(vec2 p) {
			vec2 i = floor(p);
			vec2 f = fract(p);
			float a = hash(i);
			float b = hash(i + vec2(1.0, 0.0));
			float c = hash(i + vec2(0.0, 1.0));
			float d = hash(i + vec2(1.0, 1.0));
			vec2 u = f * f * (3.0 - 2.0 * f);
			return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
		}

		// Caustics base pattern
		float caustics(vec2 uv, float t) {
			float n = 0.0;
			float scale = 2.0;
			for (int i = 0; i < 3; i++) {
				n += noise(uv * scale + t * 0.05) * 0.5;
				scale *= 2.0;
			}
			return n;
		}

		void main() {
			vec2 uv = gl_FragCoord.xy / u_resolution.xy;
			uv.y = 1.0 - uv.y;
			float t = u_time * 0.5;

			float c = caustics(uv * 2.0, t);

			// Chromatic aberration
			float r = caustics(uv * 2.0 + 0.004, t) + c * 0.7;
			float g = caustics(uv * 2.0, t) + c * 0.8;
			float b = caustics(uv * 2.0 - 0.004, t) + c * 0.9;

			// Caustic lines: only show color where lines are strong
			float lines = smoothstep(0.7, 0.85, c);
			float alpha = lines;
			// Chromatic caustic color
			vec3 color = mix(vec3(0.0), vec3(r, g, b) * 1.2 + lines * vec3(1.0, 1.0, 1.0), lines);
			gl_FragColor = vec4(color, alpha);
		}
	`;

  // Plane geometry and shader
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    uniforms,
    fragmentShader,
    vertexShader: "void main() { gl_Position = vec4(position, 1.0); }",
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Resize handler
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth * dpr;
    const h = canvas.clientHeight * dpr;
    renderer.setSize(w, h, false);
    uniforms.u_resolution.value.set(w, h);
  }
  window.addEventListener("resize", resize);
  resize();

  // Animation loop
  function animate() {
    uniforms.u_time.value = performance.now() * 0.001;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
}

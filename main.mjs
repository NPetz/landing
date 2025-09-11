import * as THREE from "three";

const canvas = document.getElementById("canvas");
if (canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });

  renderer.setPixelRatio(window.devicePixelRatio || 1);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const uniforms = {
    u_time: { value: 0 },
    u_resolution: { value: new THREE.Vector2(canvas.width, canvas.height) },
  };

  const fragmentShader = `
    // 3D simplex noise adapted from https://www.shadertoy.com/view/Ws23RD
    // * Removed gradient normalization


    precision highp float;
    uniform float u_time;
    uniform vec2 u_resolution;

    vec4 mod289(vec4 x)
    {
        return x - floor(x / 289.0) * 289.0;
    }

    vec4 permute(vec4 x)
    {
        return mod289((x * 34.0 + 1.0) * x);
    }

    vec4 snoise(vec3 v)
    {
        const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);

        // First corner
        vec3 i  = floor(v + dot(v, vec3(C.y)));
        vec3 x0 = v   - i + dot(i, vec3(C.x));

        // Other corners
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);

        vec3 x1 = x0 - i1 + C.x;
        vec3 x2 = x0 - i2 + C.y;
        vec3 x3 = x0 - 0.5;

        // Permutations
        vec4 p =
        permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0))
                                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                                + i.x + vec4(0.0, i1.x, i2.x, 1.0));

        // Gradients: 7x7 points over a square, mapped onto an octahedron.
        // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
        vec4 j = p - 49.0 * floor(p / 49.0);  // mod(p,7*7)

        vec4 x_ = floor(j / 7.0);
        vec4 y_ = floor(j - 7.0 * x_); 

        vec4 x = (x_ * 2.0 + 0.5) / 7.0 - 1.0;
        vec4 y = (y_ * 2.0 + 0.5) / 7.0 - 1.0;

        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);

        vec4 s0 = floor(b0) * 2.0 + 1.0;
        vec4 s1 = floor(b1) * 2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

        vec3 g0 = vec3(a0.xy, h.x);
        vec3 g1 = vec3(a0.zw, h.y);
        vec3 g2 = vec3(a1.xy, h.z);
        vec3 g3 = vec3(a1.zw, h.w);

        // Compute noise and gradient at P
        vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
        vec4 m2 = m * m;
        vec4 m3 = m2 * m;
        vec4 m4 = m2 * m2;
        vec3 grad =
        -6.0 * m3.x * x0 * dot(x0, g0) + m4.x * g0 +
        -6.0 * m3.y * x1 * dot(x1, g1) + m4.y * g1 +
        -6.0 * m3.z * x2 * dot(x2, g2) + m4.z * g2 +
        -6.0 * m3.w * x3 * dot(x3, g3) + m4.w * g3;
        vec4 px = vec4(dot(x0, g0), dot(x1, g1), dot(x2, g2), dot(x3, g3));
        return 42.0 * vec4(grad, dot(m4, px));
    }

    // Based on: https://www.shadertoy.com/view/3d3yRj
    // See also: KdotJPG's https://www.shadertoy.com/view/wlc3zr

    float water_caustics(vec3 pos) {
        vec4 n = snoise( pos );

        pos -= 0.07*n.xyz;
        pos *= 1.62;
        n = snoise( pos );

        pos -= 0.07*n.xyz;
        n = snoise( pos );

        pos -= 0.07*n.xyz;
        n = snoise( pos );
        return n.w;
    }

    void main()
    {
        vec2 p = ( -u_resolution.xy + 2.0 * gl_FragCoord.xy) / u_resolution.y;

        // camera matrix
        vec3 ww = normalize(vec3(0., 1., 0.8));
        vec3 uu = normalize(cross(ww, vec3(0., 1., 0.)));
        vec3 vv = normalize(cross(uu,ww));

        vec3 rd = p.x*uu + p.y*vv + 1.5*ww;	// view ray
        vec3 pos = ww + rd*(ww.y/rd.y);	// raytrace plane
        pos.y = u_time * 0.05;					// animate noise slice
        pos *= 1.;							// tiling frequency

        float w = water_caustics(pos);

        float i = exp(w - 0.1);
        float a = smoothstep(0.6, 1., i);
        float r = i * .63 ;
        float g = i * .88 ;
        float b = i * .27 ;
        vec3 c = vec3(r,g,b);


        float w2 =  water_caustics(pos + 1.);

        float i2 = exp(w2 - 0.1);
        float a2 = smoothstep(0.6, 1., i2);
        float r2 = i2 * .83 ;
        float g2 = i2 * .15 ;
        float b2 = i2 * .49 ;
        vec3 c2 = vec3(r2,g2,b2);

        vec3 color = mix(c,c2,.5);
        float alpha = mix(a,a2, .9);

        gl_FragColor = vec4(color, alpha);

    }
`;

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

  function animate() {
    uniforms.u_time.value = performance.now() * 0.001;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
}

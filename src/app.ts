import { bodies, orbitPosition, bodyRadius, AU_KM } from './orbits';
import type { Vec3 } from './orbits';
import './style.css';
interface ElementMap {
    universe: HTMLCanvasElement;
    texture: HTMLSelectElement;
    scale: HTMLSelectElement;
    orbits: HTMLInputElement;
    labels: HTMLInputElement;
    stars: HTMLInputElement;
    speed: HTMLInputElement;
    'help-dialog': HTMLDialogElement;
}
function $<K extends keyof ElementMap>(id: K): ElementMap[K];
function $(id: string): HTMLElement;
function $(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (!element)
        throw new Error(`Missing required element: ${id}`);
    return element;
}
interface Mesh {
    v: WebGLBuffer;
    i: WebGLBuffer;
    count: number;
    mode: number;
}
interface Camera {
    yaw: number;
    pitch: number;
    distance: number;
    target: Vec3;
}
interface CameraGoal {
    distance: number;
    pitch: number;
}
type RenderMode = 0 | 1 | 2;
interface SimulationState {
    days: number;
    speed: number;
    paused: boolean;
    selected: number;
    follow: number | null;
    mode: RenderMode;
    style: number;
    explore: boolean;
    orbits: boolean;
    labels: boolean;
    stars: boolean;
}
// Native auto popovers allow one panel at a time and support Escape and light dismissal.
const compactLayout = window.matchMedia('(max-width: 700px), (max-width: 950px) and (max-height: 500px)');
function syncPanels() {
    for (const id of ['details', 'observatory']) {
        const panel = $(id);
        if (panel.matches(':popover-open')) panel.hidePopover();
        if (compactLayout.matches) panel.setAttribute('popover', 'auto');
        else panel.removeAttribute('popover');
    }
}
function dismissPanel(id: string) {
    const panel = $(id);
    if (panel.matches(':popover-open')) panel.hidePopover();
}
syncPanels();
compactLayout.addEventListener('change', syncPanels);
const canvas = $('universe');
const context = canvas.getContext('webgl', { antialias: true, alpha: false });
if (!context) {
    $('error').hidden = false;
    $('error').textContent = 'This explorer needs WebGL. Please enable hardware acceleration or try another browser.';
    throw new Error('WebGL unavailable');
}
const gl: WebGLRenderingContext = context;
const vertex = `attribute vec3 aPosition; attribute vec3 aNormal; attribute vec2 aUV;
uniform mat4 uVP; uniform vec3 uCenter; uniform float uRadius; uniform float uRotation; uniform float uTilt;
varying vec3 vNormal; varying vec3 vWorld; varying vec2 vUV;
void main(){float c=cos(uRotation),s=sin(uRotation),ct=cos(uTilt),st=sin(uTilt);mat3 spin=mat3(c,0.,-s,0.,1.,0.,s,0.,c);mat3 tilt=mat3(ct,st,0.,-st,ct,0.,0.,0.,1.);vec3 p=tilt*spin*aPosition;vNormal=tilt*spin*aNormal;vWorld=p*uRadius+uCenter;vUV=aUV;gl_Position=uVP*vec4(vWorld,1.);gl_PointSize=1.5;}`;
const fragment = `precision highp float;
varying vec3 vNormal;varying vec3 vWorld;varying vec2 vUV;
uniform vec3 uColor;uniform vec3 uCamera;uniform float uKind;uniform float uMode;uniform float uStyle;uniform float uAlpha;
float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){return .5*noise(p)+.25*noise(p*2.03)+.125*noise(p*4.07)+.0625*noise(p*8.11);}
void main(){
if(uKind<0.){gl_FragColor=vec4(uColor,uAlpha);return;}
vec3 n=normalize(vNormal);vec3 view=normalize(uCamera-vWorld);
if(uKind>19.){float f=pow(max(0.,1.-abs(dot(n,view))),2.8);gl_FragColor=vec4(uColor,f*uAlpha);return;}
vec3 p=vec3(cos(vUV.x*6.283185)*sin(vUV.y*3.141593),cos(vUV.y*3.141593),sin(vUV.x*6.283185)*sin(vUV.y*3.141593));
float terrain=fbm(p*5.);vec3 color=uColor;
if(uKind>9.){float r=vUV.x;float bands=.64+.22*sin(r*135.)+.12*sin(r*381.);if(r>.57&&r<.61)bands*=.13;gl_FragColor=vec4(uColor*bands,.77*uAlpha);return;}
if(uMode<.5){
 if(uKind<.5){color=mix(vec3(.88,.20,.018),vec3(1.,.82,.34),fbm(p*23.)*1.4);}
 else if(abs(uKind-3.)<.2){float land=smoothstep(.455,.48,terrain);vec3 sea=mix(vec3(.018,.08,.19),vec3(.045,.24,.4),terrain);vec3 earth=mix(vec3(.16,.29,.14),vec3(.5,.43,.26),smoothstep(.48,.7,terrain));color=mix(sea,earth,land);float ice=smoothstep(.88,.96,abs(p.y)+terrain*.09);color=mix(color,vec3(.88,.94,.95),ice);float cloud=smoothstep(.57,.70,fbm(p*12.+vec3(5.,0.,0.)));color=mix(color,vec3(.88,.92,.95),cloud*.85);}
 else if(uKind>4.5){float bands=sin(p.y*(uKind<6.5?52.:24.)+fbm(p*9.)*7.);color=uColor*(.76+.2*bands+.2*terrain);if(abs(uKind-5.)<.2){vec2 q=vec2((vUV.x-.66)*2.,vUV.y-.59);float storm=1.-smoothstep(.025,.065,length(q));color=mix(color,vec3(.64,.29,.16),storm);}}
 else if(abs(uKind-2.)<.2){color=uColor*(.75+.5*fbm(p*7.+vec3(sin(p.y*25.)*.3)));}
 else{float craters=pow(noise(p*55.),4.);color=uColor*(.55+.8*terrain-craters*.3);if(abs(uKind-4.)<.2)color=mix(color,vec3(.85,.86,.82),smoothstep(.94,.99,abs(p.y)));}
 if(uStyle>.5&&uKind>.5){float contour=1.-smoothstep(.025,.065,abs(fract(terrain*24.)-.5));color=mix(vec3(.035,.14,.18),vec3(.55,.87,.76),terrain);color+=vec3(.3,.5,.42)*contour*.6;}
}
float lambert=max(dot(n,normalize(-vWorld)),0.);float lighting=uKind<.5?1.18:.10+.90*lambert;
if(uMode>1.5)lighting=.75;
color*=lighting;
if(abs(uKind-3.)<.2 && uMode<.5){float spec=pow(max(dot(reflect(normalize(vWorld),n),view),0.),28.);color+=vec3(.15,.22,.3)*spec;}
gl_FragColor=vec4(color,uAlpha);
}`;
function shader(type: number, source: string): WebGLShader { const s = gl.createShader(type); if (!s)
    throw new Error('Could not allocate shader'); gl.shaderSource(s, source); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(s) ?? 'Shader compilation failed'); return s; }
let program: WebGLProgram;
try {
    const createdProgram = gl.createProgram();
    if (!createdProgram)
        throw new Error('Could not allocate shader program');
    program = createdProgram;
    gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw new Error(gl.getProgramInfoLog(program) ?? 'Shader linking failed');
}
catch (e) {
    $('error').hidden = false;
    $('error').textContent = 'The 3D renderer could not start on this device.';
    throw e;
}
gl.useProgram(program);
const uniforms: Record<string, WebGLUniformLocation | null> = {};
for (const key of ['VP', 'Center', 'Radius', 'Rotation', 'Tilt', 'Color', 'Camera', 'Kind', 'Mode', 'Style', 'Alpha'])
    uniforms[key] = gl.getUniformLocation(program, 'u' + key);
const attrs = ['aPosition', 'aNormal', 'aUV'].map(n => gl.getAttribLocation(program, n));
function mesh(vertices: number[], indices: number[], mode: number = gl.TRIANGLES): Mesh { const v = gl.createBuffer(); if (!v)
    throw new Error('Could not allocate vertex buffer'); gl.bindBuffer(gl.ARRAY_BUFFER, v); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW); const i = gl.createBuffer(); if (!i)
    throw new Error('Could not allocate index buffer'); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, i); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW); return { v, i, count: indices.length, mode }; }
const verts: number[] = [], tri: number[] = [], wire: number[] = [], lat = 40, lon = 64;
for (let y = 0; y <= lat; y++)
    for (let x = 0; x <= lon; x++) {
        const a = x / lon * Math.PI * 2, b = y / lat * Math.PI, p = [Math.cos(a) * Math.sin(b), Math.cos(b), Math.sin(a) * Math.sin(b)];
        verts.push(...p, ...p, x / lon, y / lat);
        if (y < lat && x < lon) {
            let k = y * (lon + 1) + x;
            tri.push(k, k + lon + 1, k + 1, k + 1, k + lon + 1, k + lon + 2);
            wire.push(k, k + 1, k, k + lon + 1);
        }
    }
const sphere = mesh(verts, tri), wireSphere = mesh(verts, wire, gl.LINES);
const ringV: number[] = [], ringI: number[] = [];
for (let j = 0; j <= 128; j++) {
    const a = j / 128 * Math.PI * 2;
    for (let k = 0; k < 2; k++) {
        const r = k ? 2.32 : 1.28;
        ringV.push(Math.cos(a) * r, 0, Math.sin(a) * r, 0, 1, 0, k, j / 128);
    }
    if (j < 128) {
        let i = j * 2;
        ringI.push(i, i + 1, i + 2, i + 1, i + 3, i + 2);
    }
}
const ring = mesh(ringV, ringI), ringWire = mesh(ringV, ringI.flatMap((v, i, a) => i % 3 === 0 ? [v, a[i + 1], a[i + 1], a[i + 2], a[i + 2], v] : []), gl.LINES);
let seed = 1203;
const rand = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
const starV: number[] = [], starI: number[] = [];
for (let i = 0; i < 1700; i++) {
    const y = rand() * 2 - 1, a = rand() * Math.PI * 2, r = Math.sqrt(1 - y * y);
    starV.push(r * Math.cos(a) * 4000, y * 4000, r * Math.sin(a) * 4000, 0, 1, 0, 0, 0);
    starI.push(i);
}
const stars = mesh(starV, starI, gl.POINTS);
const state: SimulationState = { days: 0, speed: 10, paused: false, selected: 0, follow: null, mode: 0, style: 0, explore: true, orbits: true, labels: true, stars: true };
const camera: Camera = { yaw: .30, pitch: .67, distance: 130, target: [0, 0, 0] };
let goal: CameraGoal | null = null;
let eye: Vec3 = [0, 0, 0];
let vp: Float32Array<ArrayBuffer>;
let positions: Vec3[] = [], radii: number[] = [], orbitMeshes: Mesh[] = [];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: Vec3, scale: number): Vec3 => [a[0] * scale, a[1] * scale, a[2] * scale];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: Vec3): Vec3 => mul(a, 1 / (Math.hypot(...a) || 1));
function multiply(a: Float32Array, b: Float32Array): Float32Array<ArrayBuffer> { let o = new Float32Array(16); for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++)
        for (let k = 0; k < 4; k++)
            o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k]; return o; }
function cameraMatrix() { const z = norm(sub(eye, camera.target)), x = norm(cross([0, 1, 0], z)), y = cross(z, x); const view = new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1]); const near = Math.max(.000001, camera.distance * .0001), far = 12000, f = 1 / Math.tan(Math.PI / 7); const p = new Float32Array([f / (canvas.width / canvas.height), 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, 2 * far * near / (near - far), 0]); return multiply(p, view); }
function hex(s: string): Vec3 { return [parseInt(s.slice(1, 3), 16) / 255, parseInt(s.slice(3, 5), 16) / 255, parseInt(s.slice(5, 7), 16) / 255]; }
function draw(m: Mesh, center: Vec3, radius: number, color: Vec3, kind: number, rotation = 0, tilt = 0, alpha = 1) { gl.bindBuffer(gl.ARRAY_BUFFER, m.v); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.i); attrs.forEach((a, i) => { if (a < 0)
    return; gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, i === 2 ? 2 : 3, gl.FLOAT, false, 32, i === 0 ? 0 : i === 1 ? 12 : 24); }); gl.uniform3fv(uniforms.Center, center); gl.uniform1f(uniforms.Radius, radius); gl.uniform3fv(uniforms.Color, color); gl.uniform1f(uniforms.Kind, kind); gl.uniform1f(uniforms.Rotation, rotation); gl.uniform1f(uniforms.Tilt, tilt); gl.uniform1f(uniforms.Alpha, alpha); gl.drawElements(m.mode, m.count, gl.UNSIGNED_SHORT, 0); }
function rebuild() { for (const m of orbitMeshes) {
    gl.deleteBuffer(m.v);
    gl.deleteBuffer(m.i);
} orbitMeshes = bodies.slice(1).map(b => { const v: number[] = [], ind: number[] = []; for (let k = 0; k <= 320; k++) {
    const p = orbitPosition(b, k / 320 * b.period, state.explore);
    v.push(...p, 0, 1, 0, 0, 0);
    ind.push(k);
} return mesh(v, ind, gl.LINE_STRIP); }); radii = bodies.map(b => bodyRadius(b, state.explore)); }
rebuild();
const labels = bodies.map((b, i) => { const button = document.createElement('button'); button.className = 'planet-label'; button.textContent = b.name; button.addEventListener('click', () => select(i)); $('planet-labels').append(button); const nav = document.createElement('button'); nav.className = 'planet-button' + (i === 0 ? ' selected' : ''); nav.innerHTML = `<span class="planet-dot" style="background:${b.color}"></span><span>${b.name}</span>`; nav.setAttribute('aria-pressed', String(i === 0)); nav.onclick = () => select(i); $('planet-nav').append(nav); return button; });
function select(i: number) { state.selected = i; const b = bodies[i]; $('info-toggle').textContent = b.name + ' info'; $('body-name').textContent = b.name; $('body-type').textContent = b.type.toUpperCase(); $('body-index').textContent = String(i).padStart(2, '0') + ' / 08'; $('body-description').textContent = b.description; $('stat-one').innerHTML = b.radius.toLocaleString('en-US') + ' <small>km</small>'; $('stat-two-label').textContent = i ? 'ORBITAL PERIOD' : 'TEMPERATURE'; $('stat-two').innerHTML = i ? (b.period > 1000 ? (b.period / 365.25).toFixed(1) + ' <small>years</small>' : b.period.toFixed(1) + ' <small>days</small>') : '5,772 <small>K</small>'; $('focus').innerHTML = 'Explore the ' + (i ? '' : '') + b.name + ' <span>↗</span>'; [...$('planet-nav').children].forEach((el, j) => { el.classList.toggle('selected', j === i); el.setAttribute('aria-pressed', String(j === i)); }); labels.forEach((el, j) => el.classList.toggle('selected', j === i)); }
function focus(i: number) { state.follow = i; goal = { distance: radii[i] * (i === 6 ? 9 : 7), pitch: .30 }; $('view-name').textContent = 'FOLLOWING ' + bodies[i].name.toUpperCase(); }
function overview() { state.follow = null; goal = { distance: state.explore ? 130 : 1200, pitch: .67 }; camera.yaw = .30; $('view-name').textContent = 'SYSTEM OVERVIEW'; }
$('focus').onclick = () => { dismissPanel('details'); focus(state.selected); };
$('reset').onclick = () => { dismissPanel('observatory'); overview(); };
$('modes').onclick = e => { const target = e.target; if (!(target instanceof HTMLButtonElement))
    return; const mode = target.dataset.mode; if (mode !== 'texture' && mode !== 'shaded' && mode !== 'wire')
    return; const modes: Record<string, RenderMode> = { texture: 0, shaded: 1, wire: 2 }; state.mode = modes[mode]; [...$('modes').children].forEach(el => { el.classList.toggle('active', el === e.target); el.setAttribute('aria-pressed', String(el === e.target)); }); $('texture').disabled = state.mode !== 0; $('texture-field').style.opacity = state.mode === 0 ? '1' : '.4'; };
$('texture').onchange = e => state.style = +(e.currentTarget as HTMLInputElement | HTMLSelectElement).value;
for (const id of ['orbits', 'labels', 'stars'] as const)
    $(id).onchange = e => state[id] = (e.currentTarget as HTMLInputElement).checked;
$('scale').onchange = e => { state.explore = (e.currentTarget as HTMLInputElement | HTMLSelectElement).value === 'explore'; rebuild(); $('scale-note').textContent = state.explore ? 'Distances compressed. Planet sizes enlarged for discovery.' : 'Physical sizes and distances. Use Explore to approach a planet.'; $('scale-status').textContent = state.explore ? 'EXPLORATION SCALE' : 'TRUE SCALE'; overview(); };
function pause() { state.paused = !state.paused; $('pause').textContent = state.paused ? '▶' : 'Ⅱ'; $('pause').setAttribute('aria-label', state.paused ? 'Resume simulation' : 'Pause simulation'); }
$('pause').onclick = pause;
$('speed').oninput = e => { state.speed = 10 ** +(e.currentTarget as HTMLInputElement | HTMLSelectElement).value; $('speed-value').textContent = state.speed.toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' days / sec'; };
$('epoch').onclick = () => state.days = 0;
$('help').onclick = () => $('help-dialog').showModal();
$('close-help').onclick = () => $('help-dialog').close();
let dragging: {
    x: number;
    y: number;
    pan: boolean;
} | null = null;
const pointers = new Map<number, [
    number,
    number
]>();
let lastPinch: {
    distance: number;
    mid: [
        number,
        number
    ];
} | null = null;
let moveDistance = 0;
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('pointerdown', e => { canvas.focus(); canvas.setPointerCapture(e.pointerId); pointers.set(e.pointerId, [e.clientX, e.clientY]); dragging = { x: e.clientX, y: e.clientY, pan: e.button === 2 || e.shiftKey }; goal = null; moveDistance = 0; });
function pan(dx: number, dy: number) { const factor = camera.distance * .0015; const right: Vec3 = [Math.cos(camera.yaw), 0, -Math.sin(camera.yaw)], up: Vec3 = [-Math.sin(camera.yaw) * Math.sin(camera.pitch), Math.cos(camera.pitch), -Math.cos(camera.yaw) * Math.sin(camera.pitch)]; camera.target = add(camera.target, add(mul(right, -dx * factor), mul(up, dy * factor))); state.follow = null; $('view-name').textContent = 'FREE EXPLORATION'; }
canvas.addEventListener('pointermove', e => { if (!pointers.has(e.pointerId) || !dragging)
    return; pointers.set(e.pointerId, [e.clientX, e.clientY]); const dx = e.clientX - dragging.x, dy = e.clientY - dragging.y; moveDistance += Math.abs(dx) + Math.abs(dy); if (pointers.size === 2) {
    const [a, b] = [...pointers.values()], distance = Math.hypot(a[0] - b[0], a[1] - b[1]), mid: [
        number,
        number
    ] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (lastPinch) {
        camera.distance *= lastPinch.distance / distance;
        pan(mid[0] - lastPinch.mid[0], mid[1] - lastPinch.mid[1]);
    }
    lastPinch = { distance, mid };
}
else if (dragging.pan)
    pan(dx, dy);
else {
    camera.yaw -= dx * .005;
    camera.pitch = Math.max(-1.5, Math.min(1.5, camera.pitch + dy * .005));
} dragging.x = e.clientX; dragging.y = e.clientY; });
function endPointer(e: PointerEvent) { pointers.delete(e.pointerId); lastPinch = null; if (!pointers.size)
    dragging = null;
else {
    const p = [...pointers.values()][0];
    dragging = { x: p[0], y: p[1], pan: false };
} }
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('wheel', e => { e.preventDefault(); goal = null; camera.distance = Math.max(.0001, Math.min(6000, camera.distance * Math.exp(e.deltaY * .001))); }, { passive: false });
canvas.addEventListener('dblclick', e => { let nearest = -1, best = 40; positions.forEach((p, i) => { const s = project(p); if (!s)
    return; const d = Math.hypot(s[0] - e.clientX, s[1] - e.clientY); if (d < best) {
    best = d;
    nearest = i;
} }); if (nearest >= 0) {
    select(nearest);
    focus(nearest);
} });
const keys = new Set<string>();
window.addEventListener('keydown', e => { if (['INPUT', 'SELECT', 'BUTTON'].includes(document.activeElement?.tagName ?? '') || $('help-dialog').open)
    return; const k = e.key.toLowerCase(); if (k === ' ') {
    e.preventDefault();
    pause();
} if (k === 'r')
    overview(); if (k === 'escape') {
    state.follow = null;
    goal = null;
    $('view-name').textContent = 'FREE EXPLORATION';
} if ('wasdqe'.includes(k) && k.length === 1) {
    keys.add(k);
    e.preventDefault();
} });
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());
function project(p: Vec3): [
    number,
    number
] | null { const clip = [0, 0, 0, 0]; for (let r = 0; r < 4; r++)
    clip[r] = vp[r] * p[0] + vp[4 + r] * p[1] + vp[8 + r] * p[2] + vp[12 + r]; if (clip[3] <= 0 || clip[2] > clip[3])
    return null; return [(clip[0] / clip[3] * .5 + .5) * innerWidth, (-clip[1] / clip[3] * .5 + .5) * innerHeight]; }
let previous = performance.now(), dateTick = 0;
function frame(now: number) {
    const dt = Math.min((now - previous) / 1000, .05);
    previous = now;
    if (!state.paused)
        state.days += dt * state.speed;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(innerWidth * dpr) || canvas.height !== Math.round(innerHeight * dpr)) {
        canvas.width = Math.round(innerWidth * dpr);
        canvas.height = Math.round(innerHeight * dpr);
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    positions = bodies.map(b => orbitPosition(b, state.days, state.explore));
    if (state.follow !== null) {
        const target = positions[state.follow];
        camera.target = goal ? add(camera.target, mul(sub(target, camera.target), Math.min(1, dt * 6))) : [...target];
    }
    else if (goal)
        camera.target = add(camera.target, mul(camera.target, -Math.min(1, dt * 5)));
    if (goal) {
        camera.distance += (goal.distance - camera.distance) * Math.min(1, dt * 5);
        camera.pitch += (goal.pitch - camera.pitch) * Math.min(1, dt * 5);
        if (Math.abs(goal.distance - camera.distance) < Math.max(.000001, goal.distance * .001) && Math.hypot(...sub(camera.target, state.follow === null ? [0, 0, 0] : positions[state.follow])) < Math.max(.000001, goal.distance * .002))
            goal = null;
    }
    if (keys.size) {
        goal = null;
        state.follow = null;
        $('view-name').textContent = 'FREE EXPLORATION';
        const s = dt * camera.distance * .6;
        const forward: Vec3 = [-Math.sin(camera.yaw), 0, -Math.cos(camera.yaw)], right: Vec3 = [Math.cos(camera.yaw), 0, -Math.sin(camera.yaw)];
        camera.target = add(camera.target, add(mul(forward, s * ((keys.has('w') ? 1 : 0) - (keys.has('s') ? 1 : 0))), add(mul(right, s * ((keys.has('d') ? 1 : 0) - (keys.has('a') ? 1 : 0))), [0, s * ((keys.has('e') ? 1 : 0) - (keys.has('q') ? 1 : 0)), 0])));
    }
    camera.distance = Math.max(state.follow !== null ? radii[state.follow] * 1.12 : .0001, Math.min(6000, camera.distance));
    eye = add(camera.target, [Math.sin(camera.yaw) * Math.cos(camera.pitch) * camera.distance, Math.sin(camera.pitch) * camera.distance, Math.cos(camera.yaw) * Math.cos(camera.pitch) * camera.distance]);
    vp = cameraMatrix();
    gl.clearColor(.019, .029, .044, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(uniforms.VP, false, vp);
    gl.uniform3fv(uniforms.Camera, eye);
    gl.uniform1f(uniforms.Mode, state.mode);
    gl.uniform1f(uniforms.Style, state.style);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    if (state.stars) {
        gl.depthMask(false);
        draw(stars, eye, 1, [.46, .54, .65], -2, 0, 0, .65);
        gl.depthMask(true);
    }
    if (state.orbits)
        orbitMeshes.forEach((m, i) => draw(m, [0, 0, 0], 1, i + 1 === state.selected ? [.35, .56, .51] : [.20, .28, .35], -1, 0, 0, i + 1 === state.selected ? .65 : .42));
    bodies.forEach((b, i) => { const tilt = b.tilt * Math.PI / 180; draw(state.mode === 2 ? wireSphere : sphere, positions[i], radii[i], hex(b.color), i, state.days / b.rotation * Math.PI * 2, tilt); if (i === 6)
        draw(state.mode === 2 ? ringWire : ring, positions[i], radii[i], hex('#cbbb96'), state.mode === 2 ? -1 : 10, 0, tilt, .85); });
    // Moon: mean circular orbit with a 5.145 degree inclination, illustrative phase.
    const moonDistance = state.explore ? 2.1 : 384400 / AU_KM * 20, moonAngle = state.days / 27.32166 * Math.PI * 2;
    const moonPosition = add(positions[3], [Math.cos(moonAngle) * moonDistance, Math.sin(moonAngle) * moonDistance * .0897, Math.sin(moonAngle) * moonDistance * .996]);
    draw(state.mode === 2 ? wireSphere : sphere, moonPosition, state.explore ? .21 : 1737.4 / AU_KM * 20, [.65, .66, .67], 1, moonAngle);
    if (state.mode !== 2) {
        gl.depthMask(false);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        draw(sphere, [0, 0, 0], radii[0] * 1.12, [1., .43, .09], 20, 0, 0, .18);
        draw(sphere, [0, 0, 0], radii[0] * 1.28, [.9, .24, .035], 20, 0, 0, .07);
        if (state.follow === 3)
            draw(sphere, positions[3], radii[3] * 1.035, [.13, .41, .85], 20, 0, 0, .12);
        gl.depthMask(true);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }
    labels.forEach((el, i) => { const p = project(positions[i]); const visible = state.labels && p && p[0] > 0 && p[0] < innerWidth && p[1] > 75 && p[1] < innerHeight - 165; el.style.display = visible ? 'block' : 'none'; if (visible) {
        const distance = Math.hypot(...sub(eye, positions[i]));
        const offset = Math.min(90, radii[i] / distance * innerHeight * 1.1) + 7;
        el.style.transform = `translate(${p[0] + offset}px,${p[1] - 7}px)`;
    } });
    if (now - dateTick > 180) {
        const date = new Date(Date.UTC(2000, 0, 1, 12) + state.days * 86400000);
        $('date').textContent = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).toUpperCase();
        dateTick = now;
    }
    requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

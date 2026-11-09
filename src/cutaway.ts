import { AmbientLight, DirectionalLight, DoubleSide, Group, Mesh, MeshLambertMaterial, OrthographicCamera, RingGeometry, Scene, SphereGeometry } from 'three';
import { SVGRenderer } from 'three/addons/renderers/SVGRenderer.js';
import { interiors } from './interiors';

// A longitude wedge centered on +Z opens toward the viewer. Each cut face is
// a stack of half annuli sharing the polar axis with the remaining outer shell.
export function renderCutaway(name: string, host: HTMLElement) {
  const { layers, note } = interiors[name];
  const scene = new Scene();
  const globe = new Group();
  scene.add(globe, new AmbientLight(0xffffff, 1.3));
  const light = new DirectionalLight(0xfff2db, 1.8);
  light.position.set(-2, 3, 4);
  scene.add(light);
  const makeMaterial = (color: string) => new MeshLambertMaterial({color, side: DoubleSide});
  globe.add(new Mesh(new SphereGeometry(1, 36, 24, 3*Math.PI/4, 3*Math.PI/2), makeMaterial(layers[layers.length-1][3])));
  let inner = 0;
  for (const [, , outer, color] of layers) {
    const face = new RingGeometry(inner, outer, 32, 1, -Math.PI/2, Math.PI);
    const material = makeMaterial(color);
    for (const angle of [-Math.PI/4, -3*Math.PI/4]) {
      const slice = new Mesh(face, material);
      slice.rotation.y = angle;
      globe.add(slice);
    }
    inner = outer;
  }
  globe.rotation.z = -.16;
  const camera = new OrthographicCamera(-1.65, 1.65, 1.12, -1.12, .1, 10);
  camera.position.set(.6,.55,4);
  camera.lookAt(0,0,0);
  // SVG renders the Three.js scene without allocating a second GPU context.
  const renderer = new SVGRenderer();
  renderer.setSize(280,190);
  renderer.render(scene,camera);
  const svg = renderer.domElement;
  svg.setAttribute('role','img');
  svg.setAttribute('aria-label',name+' cutaway with one quarter removed');
  const list = document.createElement('dl');
  for (const [label, material,, color] of layers) {
    const term = document.createElement('dt');
    term.style.setProperty('--layer-color',color);
    term.textContent = label;
    const desc = document.createElement('dd');
    desc.textContent = material;
    list.append(term,desc);
  }
  const caption = document.createElement('small');
  caption.textContent = 'Schematic • layer thicknesses exaggerated';
  const explanation = document.createElement('p');
  explanation.textContent = note;
  const link = document.createElement('a');
  link.href = 'https://science.nasa.gov/'+name.toLowerCase()+'/facts/';
  link.textContent = 'NASA · '+name+' facts';
  host.replaceChildren(svg,caption,list,explanation,link);
}

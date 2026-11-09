import type { Vec3 } from './orbits';

// Each ellipsoid belongs to a low-poly turtle. Combine the parts into one mesh
// so each turtle costs a single draw call, including its shell markings.
export function turtleGeometry() {
  const vertices: number[] = [], indices: number[] = [];
  function part(center: Vec3, size: Vec3, shade: number) {
    const base = vertices.length / 8;
    const rows = 10, columns = 16;
    for (let row=0; row<=rows; row++) {
      const lat = Math.PI*row/rows;
      for (let col=0; col<=columns; col++) {
        const lon = 2*Math.PI*col/columns;
        const normal: Vec3 = [Math.sin(lat)*Math.cos(lon),Math.cos(lat),Math.sin(lat)*Math.sin(lon)];
        vertices.push(...normal.map((n,i)=>center[i]+size[i]*n),...normal,shade,0);
        if (row<rows && col<columns) {
          const i=base+row*(columns+1)+col;
          indices.push(i,i+columns+1,i+1,i+1,i+columns+1,i+columns+2);
        }
      }
    }
  }
  part([0,0,0],[1,.48,.72],.45);
  part([1.04,.03,0],[.4,.28,.31],.8);
  for (const side of [-1,1]) {
    part([1.24,.14,side*.21],[.065,.065,.065],0);
    for(const x of [-.59,.54]) part([x,-.19,side*.58],[.29,.16,.33],.8);
    for(const x of [-.38,.38]) part([x,.35,side*.28],[.31,.13,.24],.29);
  }
  part([0,.44,0],[.40,.10,.27],.29);
  return {vertices,indices};
}

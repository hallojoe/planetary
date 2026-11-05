import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bodies,eccentricAnomaly,orbitPosition,bodyRadius,AU_KM} from '../dist/orbits.js';
const tau=Math.PI*2;
test('Kepler solver satisfies the equation for every planetary eccentricity',()=>{
  for(const b of bodies.slice(1))for(let M=-Math.PI;M<=Math.PI;M+=.07){const E=eccentricAnomaly(M,b.e);assert.ok(Math.abs(E-b.e*Math.sin(E)-M)<1e-10,`${b.name}: M=${M}`);}
});
test('all orbits return to the same location after one period, in both scales',()=>{
 for(const b of bodies.slice(1))for(const scale of [false,true]){const start=orbitPosition(b,17,scale),end=orbitPosition(b,17+b.period,scale);assert.ok(Math.hypot(...start.map((v,i)=>v-end[i]))<1e-8);}
});
test('orbital radii reach the expected perihelion and aphelion',()=>{
 for(const b of bodies.slice(1)){
  const periTime=-(b.L-b.peri)/360*b.period;
  assert.ok(Math.abs(Math.hypot(...orbitPosition(b,periTime,false))-20*b.a*(1-b.e))<1e-8);
  assert.ok(Math.abs(Math.hypot(...orbitPosition(b,periTime+b.period/2,false))-20*b.a*(1+b.e))<1e-8);
 }
});
test('true scale uses identical units for physical radii and orbital distances',()=>{
 for(const b of bodies)assert.equal(bodyRadius(b,false),b.radius/AU_KM*20);
 assert.deepEqual(orbitPosition(bodies[0],100,false),[0,0,0]);
 assert.ok(bodyRadius(bodies[3],false)<.001);
});
test('large and negative simulation times remain finite',()=>{
 for(const b of bodies.slice(1))for(const days of [-1000000,0,1000000])assert.ok(orbitPosition(b,days).every(Number.isFinite));
});

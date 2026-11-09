// Display radii are illustrative. List each model from its center outward.
export type Layer = [name: string, material: string, radius: number, color: string];
interface Interior { note: string; layers: Layer[] }
const core = '#ffce76', metal = '#e98250', rock = '#bb6049', ice = '#84c9c3';
export const interiors: Record<string, Interior> = {
  Sun: {note: 'The Sun is mostly hydrogen and helium. These zones describe how it produces and transports energy.', layers: [
    ['Core','Fusion converts hydrogen into helium.',.30,core],
    ['Radiative zone','Energy travels outward through hot plasma as radiation.',.70,metal],
    ['Convective zone','Rising and sinking plasma carries heat toward the visible surface.',1,'#ffac42']]},
  Mercury: {note: 'Mercury has an unusually large metallic core for its size.', layers: [
    ['Core','Mostly iron, with a partly liquid interior.',.79,core],['Mantle','A comparatively thin layer of silicate rock.',.93,rock],['Crust','A rocky outer shell.',1,'#a99a89']]},
  Venus: {note: 'An Earth-like interior is inferred from its size and density. The state of its core is uncertain.', layers:[
    ['Core','An iron-rich center.',.52,core],['Mantle','Hot silicate rock.',.92,rock],['Crust','A rocky surface shaped by volcanism.',1,'#cfac78']]},
  Earth: {note:'Seismic waves reveal a solid inner core surrounded by a liquid outer core.',layers:[
    ['Inner core','Solid iron alloy.',.21,core],['Outer core','Liquid iron alloy.',.55,metal],['Mantle','Mostly solid silicate rock that flows slowly over geologic time.',.94,rock],['Crust','A thin shell of solid rock.',1,'#5488ab']]},
  Mars: {note:'Mars has a dense metal core beneath a rocky mantle and crust.',layers:[
    ['Core','Iron and nickel with lighter elements, including sulfur.',.52,core],['Mantle','Silicate rock.',.93,rock],['Crust','Volcanic rock with iron oxides at the surface.',1,'#cd805d']]},
  Jupiter:{note:'Pressure changes hydrogen gradually with depth. The heavy-element center may be spread over a broad region.',layers:[
    ['Diffuse center','Heavy elements mixed with hydrogen and helium.',.40,core],['Metallic hydrogen','Compressed hydrogen conducts electricity deep inside.',.78,metal],['Outer envelope','Mostly hydrogen and helium, with clouds high above.',1,'#c4a488']]},
  Saturn:{note:'The deep interior is inferred from gravity and ring observations. Boundaries may be gradual.',layers:[
    ['Heavy-element center','Rock, ice-forming materials and metals mixed into fluid.',.40,core],['Metallic hydrogen','Conducting hydrogen under extreme pressure.',.73,metal],['Outer envelope','Hydrogen and helium beneath banded clouds.',1,'#cfbe99']]},
  Uranus:{note:'One possible model is shown. The proportions of rock and ice-forming materials are uncertain.',layers:[
    ['Possible rocky core','Dense rock near the center.',.29,core],['Deep interior','Hot, compressed material that may include water, methane and ammonia.',.79,ice],['Atmosphere','Hydrogen and helium with methane.',1,'#73b9ce']]},
  Neptune:{note:'The interior cannot be observed directly. This schematic shows one proposed layered model.',layers:[
    ['Possible rocky core','A dense, rocky center.',.29,core],['Deep interior','A hot mixture thought to contain water, methane and ammonia.',.81,ice],['Atmosphere','Hydrogen and helium with methane.',1,'#567fc9']]}
};

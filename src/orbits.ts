export type Vec3 = [
    number,
    number,
    number
];
export interface CelestialBody {
    name: string;
    color: string;
    radius: number;
    period: number;
    type: string;
    description: string;
    rotation: number;
    tilt: number;
    a?: number;
    e?: number;
    i?: number;
    L?: number;
    peri?: number;
    node?: number;
}
export interface OrbitingBody extends CelestialBody {
    a: number;
    e: number;
    i: number;
    L: number;
    peri: number;
    node: number;
}
export function isOrbitingBody(body: CelestialBody): body is OrbitingBody {
    return body.a !== undefined && body.e !== undefined && body.i !== undefined
        && body.L !== undefined && body.peri !== undefined && body.node !== undefined;
}
// Approximate fixed J2000 elements: a [AU], e, i, mean longitude,
// longitude of perihelion, longitude of ascending node [degrees].
export const AU_KM = 149597870.7;
export const bodies: CelestialBody[] = [
    { name: 'Sun', color: '#ffbf64', radius: 696340, period: 0, type: 'Our home star', description: 'The heart of our solar system. Its gravity holds eight extraordinary worlds in orbit.', rotation: 25.05, tilt: 7.25 },
    { name: 'Mercury', color: '#a69b8a', radius: 2439.7, period: 87.969, a: .387099, e: .205636, i: 7.005, L: 252.251, peri: 77.457, node: 48.330, rotation: 58.646, tilt: .034, type: 'Terrestrial planet', description: 'A small, cratered world of extremes. Mercury races around the Sun in just 88 Earth days.' },
    { name: 'Venus', color: '#d9bb83', radius: 6051.8, period: 224.701, a: .723336, e: .006777, i: 3.395, L: 181.980, peri: 131.602, node: 76.680, rotation: -243.025, tilt: 2.64, type: 'Terrestrial planet', description: 'Wrapped in thick, golden clouds, Venus is our nearest planetary neighbor in size — and a fiercely hot world.' },
    { name: 'Earth', color: '#5b9bcb', radius: 6371, period: 365.256, a: 1.000003, e: .016711, i: -.000015, L: 100.464, peri: 102.938, node: 0, rotation: .99727, tilt: 23.44, type: 'Terrestrial planet', description: 'Our pale blue home. Liquid oceans, drifting clouds, and a single Moon make this world unmistakable.' },
    { name: 'Mars', color: '#c66f4e', radius: 3389.5, period: 686.980, a: 1.523710, e: .093394, i: 1.8497, L: -4.553, peri: -23.944, node: 49.560, rotation: 1.025957, tilt: 25.19, type: 'Terrestrial planet', description: 'Rust-red deserts, polar ice, and ancient riverbeds. A world that keeps inviting us to look closer.' },
    { name: 'Jupiter', color: '#ceb28d', radius: 69911, period: 4332.59, a: 5.202887, e: .048386, i: 1.3044, L: 34.396, peri: 14.729, node: 100.474, rotation: .41354, tilt: 3.13, type: 'Gas giant', description: 'The giant of the planets. Bands of turbulent clouds sweep around a world with a centuries-old great storm.' },
    { name: 'Saturn', color: '#d6c49b', radius: 58232, period: 10759.22, a: 9.536676, e: .053862, i: 2.48599, L: 49.954, peri: 92.599, node: 113.662, rotation: .44401, tilt: 26.73, type: 'Gas giant', description: 'An entire world framed by ice. Saturn’s broad, delicate rings are made of countless orbiting fragments.' },
    { name: 'Uranus', color: '#91cbd0', radius: 25362, period: 30688.5, a: 19.189165, e: .047257, i: .77264, L: 313.238, peri: 170.954, node: 74.017, rotation: -.71833, tilt: 82.23, type: 'Ice giant', description: 'A quiet cyan world with an extraordinary lean. Uranus rolls around the Sun almost on its side.' },
    { name: 'Neptune', color: '#4d79ca', radius: 24622, period: 60182, a: 30.069923, e: .008590, i: 1.77004, L: -55.120, peri: 44.964, node: 131.784, rotation: .67125, tilt: 28.32, type: 'Ice giant', description: 'Deep blue and far from home. Powerful winds race through the atmosphere of the outermost planet.' }
];
export function eccentricAnomaly(M: number, e: number): number { M = ((M + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; let E = M; for (let k = 0; k < 10; k++)
    E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); return E; }
export function orbitPosition(b: CelestialBody, days: number, exploration = false): Vec3 { if (!isOrbitingBody(b))
    return [0, 0, 0]; const d = Math.PI / 180; const E = eccentricAnomaly((b.L - b.peri) * d + days * 2 * Math.PI / b.period, b.e); const a = exploration ? 7 + 10 * Math.sqrt(b.a) : b.a * 20; const x = a * (Math.cos(E) - b.e), z = a * Math.sqrt(1 - b.e * b.e) * Math.sin(E); const w = (b.peri - b.node) * d, n = b.node * d, i = b.i * d; const u = x * Math.cos(w) - z * Math.sin(w), v = x * Math.sin(w) + z * Math.cos(w); return [u * Math.cos(n) - v * Math.cos(i) * Math.sin(n), v * Math.sin(i), u * Math.sin(n) + v * Math.cos(i) * Math.cos(n)]; }
export function bodyRadius(b: CelestialBody, exploration: boolean): number { return exploration ? (b.name === 'Sun' ? 3.5 : .39 + Math.sqrt(b.radius / 6371) * .65) : b.radius / AU_KM * 20; }

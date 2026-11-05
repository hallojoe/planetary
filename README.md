# Planetary

An interactive, dependency-free 3D solar system built with WebGL and native JavaScript. Includes the Sun, all eight planets, an illustrative Earth–Moon system, Saturn's rings, a deterministic star field, and sun-facing lighting.

## Run

Requires Python 3 for the development server and Node.js 18+ for checks. No package installation or build step is needed.

```sh
npm run dev
# Open http://localhost:5173
npm test
npm run check
```

Deploy the contents of `dist/` to any static host. Files must be served over HTTP(S), because the app uses ES modules. WebGL and hardware acceleration are required. No analytics or external data services are used.

## Explore

- Drag to orbit; scroll to zoom; right-drag or Shift-drag to pan.
- On touch devices, use one finger to orbit and two fingers to pan or pinch to zoom.
- Select a body in the bottom navigation, then choose **Explore** to follow it. Double-click a body's location to focus it directly.
- Use W/A/S/D to move horizontally, Q/E to move down/up, Escape to leave follow mode, R to return to the overview, and Space to pause.
- Adjust time warp from 0.01 to 1,000 simulation days per real second. Reset time returns to J2000 (January 1, 2000, 12:00 UTC).
- Choose **Textured**, **Shaded**, or **Wireframe**. Textured mode offers **Natural** and **Atlas** procedural surfaces.
- Switch between **Exploration** (compressed distances, enlarged bodies) and **True scale** (consistent AU-to-world-unit conversion). At true scale most planets are tiny in the overview; use Explore to inspect them.

## Scientific scope

Planetary paths solve Kepler's equation using fixed approximate J2000 orbital elements, including eccentricity, inclination, ascending node, and perihelion orientation. Orbital periods and mean planetary radii are represented separately. This is an educational orbital model, not a live ephemeris, N-body gravity solver, or tool for predicting events. It omits precession, planetary perturbations, eclipses, light travel time, and most moons. The Moon uses an illustrative inclined circular orbit. Its initial phase and node are not an ephemeris.

Surfaces are generated mathematically in a fragment shader. They suggest planetary colors, cloud bands, craters, oceans, and continents; they are **not photographs or geographically accurate maps**. Atlas is an artistic contour visualization, not measured topography. Axial rotations illustrate planetary spin periods and tilts but do not reproduce reference meridians or full inertial pole orientations. Saturn's rings are illustrative.

## Source

- `dist/index.html`: accessible interface and navigation help
- `dist/style.css`: responsive observatory interface
- `dist/app.js`: WebGL renderer, procedural materials, camera and simulation controls
- `dist/orbits.js`: planetary constants, scale conversion and Keplerian orbits
- `tests/orbits.test.js`: orbital closure, extrema, solver accuracy, scale and finite-value checks

## Verification

Automated orbital tests and JavaScript syntax checks are included. Interactive browser QA was unavailable in the creation environment because its managed preview service was not running. Cross-device rendering, touch behavior, and GPU performance still need browser verification.

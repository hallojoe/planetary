# Planetary

An interactive 3D solar system built with WebGL and strict TypeScript. Vite serves and builds the application; Vitest runs the orbital tests. Includes the Sun, all eight planets, an illustrative Earth–Moon system, Saturn's rings, a deterministic star field, and sun-facing lighting. The browser application has no runtime package dependencies.

## Develop, test, and build

Requires Node.js 20.19+ within v20, or 22.12+ (Node.js 24 LTS recommended), and npm.

```sh
npm ci
npm run dev
# Open the URL printed by Vite (normally http://localhost:5173)
```

| Command | Purpose |
| --- | --- |
| `npm run dev` / `npm run serve` | Vite development server with live updates |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Rerun tests as source files change |
| `npm run check` | Check application, tests, and configuration with strict TypeScript |
| `npm run build` | Type-check, then create the production build in `dist/` |
| `npm run preview` | Serve the existing production build locally for verification |

`index.html` is Vite's entry point and loads `src/app.ts`. Edit files in `src/`; `dist/` is generated output and is ignored by Git. Dependencies are locked in `package-lock.json` for reproducible installs.

To deploy, run `npm run build` and upload `dist/` to a static host. `npm run preview` is a local check, not a production server. WebGL and hardware acceleration are required. No analytics or external data services are used.

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

- `index.html`: Vite HTML entry point, interface, and navigation help
- `src/app.ts`: typed WebGL renderer, procedural materials, camera, and controls
- `src/orbits.ts`: typed planetary data, scale conversion, and Keplerian orbits
- `src/style.css`: responsive observatory interface
- `tests/orbits.test.ts`: Vitest tests for orbital closure, extrema, solver accuracy, scale, and finite values
- `vite.config.ts`: shared Vite and Vitest configuration
- `tsconfig.json`: strict TypeScript settings; compilation is handled by Vite

## Verification

All five Vitest orbital tests and the production build (including strict TypeScript checks) pass. Interactive browser QA remains unverified because the managed preview service is unavailable. Cross-device rendering, touch behavior, and GPU performance still need browser verification.

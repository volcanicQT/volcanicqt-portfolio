# Santanu Saha · VolcanicQT — 3D portfolio

Run locally:

```
node serve.mjs
```

Then open http://localhost:5173

- **All text** lives in `data.js`. Edit it and refresh.
- **3D scene** (Three.js): `scene.js`. Each section has a layout in the `DESK` array.
- **Sections / DOM**: `ui.js`. **Styles**: `style.css`.
- **Videos** play muted while on screen. The first click or tap on the page turns sound on at 12% volume for the video most in view (`VOLUME` in `ui.js`).

Deploy: drag the `portfolio-3d` folder onto Netlify Drop, or push it to GitHub Pages / Vercel as a static site. There is no build step. `serve.mjs` is only for local preview.

Original full-quality videos and Canva exports are in `../portfolio-3d-raw` (not needed for the site).

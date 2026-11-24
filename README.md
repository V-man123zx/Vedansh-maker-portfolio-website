# Vedansh Wadhwani · maker portfolio

A 3D flythrough of every build. Scrolling moves the camera along a copper wire that leaves a chip, coils around each project's 3D model and threads through its photos and video. Each project also has its own page, and `/projects` lists them all as text.

## Stack

Vite, React, React Router, vanilla Three.js and hand-written CSS, hosted on Vercel with Vercel Analytics.

```bash
npm install
npm run dev      # local dev server
npm run build    # production build in dist/
```

## Where things live

| Path | What |
| --- | --- |
| `src/data/projects.js` | Every project's text, links and CAD; `FEATURED` picks the showroom's projects |
| `src/data/media.json` | Photo and video list per project (files in `public/m/`) |
| `src/showroom/engine.js` | The Three.js world: stops, wire, camera rail, scroll timeline |
| `src/showroom/models.js` | The `.glb` CAD loader |
| `src/pages/` | Showroom, phone home page (`MobileHome`), project page, all-projects list |

## Adding the real CAD

1. Export the assembly from CAD as `.glb` (binary glTF). Keep part names; they show up as hover labels.
2. Drop it in `public/cad/`, e.g. `public/cad/drone.glb`.
3. In `src/data/projects.js`, set that project's `cad` to `"/cad/drone.glb"`.

The model is centered and scaled to fit its stage automatically, and its parts spread apart in the exploded view.

## Adding a project

Add an entry to `PROJECTS` in `src/data/projects.js` and its media to `media.json`. It shows up on `/projects` straight away; add its slug to `FEATURED` to give it a showroom stop (laid out automatically) and a card on the phone home page.

## Model credits

- The Yaskawa HC10 in the MechMind cell (`public/cad/mechmind.glb`) uses the visual meshes and kinematics from ROS-Industrial's [`motoman_hc10_support`](https://github.com/ros-industrial/motoman/tree/kinetic-devel/motoman_hc10_support) package (BSD).
- The SO-101 arm in Skillsmith (`public/cad/skillsmith.glb`) comes from Google DeepMind's [MuJoCo Menagerie](https://github.com/google-deepmind/mujoco_menagerie/tree/main/robotstudio_so101) (Apache 2.0).

import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PROJECTS, PROFILE, stopMedia } from "../data/projects.js";
import TopBar from "../components/TopBar.jsx";
import Lightbox from "../components/Lightbox.jsx";
import { Meta } from "../components/ProjectText.jsx";
import ProjectIndex from "./ProjectIndex.jsx";

const END = PROJECTS.length + 1;
const LABELS = ["Start", ...PROJECTS.map(p => p.title), "End"];

export default function Showroom() {
  const canvas = useRef(null), track = useRef(null), tip = useRef(null), hint = useRef(null), engine = useRef(null);
  const overlays = useRef([]), ticks = useRef([]);
  const [cur, setCur] = useState(0), [nogl, setNogl] = useState(false), [open, setOpen] = useState(false), [media, setMedia] = useState(null);
  const [params] = useSearchParams();
  const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    document.title = "Vedansh Wadhwani · Maker";
    const dbg = /p=([\d.]+)/.exec(location.hash);
    let gone = false;
    // three.js loads as its own chunk so project pages stay light
    import("../showroom/engine.js").then(({ createShowroom }) => {
      if (gone) return;
      const eng = createShowroom(canvas.current, {
        projects: PROJECTS, media: stopMedia, overlays: overlays.current, ticks: ticks.current,
        track: track.current, tip: tip.current, hint: hint.current, reduce,
        debugS: dbg ? parseFloat(dbg[1]) : null,
        onStop: setCur, onOpenMedia: (p, item) => setMedia({ item, title: p.title })
      });
      if (!eng) { setNogl(true); return; }
      engine.current = eng;
      const at = PROJECTS.findIndex(p => p.slug === params.get("at")) + 1;
      scrollTo(0, at > 0 ? eng.scrollFor(at) : 0); eng.sync();
    }).catch(e => { console.error(e); setNogl(true); });
    return () => { gone = true; engine.current?.destroy(); engine.current = null; };
    // the scene is built once per visit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const go = useCallback(k => { setOpen(false); engine.current?.goTo(k); }, []);
  const closeMedia = useCallback(() => setMedia(null), []);

  if (nogl) return <ProjectIndex note="Your browser couldn't start the 3D showroom, so here's every project as a list." />;

  const ov = i => el => { overlays.current[i] = el; };
  return (
    <div className="showroom">
      <canvas ref={canvas} className="gl" aria-hidden="true" />
      <div ref={track} className="track" />
      <TopBar fixed />

      <main>
        <section ref={ov(0)} data-kind="hero" className="ov hero" aria-labelledby="name">
          <img className="avatar" src="/vedansh.webp" alt="" width="88" height="88" />
          <p className="eyebrow">{PROFILE.role.toUpperCase()}</p>
          <h1 id="name">{PROFILE.name}</h1>
          <p className="lede">I design and build robots, drones, circuit boards and the code that runs them. Scroll to send the signal out of the chip and ride the wire through all {PROJECTS.length} builds.</p>
          <span className="cue">SCROLL<i>↓</i></span>
        </section>

        {PROJECTS.map((p, i) => (
          <section key={p.slug} ref={ov(i + 1)} data-kind="panel" className="ov panel gone" aria-labelledby={`t-${p.slug}`}>
            <Meta p={p} i={i} />
            <h2 id={`t-${p.slug}`}>{p.title}</h2>
            <p className="summary">{p.summary}</p>
            <div className="panel-foot">
              <Link className="more" to={`/projects/${p.slug}`}>View full project →</Link>
              <span className="cad">{p.cad && "CAD MODEL"}</span>
            </div>
          </section>
        ))}

        <section ref={ov(END)} data-kind="outro" className="ov outro gone" aria-labelledby="end-t">
          <p className="eyebrow">SIGNAL RECEIVED</p>
          <h2 id="end-t">That's all {PROJECTS.length} builds</h2>
          <p>Every project has its own page with the full write-up, photos and video.</p>
          <div className="contact">
            <Link to="/projects">All projects →</Link>
            <a href={PROFILE.github} target="_blank" rel="noopener">GitHub ↗</a>
            <a href={PROFILE.linkedin} target="_blank" rel="noopener">LinkedIn ↗</a>
            <a href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a>
          </div>
        </section>
      </main>

      <nav className="dir" aria-label="Directory">
        <button type="button" className="dir-btn" aria-expanded={open} onClick={() => setOpen(o => !o)}>
          <span className="dir-word">DIRECTORY</span> <b>{cur === 0 ? "START" : cur === END ? "END" : `${String(cur).padStart(2, "0")} / ${PROJECTS.length}`}</b> <span aria-hidden="true">{open ? "▾" : "▴"}</span>
        </button>
        <div className="ticks">
          {LABELS.map((l, k) => <button key={l} type="button" ref={el => { ticks.current[k] = el; }} className={k === cur ? "cur" : ""} aria-label={`Go to ${l}`} onClick={() => go(k)} />)}
        </div>
        {open && (
          <ol className="dir-list">
            {LABELS.map((l, k) => <li key={l}><button type="button" className={k === cur ? "cur" : ""} onClick={() => go(k)}><span>{k === 0 ? "··" : k === END ? "■" : String(k).padStart(2, "0")}</span>{l}</button></li>)}
          </ol>
        )}
      </nav>
      <div ref={hint} className="hint">DRAG TO ROTATE · HOVER A PART · CLICK A PHOTO</div>
      <div ref={tip} className="tip" hidden />
      <Lightbox item={media?.item} title={media?.title} onClose={closeMedia} />
    </div>
  );
}

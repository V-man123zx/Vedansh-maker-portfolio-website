import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PROJECTS, FEATURED, PROFILE, cover } from "../data/projects.js";
import TopBar from "../components/TopBar.jsx";
import Lightbox from "../components/Lightbox.jsx";
import { Award } from "../components/ProjectText.jsx";

// phones (and phones held sideways) get this page instead of the 3D showroom
export const PHONE_QUERY = "(max-width: 760px), (pointer: coarse) and (max-height: 520px)";

// videos only play while they're on screen, which keeps the page light on mobile data
function useAutoplay(root) {
  useEffect(() => {
    const vids = [...root.current.querySelectorAll("video")];
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) e.target.play().catch(() => {});
      else e.target.pause();
    }), { threshold: .6 });
    vids.forEach(v => io.observe(v));
    return () => io.disconnect();
  }, [root]);
}

function Feature({ p, i, onOpen }) {
  const media = [...p.videos.map(v => ({ ...v, video: true })), ...p.photos].slice(0, 6);
  return (
    <article className={`m-feat${p.award ? " won" : ""}`} aria-labelledby={`m-${p.slug}`}>
      {media.length > 0 && (
        <div className="m-rail" aria-label={`${p.title} photos and video`}>
          {media.map(m => (
            <button type="button" key={m.src} onClick={() => onOpen(p, m)} style={{ aspectRatio: `${m.w} / ${m.h}` }} aria-label={`Open ${m.c}`}>
              {m.video
                ? <video src={m.src} poster={m.poster} muted loop playsInline preload="none" />
                : <img src={m.src} alt={`${p.title}: ${m.c}`} loading="lazy" />}
              <span className="cap">{m.video ? "▶ " : ""}{m.c.toUpperCase()}</span>
            </button>
          ))}
        </div>
      )}
      <div className="m-txt">
        <div className="meta"><span className="num">{String(i + 1).padStart(2, "0")} / {FEATURED.length}</span><span>{p.cat.toUpperCase()}</span>{p.wip && <span className="wip">IN PROGRESS</span>}</div>
        <Award p={p} />
        <h2 id={`m-${p.slug}`}>{p.title}</h2>
        <p>{p.summary}</p>
        <dl className="m-spec">
          {p.spec.slice(0, 3).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        </dl>
        <Link className="more" to={`/projects/${p.slug}`}>Full project →</Link>
      </div>
    </article>
  );
}

export default function MobileHome() {
  const root = useRef(null);
  const [media, setMedia] = useState(null);
  const close = useCallback(() => setMedia(null), []);
  const open = useCallback((p, item) => setMedia({ item, title: p.title }), []);
  useAutoplay(root);
  useEffect(() => { document.title = "Vedansh Wadhwani · Maker"; }, []);
  const rest = PROJECTS.filter(p => !FEATURED.includes(p));

  return (
    <div className="page mobile" ref={root}>
      <TopBar />
      <main className="wrap">
        <header className="m-hero">
          <img className="avatar" src="/vedansh.webp" alt="" width="72" height="72" />
          <p className="eyebrow">{PROFILE.role.toUpperCase()}</p>
          <h1>{PROFILE.name}</h1>
          <p className="lede">I design and build industrial robot cells, robot dogs, drones, circuit boards and the code that runs them.</p>
          <div className="m-links">
            <a href={PROFILE.github} target="_blank" rel="noopener">GitHub ↗</a>
            <a href={PROFILE.linkedin} target="_blank" rel="noopener">LinkedIn ↗</a>
            <a href={`mailto:${PROFILE.email}`}>Email</a>
          </div>
        </header>

        <h2 className="sec">Best {FEATURED.length} builds</h2>
        {FEATURED.map((p, i) => <Feature key={p.slug} p={p} i={i} onOpen={open} />)}

        <h2 className="sec">More builds · {rest.length}</h2>
        <ul className="m-more">
          {rest.map(p => (
            <li key={p.slug}>
              <Link to={`/projects/${p.slug}`}>
                {cover(p) ? <img src={cover(p)} alt="" loading="lazy" /> : <span className="m-blank" aria-hidden="true" />}
                <span><b>{p.title}</b><small>{p.cat.toUpperCase()}</small></span>
              </Link>
            </li>
          ))}
        </ul>

        <footer className="foot">
          <span>{PROFILE.name}</span>
          <span className="ln"><a href={PROFILE.github} target="_blank" rel="noopener">GitHub</a><a href={PROFILE.linkedin} target="_blank" rel="noopener">LinkedIn</a><a href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a></span>
        </footer>
      </main>
      <Lightbox item={media?.item} title={media?.title} onClose={close} />
    </div>
  );
}

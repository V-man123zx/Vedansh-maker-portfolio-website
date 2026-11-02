import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PROJECTS, PROFILE, bySlug } from "../data/projects.js";
import TopBar from "../components/TopBar.jsx";
import Lightbox from "../components/Lightbox.jsx";
import { Meta, Detail, Spec, Tags, Links } from "../components/ProjectText.jsx";

export default function ProjectPage() {
  const { slug } = useParams();
  const p = bySlug[slug], i = PROJECTS.indexOf(p);
  const [media, setMedia] = useState(null);
  const close = useCallback(() => setMedia(null), []);
  useEffect(() => { scrollTo(0, 0); document.title = p ? `${p.title} · Vedansh Wadhwani` : "Not found · Vedansh Wadhwani"; }, [p]);

  if (!p) return (
    <div className="page"><TopBar /><main className="wrap notfound"><p className="eyebrow">404 · NO SIGNAL</p><h1>No project called “{slug}”</h1><p><Link to="/projects">See every project</Link></p></main></div>
  );
  const prev = PROJECTS[(i - 1 + PROJECTS.length) % PROJECTS.length], next = PROJECTS[(i + 1) % PROJECTS.length];
  const all = [...p.videos.map(v => ({ ...v, video: true })), ...p.photos];
  const lead = all[0];

  return (
    <div className="page">
      <TopBar />
      <main className="wrap project">
        <Link className="back" to={`/?at=${p.slug}`}>← See it in the showroom</Link>
        <div className="project-top">
          <div className="project-txt">
            <Meta p={p} i={i} />
            <h1>{p.title}</h1>
            <p className="summary">{p.summary}</p>
            <Detail p={p} />
            <Spec p={p} />
            <Tags p={p} />
            <Links p={p} />
          </div>
          {lead && (
            <button type="button" className="lead" onClick={() => setMedia(lead)} aria-label={`Open ${lead.c}`}>
              {lead.video
                ? <video src={lead.src} poster={lead.poster} muted loop playsInline autoPlay />
                : <img src={lead.src} alt={`${p.title}: ${lead.c}`} />}
              <span className="cap">{lead.video ? "▶ " : ""}{lead.c.toUpperCase()}</span>
            </button>
          )}
        </div>

        {all.length > 1 && (
          <section aria-label="Gallery">
            <h2 className="sec">Gallery</h2>
            <div className="gallery">
              {all.slice(1).map(m => (
                <button type="button" key={m.src} onClick={() => setMedia(m)} style={{ aspectRatio: `${m.w} / ${m.h}` }} aria-label={`Open ${m.c}`}>
                  {m.video ? <video src={m.src} poster={m.poster} muted loop playsInline autoPlay preload="metadata" /> : <img src={m.src} alt={`${p.title}: ${m.c}`} loading="lazy" />}
                  <span className="cap">{m.video ? "▶ " : ""}{m.c.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <nav className="pager" aria-label="More projects">
          <Link to={`/projects/${prev.slug}`}><span>← PREVIOUS</span>{prev.title}</Link>
          <Link to={`/projects/${next.slug}`} className="nx"><span>NEXT →</span>{next.title}</Link>
        </nav>
        <footer className="foot">
          <span>{PROFILE.name}</span>
          <span className="ln"><a href={PROFILE.github} target="_blank" rel="noopener">GitHub</a><a href={PROFILE.linkedin} target="_blank" rel="noopener">LinkedIn</a><a href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a></span>
        </footer>
      </main>
      <Lightbox item={media} title={p.title} onClose={close} />
    </div>
  );
}

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PROJECTS, PROFILE, cover } from "../data/projects.js";
import TopBar from "../components/TopBar.jsx";
import { Award } from "../components/ProjectText.jsx";

export default function ProjectIndex({ note }) {
  useEffect(() => { document.title = "All projects · Vedansh Wadhwani"; scrollTo(0, 0); }, []);
  return (
    <div className="page">
      <TopBar />
      <main className="wrap">
        <header className="index-head">
          <p className="eyebrow">{PROFILE.role.toUpperCase()}</p>
          <h1>All {PROJECTS.length} builds</h1>
          {note && <p className="note">{note}</p>}
        </header>
        <ol className="grid">
          {PROJECTS.map((p, i) => (
            <li key={p.slug}>
              <Link className="card" to={`/projects/${p.slug}`}>
                {cover(p) ? <img src={cover(p)} alt="" loading="lazy" /> : <div className="card-blank" aria-hidden="true">{p.cat.toUpperCase()}</div>}
                <div className="card-txt">
                  <div className="meta"><span className="num">{String(i + 1).padStart(2, "0")}</span><span>{p.cat.toUpperCase()}</span>{p.wip && <span className="wip">IN PROGRESS</span>}</div>
                  <Award p={p} />
                  <h2>{p.title}</h2>
                  <p>{p.summary}</p>
                </div>
              </Link>
            </li>
          ))}
        </ol>
        <footer className="foot">
          <span>{PROFILE.name}</span>
          <span className="ln"><a href={PROFILE.github} target="_blank" rel="noopener">GitHub</a><a href={PROFILE.linkedin} target="_blank" rel="noopener">LinkedIn</a><a href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a></span>
        </footer>
      </main>
    </div>
  );
}

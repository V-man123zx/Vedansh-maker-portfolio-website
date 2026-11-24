import { Link, NavLink } from "react-router-dom";
import { PROFILE } from "../data/projects.js";

export default function TopBar({ fixed = false }) {
  return (
    <header className={`top${fixed ? " fixed" : ""}`}>
      <Link to="/" className="brand">VEDANSH WADHWANI</Link>
      <nav aria-label="Main">
        <NavLink to="/" end><span className="lbl-wide">Showroom</span><span className="lbl-phone">Home</span></NavLink>
        <NavLink to="/projects">All projects</NavLink>
        <a href={PROFILE.github} target="_blank" rel="noopener">GitHub</a>
        <a href={PROFILE.linkedin} target="_blank" rel="noopener">LinkedIn</a>
      </nav>
    </header>
  );
}

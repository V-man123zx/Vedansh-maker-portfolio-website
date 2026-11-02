import { Routes, Route, Link } from "react-router-dom";
import Showroom from "./pages/Showroom.jsx";
import ProjectIndex from "./pages/ProjectIndex.jsx";
import ProjectPage from "./pages/ProjectPage.jsx";
import TopBar from "./components/TopBar.jsx";

function NotFound() {
  return (
    <div className="page">
      <TopBar />
      <main className="wrap notfound">
        <p className="eyebrow">404 · NO SIGNAL</p>
        <h1>Nothing on this pin</h1>
        <p><Link to="/">Back to the showroom</Link> or <Link to="/projects">see every project</Link>.</p>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Showroom />} />
      <Route path="/projects" element={<ProjectIndex />} />
      <Route path="/projects/:slug" element={<ProjectPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

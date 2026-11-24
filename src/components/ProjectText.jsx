// The write-up shared by showroom panels and project pages.
export function Meta({ p, i, n }) {
  return (
    <div className="meta">
      <span className="num">{String(i + 1).padStart(2, "0")} / {n}</span>
      <span><span className="led" />{p.status.toUpperCase()}</span>
      <span>{p.cat.toUpperCase()}</span>
    </div>
  );
}

// a gold badge for a competition win
export function Award({ p }) {
  return p.award ? <div className="award"><span aria-hidden="true">🏆</span> {p.award.toUpperCase()}</div> : null;
}

export function Detail({ p }) {
  return Array.isArray(p.detail)
    ? <ul className="detail">{p.detail.map(d => <li key={d}>{d}</li>)}</ul>
    : <p className="detail">{p.detail}</p>;
}

export function Spec({ p }) {
  return (
    <table className="spec"><tbody>
      {p.spec.map(([k, v]) => <tr key={k}><th scope="row">{k}</th><td>{v}</td></tr>)}
    </tbody></table>
  );
}

export function Tags({ p }) {
  return <div className="tags">{p.tags.map(t => <span className="tag" key={t}>{t}</span>)}</div>;
}

export function Links({ p }) {
  if (!p.links.length) return null;
  return <div className="links">{p.links.map(([l, u]) => <a key={u} href={u} target="_blank" rel="noopener">{l} ↗</a>)}</div>;
}

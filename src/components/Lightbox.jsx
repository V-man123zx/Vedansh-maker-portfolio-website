import { useEffect, useRef } from "react";

// Full-screen viewer for one photo or video. `item` is a media entry; `title` is its project's name.
export default function Lightbox({ item, title, onClose }) {
  const close = useRef(null);
  useEffect(() => {
    if (!item) return;
    const back = document.activeElement;
    close.current?.focus();
    const key = e => { if (e.key === "Escape") onClose(); };
    addEventListener("keydown", key);
    return () => { removeEventListener("keydown", key); back?.focus?.(); };
  }, [item, onClose]);
  if (!item) return null;
  return (
    <div className="lb" role="dialog" aria-modal="true" aria-label="Media viewer" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bar"><button type="button" ref={close} onClick={onClose}>CLOSE ✕</button></div>
      <div className="lb-media">
        {item.video
          ? <video src={item.src} poster={item.poster} muted loop playsInline autoPlay controls />
          : <img src={item.src} alt={`${title}: ${item.c}`} />}
      </div>
      <p className="txt"><b>{title}</b>{item.c}</p>
    </div>
  );
}

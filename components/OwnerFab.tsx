"use client";

import { useEffect, useState } from "react";

/** Floating "+" menu shown only to the logged-in owner (visitors never see it). */
export default function OwnerFab() {
  const [owner, setOwner] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/admin/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { owner?: boolean }) => setOwner(Boolean(d.owner)))
      .catch(() => {});
  }, []);

  if (!owner) return null;
  const items = [
    ["/admin?new=project", "Add a project", "Upload docs → auto-fill → publish"],
    ["/admin?tab=profile", "Update profile & photo", "Bio, links, photo, résumé"],
    ["/admin?tab=skills", "Add skills", "Skills not tied to a project"],
    ["/admin", "Open dashboard", "Edit or delete anything"],
  ];
  return (
    <div className="fab-wrap">
      {open && (
        <div className="fab-menu" role="menu">
          {items.map(([href, title, sub]) => (
            <a key={href} href={href} role="menuitem">
              <b>{title}</b>
              <span>{sub}</span>
            </a>
          ))}
        </div>
      )}
      <button
        className={`fab ${open ? "open" : ""}`}
        aria-label="Add to portfolio"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        +
      </button>
    </div>
  );
}

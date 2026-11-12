import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Native keyboard behavior, with expensive detail content mounted on demand.
 * With an id, a link to #id opens it and scrolls to it (the arcade's notes link here).
 */
export function Disclosure({
  className,
  summary,
  children,
  id,
}: {
  className: string;
  summary: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const element = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (!id) return;
    const check = () => {
      if (window.location.hash !== `#${id}` || !element.current) return;
      element.current.open = true;
      element.current.scrollIntoView({ block: "start" });
      element.current.querySelector("summary")?.focus({ preventScroll: true });
    };
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, [id]);
  return (
    <details
      id={id}
      ref={element}
      className={className}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>{summary}</summary>
      {open ? children : null}
    </details>
  );
}

import { useState } from "react";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import { home } from "../content/home";
import { contactLinks } from "../content/profile";

const email = contactLinks
  .find((link) => link.label === "Email")!
  .href.slice(7);
export function ContactSection() {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }
  return (
    <section
      className="contact-section section"
      id="contact"
      aria-labelledby="contact-title"
    >
      <p className="eyebrow">04 / Say hello</p>
      <div className="contact-section__body">
        <div>
          <h2 id="contact-title">{home.contactTitle}</h2>
          <p>{home.contactDescription}</p>
        </div>
        <a
          className="contact-arrow"
          href={`mailto:${email}`}
          aria-label="Email Boris"
        >
          <ArrowUpRight />
        </a>
      </div>
      <div className="contact-section__links">
        <a className="contact-email" href={`mailto:${email}`}>
          {email}
        </a>
        <button
          type="button"
          className="icon-button"
          onClick={copyEmail}
          aria-label="Copy email address"
        >
          {copyState === "copied" ? <Check size={17} /> : <Copy size={17} />}
        </button>
        <div className="contact-socials">
          {contactLinks
            .filter((link) => link.external)
            .map((link) => (
              <a
                href={link.href}
                key={link.label}
                target="_blank"
                rel="noreferrer"
              >
                {link.label}
                <ArrowUpRight size={14} />
              </a>
            ))}
        </div>
      </div>
      <p className="copy-status" role="status">
        {copyState === "copied"
          ? "Email copied."
          : copyState === "failed"
            ? "Copy unavailable. You can select the email address above."
            : ""}
      </p>
    </section>
  );
}

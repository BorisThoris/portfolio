import { useState } from "react";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import { home } from "../../content/home";
import { contactLinks } from "../../content/profile";

const email = contactLinks.find((link) => link.label === "Email")!.href.slice(7);

/** The closing call to action: one big sticky note with the one action on it. */
export function Contact() {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }
  return (
    <section id="contact" className="sec contact" aria-labelledby="contact-title">
      <div className="contact__note note" data-reveal>
        <p className="label">06 / Contact</p>
        <h2 id="contact-title" className="hand">{home.contactTitle}</h2>
        <p className="contact__lede">{home.contactDescription}</p>
        <div className="contact__row">
          <a className="contact__email" href={`mailto:${email}`}>{email}<ArrowUpRight size={22} aria-hidden="true" /></a>
          <button type="button" className="icon-button" onClick={copyEmail} aria-label="Copy email address">
            {copyState === "copied" ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
        <ul className="contact__links">
          {contactLinks.filter((link) => link.external).map((link) => (
            <li key={link.label}>
              <a className="link" href={link.href} target="_blank" rel="noreferrer">{link.label}<ArrowUpRight size={13} /></a>
            </li>
          ))}
        </ul>
        <p className="contact__status" role="status">
          {copyState === "copied" ? "Email copied." : copyState === "failed" ? "Copy unavailable. You can select the email address above." : ""}
        </p>
      </div>
    </section>
  );
}

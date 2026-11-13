import { useEffect, useRef, useState } from "react";
import { requestPlay } from "../../content/sandboxes";
import { useMediaQuery } from "../../lib/runtime";

// Memory Dungeon's own card art, from the game's repository: the painted labyrinth
// back and three face panels. A three-pair board to flip, that hands over to the game.
const BACK = "/play/memory-dungeon/back.webp";
const FACES = [
  { id: "chalice", src: "/play/memory-dungeon/chalice.webp", name: "chalice" },
  { id: "hourglass", src: "/play/memory-dungeon/hourglass.webp", name: "hourglass" },
  { id: "scarab", src: "/play/memory-dungeon/scarab.webp", name: "scarab" },
];
type Card = { key: number; face: (typeof FACES)[number] };

function deal(): Card[] {
  const cards = [...FACES, ...FACES].map((face, key) => ({ key, face }));
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export function MemoryFlip() {
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [cards, setCards] = useState<Card[]>(() => deal());
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [flips, setFlips] = useState(0);
  const [said, setSaid] = useState("");
  const timer = useRef<number | null>(null);

  useEffect(() => { [BACK, ...FACES.map((face) => face.src)].forEach((src) => { const image = new Image(); image.src = src; }); }, []);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const pairs = matched.length;
  const cleared = pairs === FACES.length;

  const flip = (index: number) => {
    if (open.length === 2 || open.includes(index) || matched.includes(cards[index].face.id)) return;
    const next = [...open, index];
    setOpen(next);
    setFlips((value) => value + 1);
    if (next.length < 2) { setSaid(`A ${cards[index].face.name}`); return; }
    const [a, b] = next.map((i) => cards[i].face);
    if (a.id === b.id) {
      setMatched((value) => [...value, a.id]);
      setOpen([]);
      setSaid(pairs + 1 === FACES.length ? "All three pairs. Board cleared." : `A pair of ${a.name}s`);
    } else {
      setSaid(`A ${b.name}. No match.`);
      timer.current = window.setTimeout(() => { setOpen([]); timer.current = null; }, reduced ? 700 : 950);
    }
  };
  const again = () => { setCards(deal()); setOpen([]); setMatched([]); setFlips(0); setSaid("Shuffled"); };

  return (
    <div className="flip">
      <div className="toss__head">
        <p className="label">Memory Dungeon · flip two</p>
        <p className="flip__count num">{pairs}<span className="label">/3 pairs · {flips} flips</span></p>
      </div>
      <div className={`flip__board${reduced ? " is-still" : ""}`} role="group" aria-label="Six face-down cards">
        {cards.map((card, index) => {
          const up = open.includes(index) || matched.includes(card.face.id);
          const done = matched.includes(card.face.id);
          return (
            <button
              key={card.key}
              type="button"
              className={`flip__card${up ? " is-up" : ""}${done ? " is-done" : ""}`}
              onClick={() => flip(index)}
              aria-label={up ? `Card ${index + 1}: ${card.face.name}${done ? ", matched" : ""}` : `Card ${index + 1}, face down`}
              aria-disabled={done || undefined}
            >
              <span className="flip__inner">
                <img className="flip__back" src={BACK} alt="" width={300} height={438} draggable={false} />
                <span className="flip__face"><img src={card.face.src} alt="" width={260} height={296} draggable={false} /></span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="visually-hidden" aria-live="polite">{said}</p>
      <div className="toss__foot">
        <button type="button" className="btn" onClick={again}>Shuffle</button>
        <span className="hand flip__help" aria-hidden="true">{flips ? (cleared ? "" : "find the pairs") : "flip a card ↑"}</span>
      </div>
      <div className={`toss__cta note note--blue${cleared ? " is-on" : ""}`} aria-hidden={!cleared}>
        <p className="hand">Three pairs, no pressure.</p>
        <p>The real dungeon is a roguelite: you memorize each floor before it turns over, then find the pairs with three hearts, chain reactions and items in play. Same card art.</p>
        <button type="button" className="btn btn--primary" tabIndex={cleared ? 0 : -1} onClick={() => requestPlay("memory-dungeon")}>Play the real Memory Dungeon here</button>
      </div>
    </div>
  );
}

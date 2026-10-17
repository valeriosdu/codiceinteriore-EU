import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import InsightCard from "@/components/InsightCard";

// Il body degli insight arriva dal modello come 2-3 frasi di fila, nella lingua
// della sessione. La card stacca la prima frase come gancio e lascia il resto
// come approfondimento: un taglio sbagliato spezzerebbe una frase a meta' o,
// peggio, lascerebbe il muro di testo di prima.

const paragrafi = (container: HTMLElement) =>
  Array.from(container.querySelectorAll("p")).map((p) => p.textContent);

describe("InsightCard, frase di apertura", () => {
  it("in inglese stacca la prima frase dal resto", () => {
    const { container } = render(
      <InsightCard title="Guarded heart" body="You guard your space. Closeness feels risky. Trust builds slowly." />,
    );
    expect(paragrafi(container)).toEqual([
      "You guard your space.",
      "Closeness feels risky. Trust builds slowly.",
    ]);
  });

  it("in spagnolo taglia dopo il punto interrogativo di chiusura", () => {
    const { container } = render(
      <InsightCard title="Distancia" body="¿Por qué te retiras cuando alguien se acerca? Porque necesitas espacio. Lo notas en tus relaciones." />,
    );
    expect(paragrafi(container)).toEqual([
      "¿Por qué te retiras cuando alguien se acerca?",
      "Porque necesitas espacio. Lo notas en tus relaciones.",
    ]);
  });

  it("in spagnolo taglia dopo il punto esclamativo di chiusura", () => {
    const { container } = render(
      <InsightCard title="Cuidado" body="¡Cuidado con tu ritmo! Das más de lo que recibes. Conviene frenar." />,
    );
    expect(paragrafi(container)).toEqual([
      "¡Cuidado con tu ritmo!",
      "Das más de lo que recibes. Conviene frenar.",
    ]);
  });

  it("in olandese taglia dopo il punto", () => {
    const { container } = render(
      <InsightCard title="Afstand" body="Je houdt graag afstand. Nabijheid voelt riskant. Vertrouwen groeit langzaam." />,
    );
    expect(paragrafi(container)).toEqual([
      "Je houdt graag afstand.",
      "Nabijheid voelt riskant. Vertrouwen groeit langzaam.",
    ]);
  });

  it("tiene la virgoletta curva di chiusura dentro la prima frase", () => {
    const { container } = render(
      <InsightCard title="Quote" body="You tell yourself “I can handle it alone.” Next sentence follows here." />,
    );
    expect(paragrafi(container)).toEqual([
      "You tell yourself “I can handle it alone.”",
      "Next sentence follows here.",
    ]);
  });

  it("tiene le caporali di chiusura dentro la prima frase", () => {
    const { container } = render(
      <InsightCard title="Citazione" body="Ti ripeti «posso farcela da sola.» Poi arriva il resto." />,
    );
    expect(paragrafi(container)).toEqual([
      "Ti ripeti «posso farcela da sola.»",
      "Poi arriva il resto.",
    ]);
  });

  it("con una sola frase rende un solo paragrafo", () => {
    const { container } = render(<InsightCard title="Breve" body="Una sola frase, senza seguito." />);
    expect(paragrafi(container)).toEqual(["Una sola frase, senza seguito."]);
  });
});

describe("InsightCard, numero di capitolo", () => {
  const numero = (index: number) => {
    const { container } = render(<InsightCard title="T" body="Frase uno. Frase due." index={index} />);
    return container.querySelector('span[aria-hidden="true"]')?.textContent;
  };

  it("numera le tre card in romano", () => {
    expect([0, 1, 2].map(numero)).toEqual(["I.", "II.", "III."]);
  });

  it("oltre la tabella romana ripiega sulla cifra araba", () => {
    expect(numero(8)).toBe("9.");
  });
});

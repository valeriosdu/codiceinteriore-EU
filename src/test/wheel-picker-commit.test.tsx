import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import WheelPicker, { type WheelItem } from "@/components/WheelPicker";

// La ruota si apre centrata su un'ancora che nessuno ha scelto. In un browser
// vero il posizionamento iniziale scrive el.scrollTop, e scrivere scrollTop
// emette un evento 'scroll': la ruota finiva cosi' per confermare da sola la
// propria ancora ~120ms dopo il mount, e chi non toccava niente mandava avanti
// 15/06/1980 12:00 ricevendo la lettura di un'altra persona.
//
// jsdom non simula lo scroll, quindi l'evento lo emettiamo noi: e' esattamente
// quello che fa il browser dopo una scrittura di scrollTop.

const ITEM_HEIGHT = 40;
const ANCHOR = 15;
const ITEMS: WheelItem[] = Array.from({ length: 31 }, (_, i) => ({
  value: i + 1,
  label: String(i + 1),
}));

beforeAll(() => {
  // jsdom non implementa Element.prototype.scrollTo, usata dal tap su riga.
  Element.prototype.scrollTo = vi.fn();
});

const setup = (value: number | null = null) => {
  const onChange = vi.fn();
  const { container } = render(
    <WheelPicker items={ITEMS} value={value} anchor={ANCHOR} onChange={onChange} itemHeight={ITEM_HEIGHT} />,
  );
  const viewport = container.querySelector('[role="listbox"]')!.firstElementChild as HTMLElement;
  const rows = () => [...container.querySelectorAll('[role="option"]')] as HTMLElement[];
  return { onChange, viewport, rows };
};

const scrollToIndex = (viewport: HTMLElement, index: number) => {
  viewport.scrollTop = index * ITEM_HEIGHT;
  fireEvent.scroll(viewport);
};

const settle = () => new Promise((r) => setTimeout(r, 200));

describe("WheelPicker: conferma solo dopo un gesto", () => {
  it("non conferma l'ancora per lo scroll del posizionamento iniziale", async () => {
    const { onChange, viewport } = setup(null);

    scrollToIndex(viewport, ITEMS.findIndex((it) => it.value === ANCHOR));
    await settle();

    expect(onChange).not.toHaveBeenCalled();
  });

  it("conferma dopo uno swipe vero", async () => {
    const { onChange, viewport } = setup(null);

    fireEvent.pointerDown(viewport);
    scrollToIndex(viewport, 9);
    await settle();

    expect(onChange).toHaveBeenCalledWith(10);
  });

  it("conferma anche col tocco su una riga", () => {
    const { onChange, rows } = setup(null);

    fireEvent.click(rows()[9]);

    expect(onChange).toHaveBeenCalledWith(10);
  });

  it("continua a confermare gli scroll successivi al primo gesto", async () => {
    const { onChange, viewport } = setup(null);

    fireEvent.pointerDown(viewport);
    scrollToIndex(viewport, 9);
    await settle();
    scrollToIndex(viewport, 20);
    await settle();

    expect(onChange).toHaveBeenLastCalledWith(21);
  });

  it("finche' il valore e' null nessuna riga e' marcata come scelta", () => {
    const { rows } = setup(null);

    const scelte = rows().filter((r) => r.className.includes("text-foreground"));

    expect(scelte).toHaveLength(0);
  });

  it("marca come scelta solo la riga del valore confermato", () => {
    const { rows } = setup(10);

    const scelte = rows().filter((r) => r.className.includes("text-foreground"));

    expect(scelte.map((r) => r.textContent)).toEqual(["10"]);
  });
});

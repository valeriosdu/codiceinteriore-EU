// Brand fonts fetched from Google Fonts CDN at runtime.
// Network I/O does NOT count against the Supabase Edge Function
// 2-second CPU time limit, so this avoids the boot/parse spike
// that embedding ~940KB of base64 font data would cause.
//
// Fonts: Playfair Display (headings), Source Sans 3 (body).
// License: SIL Open Font License 1.1

const URLS: Record<string, string> = {
  playfairItalic:
    "https://fonts.gstatic.com/s/playfairdisplay/v40/nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_qiTbtY.ttf",
  playfairSemiBold:
    "https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKebukDQ.ttf",
  sourceSansRegular:
    "https://fonts.gstatic.com/s/sourcesans3/v19/nwpBtKy2OAdR1K-IwhWudF-R9QMylBJAV3Bo8Ky461EN.ttf",
  sourceSansSemiBold:
    "https://fonts.gstatic.com/s/sourcesans3/v19/nwpBtKy2OAdR1K-IwhWudF-R9QMylBJAV3Bo8Kxm7FEN.ttf",
};

const cache = new Map<string, Uint8Array>();

async function load(key: string): Promise<Uint8Array> {
  let bytes = cache.get(key);
  if (!bytes) {
    const resp = await fetch(URLS[key]);
    bytes = new Uint8Array(await resp.arrayBuffer());
    cache.set(key, bytes);
  }
  return bytes;
}

export const playfairItalic = () => load("playfairItalic");
export const playfairSemiBold = () => load("playfairSemiBold");
export const sourceSansRegular = () => load("sourceSansRegular");
export const sourceSansSemiBold = () => load("sourceSansSemiBold");

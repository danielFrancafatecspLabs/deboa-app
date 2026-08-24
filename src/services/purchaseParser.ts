import { CATEGORIES } from "@/data/seed";

/**
 * Turns whatever a share sheet hands over into something the decision engine
 * can read.
 *
 * A browser cannot watch you shop — no page may observe another site, which is
 * the whole point of the sandbox. So the moment of purchase has to be handed to
 * us: the person taps Share on the product and picks DeBoa. What arrives is
 * only what the sharing app chose to send, which in practice is the page title,
 * sometimes a snippet of text, and the URL.
 *
 * That is thin, and this parser is deliberately conservative with it: a wrong
 * price would make the agent say something false about someone's money. When
 * the price is not certain, the caller asks for it instead of inventing one.
 */

export type SharedPurchase = {
  /** Best guess at the product name. Never empty — falls back to the host. */
  name: string;
  /** Reais, cents included. Null when nothing in the share was clearly a price. */
  price: number | null;
  category: (typeof CATEGORIES)[number];
  /** Friendly store name, when the URL gives one away. */
  merchant: string | null;
  url: string | null;
};

export type ShareInput = {
  title?: string | undefined;
  text?: string | undefined;
  url?: string | undefined;
};

/* ------------------------------- Merchants -------------------------------- */

/** Hosts worth naming, and the noise their titles append. */
const STORES: { match: RegExp; name: string }[] = [
  { match: /mercadolivre\.com|mercadolibre\./i, name: "Mercado Livre" },
  { match: /amazon\./i, name: "Amazon" },
  { match: /magazineluiza\.|magalu\./i, name: "Magazine Luiza" },
  { match: /americanas\./i, name: "Americanas" },
  { match: /shopee\./i, name: "Shopee" },
  { match: /aliexpress\./i, name: "AliExpress" },
  { match: /casasbahia\./i, name: "Casas Bahia" },
  { match: /pontofrio\./i, name: "Ponto" },
  { match: /netshoes\./i, name: "Netshoes" },
  { match: /centauro\./i, name: "Centauro" },
  { match: /nike\./i, name: "Nike" },
  { match: /adidas\./i, name: "Adidas" },
  { match: /kabum\./i, name: "KaBuM!" },
  { match: /submarino\./i, name: "Submarino" },
  { match: /shein\./i, name: "SHEIN" },
  { match: /renner\./i, name: "Renner" },
  { match: /riachuelo\./i, name: "Riachuelo" },
  { match: /fastshop\./i, name: "Fast Shop" },
  { match: /apple\.com/i, name: "Apple" },
  { match: /samsung\./i, name: "Samsung" },
  { match: /ifood\./i, name: "iFood" },
  { match: /booking\.|decolar\.|latam\.|gol\.|azul\./i, name: "Viagem" },
  { match: /steampowered\.|epicgames\./i, name: "Games" },
];

function hostOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function merchantOf(url: string | undefined): string | null {
  const host = hostOf(url);
  if (!host) return null;
  const known = STORES.find((s) => s.match.test(host));
  return known ? known.name : host;
}

/* --------------------------------- Price ---------------------------------- */

/**
 * Only counts as a price when it is marked as money. A bare number in a title
 * is far more often a model, a size or a capacity — "Galaxy S24 256GB" has no
 * price in it, and reading 256 as R$ 256 would be worse than asking.
 */
const PRICE_PATTERNS = [
  // R$ 1.899,00 · R$ 1899,00 · R$1.899
  /R\$\s*([\d.]{1,12}(?:,\d{2})?)/gi,
  // "por 1.899,00" · "por apenas 199,90"
  /\bpor\s+(?:apenas\s+)?([\d.]{1,12},\d{2})\b/gi,
];

function toNumber(raw: string): number | null {
  // pt-BR: dot groups thousands, comma is the decimal separator.
  const normalised = raw.replace(/\./g, "").replace(",", ".");
  const value = Number(normalised);
  if (!Number.isFinite(value) || value <= 0) return null;
  // Cents are kept: showing R$ 300 for a R$ 299,90 tag is a small lie, and the
  // person is about to check it against the store.
  return Math.round(value * 100) / 100;
}

export function extractPrice(haystack: string): number | null {
  const found: number[] = [];
  for (const pattern of PRICE_PATTERNS) {
    // Patterns carry /g, so reset before reuse across calls.
    pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(haystack)) !== null) {
      const value = m[1] ? toNumber(m[1]) : null;
      if (value !== null) found.push(value);
    }
  }
  if (found.length === 0) return null;

  // Listings quote the instalment beside the total ("12x de R$ 158,25").
  // The largest figure is the one the person is actually about to spend.
  return Math.max(...found);
}

/* ---------------------------------- Name ---------------------------------- */

/** Store names get appended to page titles; none of it is the product. */
const TITLE_NOISE = [
  /\s*[|–—-]\s*(mercado ?li(v|b)re.*)$/i,
  /\s*[|–—-]\s*(amazon.*)$/i,
  /\s*[|–—-]\s*(magazine luiza|magalu).*$/i,
  /\s*[|–—-]\s*(americanas|submarino|shoptime).*$/i,
  /\s*[|–—-]\s*shopee.*$/i,
  /\s*[|–—-]\s*(casas bahia|ponto ?frio|ponto).*$/i,
  /\s*[|–—-]\s*(netshoes|centauro|kabum!?).*$/i,
  /\s*[|–—-]\s*(shein|renner|riachuelo|fast shop).*$/i,
  /\s*[|–—-]\s*(aliexpress).*$/i,
  /^\s*comprar\s+/i,
  /\s*[|–—-]\s*(compre online|frete grátis|melhor preço).*$/i,
];

function cleanName(raw: string): string {
  let name = raw.trim();
  for (const noise of TITLE_NOISE) name = name.replace(noise, "").trim();
  // Titles often repeat the price; the amount has its own field.
  name = name.replace(/R\$\s*[\d.,]+/gi, "").trim();
  name = name.replace(/\s{2,}/g, " ").replace(/[\s|·,–—-]+$/, "").trim();
  // A whole paragraph is not a name. Cut at the first sentence-ish break.
  if (name.length > 70) {
    const cut = name.slice(0, 70);
    const lastSpace = cut.lastIndexOf(" ");
    name = (lastSpace > 30 ? cut.slice(0, lastSpace) : cut) + "…";
  }
  return name;
}

/* -------------------------------- Category -------------------------------- */

const CATEGORY_HINTS: { category: (typeof CATEGORIES)[number]; words: RegExp }[] = [
  {
    category: "Tecnologia",
    words:
      /\b(celular|smartphone|iphone|galaxy|xiaomi|motorola|notebook|laptop|macbook|tablet|ipad|monitor|teclado|mouse|fone|headset|airpods|console|playstation|ps5|xbox|nintendo|placa de v[ií]deo|ssd|processador|smartwatch|kindle|c[âa]mera|drone|roteador|tv\b|smart tv)/i,
  },
  {
    category: "Moda",
    words:
      /\b(t[êe]nis|sapato|sand[áa]lia|chinelo|camisa|camiseta|blusa|cal[çc]a|jaqueta|casaco|vestido|shorts|bermuda|bolsa|mochila|[óo]culos|rel[óo]gio|perfume|moletom|regata|meia|cueca|sutiã|biqu[íi]ni)/i,
  },
  {
    category: "Alimentação",
    words: /\b(ifood|restaurante|delivery|lanche|pizza|hamb[úu]rguer|mercado|superm|caf[ée]|cerveja|vinho|whey|suplemento)/i,
  },
  {
    category: "Viagem",
    words: /\b(passagem|voo|hotel|pousada|hosp?edagem|airbnb|pacote|resort|di[áa]ria|booking|decolar|latam|gol\b|azul\b|mala\b)/i,
  },
  {
    category: "Entretenimento",
    // Trailing boundaries where a longer word means something else entirely:
    // "gamer" is a chair or a mouse, not a game; "showroom" is not a show.
    words:
      /\b(ingressos?\b|shows?\b|cinema|jogos?\b|games?\b|steam|assinatura|streaming|netflix|spotify|livros?\b|hbo|disney)/i,
  },
  {
    category: "Casa",
    words:
      /\b(sof[áa]|cadeira|mesa|cama|colch[ãa]o|arm[áa]rio|geladeira|fog[ãa]o|micro-?ondas|m[áa]quina de lavar|aspirador|panela|air ?fryer|liquidificador|cortina|tapete|luminária|guarda-?roupa)/i,
  },
];

export function guessCategory(haystack: string): (typeof CATEGORIES)[number] {
  for (const { category, words } of CATEGORY_HINTS) {
    if (words.test(haystack)) return category;
  }
  return "Outro";
}

/* --------------------------------- Parse ---------------------------------- */

export function parseSharedPurchase(input: ShareInput): SharedPurchase {
  const title = (input.title ?? "").trim();
  const text = (input.text ?? "").trim();

  // Android often puts the URL in `text` rather than `url`; take whichever
  // actually looks like a link.
  const urlFromText = text.match(/https?:\/\/\S+/)?.[0];
  const url = (input.url ?? "").trim() || urlFromText || null;

  // The URL itself is not prose — keep it out of name and price matching.
  const textWithoutUrl = text.replace(/https?:\/\/\S+/g, " ").trim();
  const haystack = [title, textWithoutUrl].filter(Boolean).join(" · ");

  const merchant = merchantOf(url ?? undefined);
  const price = extractPrice(haystack);

  let name = cleanName(title || textWithoutUrl);
  if (!name) {
    // Nothing usable was shared: name it after where it came from, so the
    // screen still says something true rather than "undefined".
    name = merchant ? `Compra em ${merchant}` : "Esta compra";
  }

  return {
    name,
    price,
    category: guessCategory(`${haystack} ${url ?? ""}`),
    merchant,
    url,
  };
}

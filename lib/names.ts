// The name to greet someone by: the first word of their full name,
// skipping titles such as "Dr." or "Puan", so "Dr. Siti Aminah" becomes "Siti".
const TITLES = new Set([
  "dr", "prof", "mr", "mrs", "ms", "miss", "sir", "ir", "ts",
  "encik", "en", "cik", "puan", "pn", "tuan", "tn",
  "datuk", "dato", "datin", "haji", "hajah", "hj", "hjh",
]);

export function firstName(fullName: string | null | undefined): string {
  const words = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  // drop titles from the front, but always keep at least one word
  const plain = (w: string) => w.toLowerCase().replace(/[.'’,]/g, "");
  for (;;) {
    if (words.length > 2 && plain(words[0]) === "tan" && ["sri", "seri"].includes(plain(words[1]))) { words.splice(0, 2); continue; } // "Tan Sri", but not the surname Tan
    if (words.length > 1 && TITLES.has(plain(words[0]))) {
      words.shift();
      if (words.length > 1 && ["sri", "seri"].includes(plain(words[0]))) words.shift(); // "Datuk Seri", "Puan Sri"
      continue;
    }
    break;
  }
  return words[0] ?? "";
}

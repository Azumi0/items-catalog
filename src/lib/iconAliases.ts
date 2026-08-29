/**
 * Polish search terms for an English icon library.
 *
 * Tabler names every icon in English; the catalog is used by a household that
 * types Polish. Without this table the search box's own placeholder — „np.
 * lampa, dom, rower" — returns nothing for all three words.
 *
 * The table maps a Polish word to the English phrases that appear in Tabler
 * labels, and the search expands the query rather than indexing every icon:
 * one lookup per keystroke instead of 6250. Values are matched against a
 * folded label, so they are written lowercase and spaced exactly as the label
 * spells them ("device laptop", not "laptop").
 *
 * Every phrase here was checked against the installed library's label list —
 * an alias that matches nothing is worse than no alias, because it makes the
 * search look broken rather than empty.
 */
export const ICON_ALIASES: Record<string, readonly string[]> = {
  // Dom i pomieszczenia
  dom: ['home', 'building'],
  mieszkanie: ['home', 'building'],
  pokoj: ['bed', 'sofa'],
  salon: ['sofa', 'device tv'],
  sypialnia: ['bed'],
  kuchnia: ['tools kitchen', 'cooker'],
  lazienka: ['bath', 'wash'],
  toaleta: ['toilet'],
  garaz: ['car', 'parking'],
  piwnica: ['stairs', 'box'],
  strych: ['box', 'home'],
  ogrod: ['garden', 'plant'],
  balkon: ['plant', 'window'],
  schody: ['stairs'],
  drzwi: ['door'],
  okno: ['window'],
  sciana: ['wall'],
  klucz: ['key'],
  klucze: ['key'],

  // Meble
  meble: ['armchair', 'sofa', 'bed', 'desk'],
  mebel: ['armchair', 'sofa', 'bed'],
  fotel: ['armchair'],
  kanapa: ['sofa'],
  sofa: ['sofa'],
  krzeslo: ['chair', 'armchair'],
  stol: ['table', 'desk'],
  biurko: ['desk'],
  lozko: ['bed'],
  szafa: ['hanger', 'box'],
  polka: ['box', 'books'],

  // Elektronika
  laptop: ['device laptop', 'device desktop'],
  komputer: ['device desktop', 'device laptop'],
  telefon: ['device mobile', 'phone'],
  telewizor: ['device tv'],
  tablet: ['device tablet'],
  aparat: ['camera'],
  kamera: ['camera', 'video'],
  glosnik: ['device speaker', 'speakerphone'],
  sluchawki: ['headphones'],
  drukarka: ['printer'],
  router: ['router', 'wifi'],
  internet: ['wifi', 'world'],
  serwer: ['server', 'database'],
  konsola: ['device gamepad'],
  gry: ['device gamepad', 'dice', 'puzzle'],
  bateria: ['battery'],
  kabel: ['plug', 'usb'],
  prad: ['bolt', 'plug'],
  elektryka: ['bolt', 'plug'],
  zegarek: ['device watch', 'clock'],

  // AGD
  pralka: ['wash'],
  lodowka: ['fridge'],
  kuchenka: ['cooker', 'grill'],
  piekarnik: ['cooker', 'grill'],
  mikrofalowka: ['microwave'],
  zmywarka: ['wash', 'dish'],
  odkurzacz: ['vacuum'],
  czajnik: ['teapot'],

  // Narzędzia i majsterkowanie
  narzedzia: ['tool'],
  narzedzie: ['tool'],
  mlotek: ['hammer'],
  wiertarka: ['drill'],
  srubokret: ['tool'],
  pila: ['saw'],
  farba: ['paint', 'brush'],
  pedzel: ['brush', 'paint'],
  gwozdz: ['hammer', 'tool'],
  nakretka: ['nut'],
  drewno: ['wood'],
  rura: ['pipe'],
  miarka: ['ruler'],
  nozyczki: ['scissors'],
  igla: ['needle'],
  nici: ['yarn', 'needle'],

  // Kuchnia i jedzenie
  garnek: ['cooker', 'soup'],
  patelnia: ['cooker'],
  widelec: ['tools kitchen', 'fork'],
  lyzka: ['spoon'],
  talerz: ['tools kitchen'],
  szklanka: ['glass', 'cup'],
  kubek: ['mug', 'cup'],
  butelka: ['bottle'],
  kawa: ['coffee', 'cup'],
  herbata: ['teapot', 'mug'],
  piwo: ['beer'],
  wino: ['glass'],
  jedzenie: ['meat', 'apple', 'soup'],
  owoce: ['apple', 'carrot'],
  warzywa: ['carrot', 'apple'],
  chleb: ['bread'],
  ser: ['cheese'],
  jajko: ['egg'],
  mieso: ['meat'],
  pizza: ['pizza'],
  grill: ['grill', 'flame'],

  // Zdrowie i chemia
  leki: ['pill', 'vaccine'],
  lek: ['pill'],
  apteczka: ['first aid'],
  chemia: ['spray', 'bottle'],
  sprzatanie: ['wash', 'spray', 'trash'],
  smieci: ['trash'],

  // Ubrania
  ubrania: ['shirt', 'hanger'],
  koszula: ['shirt'],
  buty: ['shoe'],
  kurtka: ['jacket', 'hanger'],
  torba: ['shopping bag', 'briefcase'],
  plecak: ['backpack'],
  walizka: ['luggage', 'briefcase'],
  parasol: ['umbrella'],
  okulary: ['eyeglass'],

  // Transport
  rower: ['bike'],
  auto: ['car'],
  samochod: ['car'],
  motocykl: ['motorbike'],
  hulajnoga: ['scooter'],
  motor: ['motorbike', 'engine'],
  kolo: ['wheel'],
  opona: ['wheel'],
  paliwo: ['gas'],
  ladowarka: ['charging', 'plug'],
  lodka: ['ship', 'sailboat'],
  samolot: ['plane'],
  pociag: ['train'],

  // Sport i wypoczynek
  sport: ['ball', 'barbell', 'run'],
  pilka: ['ball'],
  silownia: ['barbell', 'dumbbell'],
  narty: ['ski'],
  namiot: ['tent'],
  bieganie: ['run'],
  plywanie: ['swim'],
  tenis: ['tennis'],
  golf: ['golf'],
  kask: ['helmet'],
  wedka: ['fish'],

  // Hobby i dom kultury
  ksiazka: ['book'],
  ksiazki: ['books', 'book'],
  muzyka: ['music'],
  gitara: ['guitar'],
  zdjecia: ['photo', 'camera'],
  zdjecie: ['photo'],
  zabawki: ['toy', 'puzzle'],
  zabawka: ['toy'],
  puzzle: ['puzzle'],
  szachy: ['chess'],
  karty: ['cards'],
  kostka: ['dice'],
  prezent: ['gift'],
  swieca: ['candle', 'flame'],

  // Dokumenty i biuro
  dokumenty: ['file', 'folder'],
  dokument: ['file'],
  papiery: ['file', 'folder'],
  teczka: ['folder', 'briefcase'],
  rachunek: ['receipt'],
  faktura: ['receipt', 'file invoice'],
  paragon: ['receipt'],
  gwarancja: ['certificate'],
  umowa: ['certificate', 'file'],
  paszport: ['passport'],
  bilet: ['ticket'],
  pieniadze: ['coin', 'cash'],
  portfel: ['wallet'],
  poczta: ['mail'],
  biuro: ['briefcase', 'desk'],
  praca: ['briefcase'],
  szkola: ['school', 'book'],
  olowek: ['pencil'],
  kalendarz: ['calendar'],
  zegar: ['clock'],
  mapa: ['map'],
  dzwonek: ['bell'],
  pudelko: ['box', 'package'],
  karton: ['box', 'package'],
  magazyn: ['building warehouse', 'box'],
  kosz: ['basket', 'trash'],
  zakupy: ['shopping cart', 'shopping bag'],
  wozek: ['cart'],

  // Zwierzęta i rośliny
  zwierzeta: ['paw', 'dog', 'cat'],
  pies: ['dog', 'paw'],
  kot: ['cat', 'paw'],
  ryby: ['fish'],
  ryba: ['fish'],
  ptak: ['feather'],
  roslina: ['plant'],
  rosliny: ['plant'],
  kwiaty: ['flower'],
  dziecko: ['baby carriage', 'mood kid'],

  // Żywioły
  woda: ['droplet'],
  ogien: ['flame'],
  swiatlo: ['bulb', 'lamp'],
  lampa: ['lamp', 'bulb'],
  zarowka: ['bulb'],
  ogrzewanie: ['temperature', 'flame'],
  slonce: ['sun', 'solar'],
};

/**
 * Strips what a Polish typist may or may not bother with: case, and the tails
 * on ąćęłńóśżź. NFD splits the accented letters into base + combining mark,
 * which the range below removes — except ł, which is its own letter in Unicode
 * and has to be spelled out.
 */
export function foldPolish(value: string): string {
  return value
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Below this, a prefix match pulls in half the dictionary. */
const MIN_ALIAS_QUERY = 2;

/**
 * As much of a dictionary word as survives being declined.
 *
 * The table is written in the nominative singular, and Polish does not leave
 * words in it: rower/rowery, lampa/lampy, młotek/młotki, książka/książki. A
 * plain prefix test only catches a query *shorter* than the key, so it handles
 * someone halfway through typing and nothing else — every plural missed.
 *
 * Two characters is what the endings above cost, and four is the floor that
 * keeps short keys (kosz, kot, dom) from matching half the language.
 */
function stemOf(word: string): string {
  return word.slice(0, Math.min(word.length, Math.max(4, word.length - 2)));
}

/**
 * The query as typed, plus every English phrase its Polish reading implies.
 *
 * Matching runs both ways: the key against a query still being typed („row"
 * already finds the bike), and the key's stem against a longer, declined one
 * („rowery" finds it too). The raw query stays in the list, so an English
 * query keeps working exactly as before.
 */
export function expandQuery(query: string): string[] {
  const folded = foldPolish(query.trim());
  if (!folded) return [];

  const terms = new Set([folded]);
  if (folded.length >= MIN_ALIAS_QUERY) {
    for (const [polish, english] of Object.entries(ICON_ALIASES)) {
      if (polish.startsWith(folded) || folded.startsWith(stemOf(polish))) {
        for (const phrase of english) terms.add(phrase);
      }
    }
  }

  return [...terms];
}

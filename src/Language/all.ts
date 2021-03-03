// Import all languages
import en from "./en.json";

// Specify default language
const defLang = en;

// Export all languages
export type language = typeof defLang;
export type allLangs = {[key: string]: typeof defLang};
type LANG = {
    get: (id: string) => language;
    default: language;
};
const allLangs: allLangs = {
    en,
};
export const LANG: LANG = {
    default: defLang,
    get: (id: string) => (typeof allLangs[id] != "undefined" ? allLangs[id] : defLang),
};

// Export overview list of languages
type LANGLIST = ({
    key: string;
} & typeof defLang.fileInfo)[];
export const LANGLIST: LANGLIST = [];
for (const key in allLangs) {
    LANGLIST.push({
        key,
        ...allLangs[key].fileInfo,
    });
}

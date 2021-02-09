// Import all languages
import en from "./en.json";

// Specify default language
const defLang = en;

// Export all languages
export type language = typeof defLang;
type LANG = {
    [key: string]: typeof defLang;
    default: typeof defLang;
};
export const LANG: LANG = {
    default: defLang,
    en,
};

// Export overview list of languages
type LANGLIST = ({
    key: string;
} & typeof defLang.fileInfo)[];
export const LANGLIST: LANGLIST = [];
for (const key in LANG) {
    LANGLIST.push({
        ...{
            key,
        },
        ...LANG[key].fileInfo,
    });
}

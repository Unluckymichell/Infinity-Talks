export function highestOccurrence<t>(arr: t[]): t | undefined {
    var list: {count: number; element: t}[] = [];
    for (const el of arr) {
        if (el != null) {
            const e = list.find(e => e.element == el);
            if (e) e.count++;
            else list.push({count: 1, element: el});
        }
    }
    list;
    var test = list.sort((a, b) => b.count - a.count).shift();
    return test?.element;
}

export function deepForEach(
    obj: any,
    func: (e: boolean | bigint | number | string | symbol) => void
) {
    for (var i in obj) {
        if (typeof obj[i] == "object") {
            deepForEach(obj[i], func);
        } else if (typeof obj[i] != "undefined" || typeof obj[i] != "function") {
            func(obj);
        }
    }
}

export function deepMap(
    obj: any,
    func: (e: boolean | bigint | number | string | symbol) => typeof e
) {
    for (var i in obj) {
        if (typeof obj[i] == "object") {
            deepForEach(obj[i], func);
        } else if (typeof obj[i] != "undefined" || typeof obj[i] != "function") {
            obj[i] = func(obj[i]);
        }
    }
}

export function getFileTypes(file: string): string[] {
    let r = file.split(".").reverse();
    r.pop();
    return r.length > 0 ? r : [""];
}

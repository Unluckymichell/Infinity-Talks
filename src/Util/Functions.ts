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

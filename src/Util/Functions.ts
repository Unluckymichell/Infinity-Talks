export function highestOccurrence<t>(arr: t[]): t | undefined {
    var list: {count: number; element: t}[] = [];
    for (const el of arr) {
        const e = list.find(e => e.element == el);
        if (e) e.count++;
        else if (el != null) list.push({count: 1, element: el});
    }
    var test = list.sort((a, b) => a.count - b.count).shift();
    return test?.element;
}

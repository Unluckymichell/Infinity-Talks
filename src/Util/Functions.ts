export function highestOccurrence<t>(arr: t[]): t | undefined {
    return arr
        .sort(
            (a: any, b: any) =>
                arr.filter((v: any) => v === a).length - arr.filter((v: any) => v === b).length
        )
        .pop();
}

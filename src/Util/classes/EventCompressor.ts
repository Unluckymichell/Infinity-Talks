export class EventCompressor {
    private queue: Event[] = [];
    /**
     * Compress events into one execution using await syntax
     * @param name Event name
     * @param ms Comp delay
     */
    waitcomp<T>(name: string, ms: number = 100, history?: T): Promise<false | {history: T[]}> {
        return new Promise(res => {
            var event = this.queue.find(e => e.name == name);
            if (event) {
                const e = event;
                clearTimeout(event.timeout);
                event.prefRes(false);
                event.prefRes = res;
                event.timeout = setTimeout(() => res({history: e.history}), ms);
                if (history) event.history.push(history);
            } else {
                const h = history;
                this.queue.push({
                    name,
                    prefRes: res,
                    timeout: setTimeout(() => res(h ? {history: [h]} : {history: []}), ms),
                    history: [history],
                });
            }
        });
    }
}

interface Event {
    name: string;
    prefRes: Function;
    timeout: NodeJS.Timeout;
    history: any[];
}

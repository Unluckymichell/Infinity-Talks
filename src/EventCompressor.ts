import {EventEmitter} from "events";

class Event {
    name: string | symbol;
    key: any;
    data: any[] = [];
    history: boolean;
    timeout: NodeJS.Timeout | null = null;
    active: boolean = false;

    constructor(name: string | symbol, key: any, data: any, history: boolean) {
        this.name = name;
        this.key = key;
        this.data.push(data);
        this.history = history;
    }

    delay(ms: number, compressor: EventCompressor) {
        if (this.timeout) clearTimeout(this.timeout);
        this.active = true;
        this.timeout = setTimeout(() => {
            this.active = false;
            compressor.emit(this.name, this.data);
            compressor.clean();
        }, ms);
        return this;
    }

    update(data: any) {
        this.history ? this.data.push(data) : (this.data[0] = data);
        return this;
    }
}

export class EventCompressor extends EventEmitter {
    queue: Event[];

    constructor() {
        super();
        this.queue = [];
    }

    async clean() {
        var i = 0;
        while (i < this.queue.length) {
            if (!this.queue[i].active) this.queue.splice(i, 1);
            else i++;
        }
    }

    compress(
        eventName: string | symbol,
        key: any,
        data: any,
        ms: number,
        history: boolean = false
    ) {
        var event = this.queue.find(e => e.name == eventName && e.key == key && e.active);
        if (!event) {
            event = new Event(eventName, key, data, history);
            this.queue.push(event);
            event.delay(ms, this);
        } else {
            event.delay(ms, this);
            event.update(data);
        }
        return this;
    }
}

const APILIMITS = {
    CHANNEL: {LIMIT: 2, TIME: 10 * 60 * 1000},
};

export class ApiLimitCache {
    private queue: DEvent[] = [];
    getLimit(type: "channel", id: string) {
        var event = this.queue.find(de => de.id == id && de.type == type);
        if (event) return event.limit;
        else
            switch (type) {
                case "channel":
                    return APILIMITS.CHANNEL.LIMIT;
            }
    }

    delete(channelID: string) {
        var event = this.queue.find(de => de.id == channelID && de.type == "channel");
        if (event) {
            clearTimeout(event.timeout);
            event = this.queue.splice(
                this.queue.findIndex(de => de.id == channelID),
                1
            )[0];
            return event.limit - 1;
        } else return APILIMITS.CHANNEL.LIMIT - 1;
    }

    edit(channelID: string) {
        var event = this.queue.find(de => de.id == channelID && de.type == "channel");
        if (event) {
            return --event.limit;
        } else {
            this.queue.push({
                id: channelID,
                type: "channel",
                limit: APILIMITS.CHANNEL.LIMIT - 1,
                timeout: setTimeout(() => {
                    this.queue.splice(
                        this.queue.findIndex(de => de.id == channelID),
                        1
                    );
                }, APILIMITS.CHANNEL.TIME),
            });
            return APILIMITS.CHANNEL.LIMIT - 1;
        }
    }
}

interface DEvent {
    type: "channel";
    timeout: NodeJS.Timeout;
    limit: number;
    id: string;
}

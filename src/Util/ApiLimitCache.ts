const APILIMITS = {
    CHANNEL: {LIMIT: 2, TIME: 10 * 60 * 1000},
};

export class ApiLimitCache {
    private queue: DEvent[] = [];
    edit(channelID: string) {
        var eventIndex = this.queue.findIndex(de => de.id == channelID);
        var event = this.queue[eventIndex];
        if (event) {
            return --event.limit;
        } else {
            this.queue.push({
                id: channelID,
                type: "edit",
                limit: APILIMITS.CHANNEL.LIMIT - 1,
                timeout: setTimeout(() => {
                    this.queue.splice(this.queue.findIndex(de => de.id == channelID));
                }, APILIMITS.CHANNEL.TIME),
            });
            return APILIMITS.CHANNEL.LIMIT - 1;
        }
    }
}

interface DEvent {
    type: "edit";
    timeout: NodeJS.Timeout;
    limit: number;
    id: string;
}

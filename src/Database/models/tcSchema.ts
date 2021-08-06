import {GuildModel} from "./GuildSchema";

const dcid = {type: String, required: true, minlength: 3, maxlength: 20};

// ------------------------------- Text Channel Shema ---------------------------------

const MOST_RECENT_SCHEMA_VERSION = 1;
/** # Shema Version History
 * - ## V1:
 *      - Added `_dcid: string` - Discord id of text channel
 *      - Added `allowCommands: boolean` - Enable commands for this channel (default true)
 *      - Added `autoDelete: string` - Set auto delete mode for this channel
 *      - Added `autoDeleteDelay: number` - Set auto delete delay in milliseconds
 */

export type tcSchema = {
    _dcid: string;
    allowCommands: boolean;
    autoDelete: string;
    autoDeleteDelay: number;
};
export const tcSchema = {
    _dcid: dcid,
    allowCommands: {type: Boolean, required: true, default: true},
    autoDelete: {type: String, required: true, enum: ["none", "commands", "all"], default: "none"},
    autoDeleteDelay: {type: Number, required: true, default: 3000},
};
/**
 * Fill out the defaults of text channel schema based db obj
 * @param base Base object to add defaults to (existing properties are not overwritten!)
 */
export function tcDefault(base: any): tcSchema {
    var obj: any = base;
    var tcS: any = tcSchema;
    for (const key in tcSchema) {
        if (typeof tcS[key].default != "undefined" && typeof obj[key] == "undefined") obj[key] = tcS[key].default;
    }
    return obj;
}

/**
 * Will return and save defaults if not present
 * @param gInfo Guild Info base object
 * @param categoryId Category id
 */
export async function getEnsureTcInfo(gInfo: GuildModel, channelId: string) {
    var tcInfo: tcSchema | null = gInfo.textChannels.find(c => c._dcid == channelId) || null; // Find channel information from guild information
    if (!tcInfo) {
        // Save default if not found
        tcInfo = tcDefault({_dcid: channelId});
        gInfo.textChannels.push(tcInfo);
        await gInfo.save();
    } else {
        /*tcInfo = upgradeDoc(tcInfo);*/
    }

    //if (gInfo.schemaVersion !== MOST_RECENT_SCHEMA_VERSION) throw new Error("Schema upgrade was not successfull!");
    /*else*/ return tcInfo;
}

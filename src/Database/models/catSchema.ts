import {Schema, SchemaDefinition} from "mongoose";
import {LANG} from "../../Language/all";
import {GuildModel} from "./GuildSchema";
const {Mixed} = Schema.Types;
const dcid = {type: String, required: true, minlength: 3, maxlength: 20};

// ------------------------------- Category Schema ------------------------------------

const MOST_RECENT_SCHEMA_VERSION = 2;
/** # Shema Version History
 * - ## V1:
 *      - Added `_dcid: string` - Discord id of category
 *      - Added `enableInfTalks: boolean` - Enable status of base functionality
 *      - Added `channelLimit: number` - // TODO: HERE!!!!
 *      - Added `channelUserLimit: number`
 *      - Added `allowLock: boolean`
 *      - Added `namingRule: string`
 * - ## V2:
 *      - Added `voiceTextChannels: boolean` - Enable adding a text channel to every voice (default: false)
 *      - Added `voiceTextAutoDelete: string` - Auto delete mode in voiceTextChannels (default: "none")
 *      - Added `voiceTextAutoDeleteDelay: string` - Auto delete dely in voiceTextChannels (default: 3000)
 *      - Added `namingRuleCompiled: Mixed` - JSON Plain obj style compiled version of html like naming rule
 *      - Added `schemaVersion` - To keep track of updates to this schema
 */

export type catSchema = {
    _dcid: string;
    enableInfTalks: boolean;
    voiceTextChannels: boolean;
    voiceTextAutoDelete: "none" | "commands" | "all";
    voiceTextAutoDeleteDelay: 3000;
    channelLimit: number;
    channelUserLimit: number;
    allowLock: boolean;
    namingRule: string;
    namingRuleCompiled: null | {[key: string]: any} | {[key: string]: any}[];
    schemaVersion?: 1 | 2;
};
export const catSchema: SchemaDefinition = {
    _dcid: dcid,
    enableInfTalks: {type: Boolean, required: true, default: false},
    voiceTextChannels: {type: Boolean, required: true, default: false},
    voiceTextAutoDelete: {type: String, required: true, default: "none", enum: ["none", "commands", "all"]},
    voiceTextAutoDeleteDelay: {type: Number, required: true, default: 3000}, //TODO: Check
    channelLimit: {type: Number, required: true, min: 0, default: 0},
    channelUserLimit: {type: Number, required: true, min: 0, max: 99, default: 0},
    allowLock: {type: Boolean, required: true, default: true},
    namingRule: {
        type: String,
        required: true,
        minlength: 0,
        maxlength: 500,
        default: LANG.default.general.default.talkNameRule,
    },
    namingRuleCompiled: {type: Mixed, required: true, default: null}, // TODO: Add compiled default
    schemaVersion: {type: Number, required: false, default: 2},
};
/**
 * Fill out the defaults of category schema based db obj
 * @param base Base object to add defaults to (existing properties are not overwritten!)
 */
export function catDefault(base: {[key: string]: any} = {}): catSchema {
    var obj: any = base;
    var cS: any = catSchema;
    for (const key in catSchema) {
        if (typeof cS[key].default != "undefined" && typeof obj[key] == "undefined") obj[key] = cS[key].default;
    }
    return obj;
}

/**
 * Will return and save defaults if not present
 * @param gInfo Guild Info base object
 * @param categoryId Category id
 */
export async function getEnsureCatInfo(gInfo: GuildModel, categoryId: string) {
    var catInfo: catSchema | null = gInfo.categorys.find(c => c._dcid == categoryId) || null; // Find category information from guild information
    if (!catInfo) {
        // Save default if not found
        catInfo = catDefault({_dcid: categoryId});
        gInfo.categorys.push(catInfo);
        await gInfo.save();
    } else {
        catInfo = upgradeDoc(catInfo);
    }

    if (gInfo.schemaVersion !== MOST_RECENT_SCHEMA_VERSION) throw new Error("Schema upgrade was not successfull!");
    else return catInfo;
}

function upgradeDoc(doc: catSchema) {
    if (typeof doc.schemaVersion != "number") doc.schemaVersion = 1;
    switch (doc.schemaVersion) {
        case 1:
            doc.voiceTextChannels = (catSchema.voiceTextChannels as any).default;
            doc.voiceTextAutoDelete = (catSchema.voiceTextAutoDelete as any).default;
            doc.voiceTextAutoDeleteDelay = (catSchema.voiceTextAutoDeleteDelay as any).default;
            doc.namingRuleCompiled = null; // TODO: Compile Naming Rule;
            doc.schemaVersion = 2;
    }
    return doc;
}

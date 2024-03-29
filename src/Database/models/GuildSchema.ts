import {model, Schema, Document, SchemaDefinition} from "mongoose";
import {LANG} from "../../Language/all";
import {LOGGER} from "../../Util/classes/Logger";
import {catSchema} from "./catSchema";
import {roleSchema} from "./roleSchema";
import {tcSchema} from "./tcSchema";
const dcid = {type: String, required: true, minlength: 3, maxlength: 20};

// ------------------------------- Guild Schema / Model -------------------------------

const MOST_RECENT_SCHEMA_VERSION = 2;
/** # Shema Version History
 * - ## V1:
 *      - Added `_dcid: string` - Discord id of guild
 *      - Added `prefix: string` - Prefix for commands
 *      - Added `language: string` - Server specific language
 *      - Added `textChannels: tcSchema[]` - Refer to ./tcSchema.ts
 *      - Added `categorys: catShema[]` - Refer to ./catSchema.ts
 * - ## V2:
 *      - Added `defaultPermissions: string[]` - Permissions of @everyone on guild
 *      - Added `roles: roleShema[]` - Refer to ./roleSchema.ts
 *      - Added `schemaVersion` - To keep track of updates to this schema
 */

export type GuildSchema = {
    _dcid: string;
    prefix: string;
    language: string;
    defaultPermissions: string[];
    roles: roleSchema[];
    textChannels: tcSchema[];
    categorys: catSchema[];
    schemaVersion?: 1 | 2;
};
export const GuildSchemaRaw: SchemaDefinition = {
    _dcid: dcid,
    prefix: {type: String, required: true, default: LANG.default.general.default.prefix},
    language: {type: String, required: true, default: LANG.default.fileInfo.langShort},
    defaultPermissions: [String],
    roles: [roleSchema],
    textChannels: [tcSchema],
    categorys: [catSchema],
    schemaVersion: {type: Number, required: false, default: 2},
};
export const GuildSchema = new Schema<GuildSchema>(GuildSchemaRaw);
export type GuildModel = GuildSchema & Document;
export const GuildModel = model<GuildModel>("Guild", GuildSchema);

export async function getEnsureGuildInfo(dcid: string) {
    var gInfo = await GuildModel.findOne({_dcid: dcid}); // Request guild information from db
    if (gInfo) {
        let preVersion = gInfo.schemaVersion;
        gInfo = upgradeDoc(gInfo);
        if (preVersion != gInfo.schemaVersion) await gInfo.save();
    } else gInfo = await new GuildModel({_dcid: dcid}).save(); // Save default if not found
    if (gInfo.schemaVersion !== MOST_RECENT_SCHEMA_VERSION) throw new Error("Schema upgrade was not successfull!");
    else return gInfo;
}

function upgradeDoc(doc: GuildModel) {
    if (typeof doc.schemaVersion != "number") doc.schemaVersion = 1;
    switch (doc.schemaVersion) {
        case 1:
            LOGGER.log(`Guild Schema Document Upgade to Version 2 (_dcid: ${doc._dcid})`);
            doc.defaultPermissions = [];
            doc.roles = [];
            doc.schemaVersion = 2;
    }
    return doc;
}

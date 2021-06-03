import {GuildModel} from "./GuildSchema";

const dcid = {type: String, required: true, minlength: 3, maxlength: 20};

// ------------------------------- Role Shema ---------------------------------

const MOST_RECENT_SCHEMA_VERSION = 1;
/** # Shema Version History
 * - ## V1:
 *      - Added `_dcid: string` - Discord id of role
 *      - Added `allow: string[]` - Permissions added by role
 *      - Added `allow: string[]` - Permissions removed by role
 *      - Added `schemaVersion` - To keep track of updates to this schema
 */

export type roleSchema = {
    _dcid: string;
    allow: string[];
    deny: string[];
};
export const roleSchema = {
    _dcid: dcid,
    allow: [String],
    deny: [String],
};
/**
 * Fill out the defaults of role schema based db obj
 * @param base Base object to add defaults to (existing properties are not overwritten!)
 */
export function roleDefault(base: any): roleSchema {
    var obj: any = base;
    var tcS: any = roleSchema;
    for (const key in roleSchema) {
        if (typeof tcS[key].default != "undefined" && typeof obj[key] == "undefined") obj[key] = tcS[key].default;
    }
    return obj;
}

/**
 * Will return and save defaults if not present
 * @param gInfo Guild Info base object
 * @param categoryId Category id
 */
export async function getEnsureRoleInfo(gInfo: GuildModel, roleId: string) {
    var roleInfo: roleSchema | null = gInfo.roles.find(c => c._dcid == roleId) || null; // Find channel information from guild information
    if (!roleInfo) {
        // Save default if not found
        roleInfo = roleDefault({_dcid: roleId});
        gInfo.roles.push(roleInfo);
        await gInfo.save();
    } else {
        /*tcInfo = upgradeDoc(tcInfo);*/
    }
    if (gInfo.schemaVersion !== MOST_RECENT_SCHEMA_VERSION) throw new Error("Schema upgrade was not successfull!");
    else return roleInfo;
}

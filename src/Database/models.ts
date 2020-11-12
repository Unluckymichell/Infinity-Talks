import {model, Schema, Types, Document} from "mongoose";
import {LANG} from "../Language/all";
const dcid = {type: String, required: true, minlength: 3, maxlength: 20};

// ------------------------------- Category Schema ------------------------------------
export type catSchema = {
    _dcid: string;
    enableInfTalks: boolean;
    channelLimit: number;
    channelUserLimit: number;
    allowLock: boolean;
    namingRule: string;
};
export const catSchema = {
    _dcid: dcid,
    enableInfTalks: {type: Boolean, required: true, default: false},
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
};
export function catDefault(base: any): catSchema {
    var obj: any = base;
    var cS: any = catSchema;
    for (const key in catSchema) {
        if (typeof cS[key].default != "undefined" && typeof obj[key] == "undefined")
            obj[key] = cS[key].default;
    }
    return obj;
}

// ------------------------------- Text Channel Shema ---------------------------------
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
export function tcDefault(base: any): tcSchema {
    var obj: any = base;
    var tcS: any = tcSchema;
    for (const key in tcSchema) {
        if (typeof tcS[key].default != "undefined" && typeof obj[key] == "undefined")
            obj[key] = tcS[key].default;
    }
    return obj;
}

// ------------------------------- Guild Schema / Model -------------------------------
export type GuildSchema = {
    _dcid: string;
    prefix: string;
    language: string;
    textChannels: any[];
    categorys: any[];
};
export const GuildSchemaRaw = {
    _dcid: dcid,
    prefix: {type: String, required: true, default: LANG.default.general.default.prefix},
    language: {type: String, required: true, default: LANG.default.fileInfo.langShort},
    textChannels: [tcSchema],
    categorys: [catSchema],
};
export const GuildSchema = new Schema<GuildSchema>(GuildSchemaRaw);
export type GuildModel = GuildSchema & Document;
export const GuildModel = model<GuildModel>("Guild", GuildSchema);

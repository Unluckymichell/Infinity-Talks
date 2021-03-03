import {model, Schema, Document} from "mongoose";
import {LANG} from "../../Language/all";
import {catSchema} from "./catSchema";
import {tcSchema} from "./tcSchema";
const dcid = {type: String, required: true, minlength: 3, maxlength: 20};

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

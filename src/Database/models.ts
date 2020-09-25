import {model, Schema, Types, Document} from "mongoose";
import {LANG} from "../Language/all";
const dcid = {type: String, required: true, minlength: 3, maxlength: 20};

// ------------------------------- Category Schema ------------------------------------
export type CategorySchema = {
    _dcid: string;
    channelLimit: number;
    channelUserLimit: number;
    allowLock: boolean;
    namingRule: string;
};
export const CategorySchema = {
    _dcid: dcid,
    channelLimit: {type: Number, required: true, min: 0, default: 0},
    channelUserLimit: {type: Number, required: true, min: 0, max: 100, default: 0},
    allowLock: {type: Boolean, required: true, default: true},
    namingRule: {
        type: String,
        required: true,
        minlength: 0,
        maxlength: 100,
        default: LANG["default"].general.default.talkNameRule,
    },
};

// ------------------------------- Text Channel Shema ---------------------------------
export type TextChannelSchema = {
    _dcid: string;
    allowCommands: boolean;
    autoDelete: string;
    autoDeleteDelay: number;
};
export const TextChannelSchema = {
    _dcid: dcid,
    allowCommands: {type: Boolean, required: true, default: true},
    autoDelete: {type: String, required: true, enum: ["none", "commands", "all"], default: "none"},
    autoDeleteDelay: {type: Number, required: true, default: 3000},
};

// ------------------------------- Guild Schema / Model -------------------------------
export type GuildSchema = {
    _dcid: string;
    prefix: string;
    language: string;
    textChannels: any[];
    categorys: any[];
};
export const GuildSchema = new Schema<GuildSchema>({
    _dcid: dcid,
    prefix: {type: String, required: true, default: "t!"},
    language: {type: String, required: true, default: LANG["default"].fileInfo.langShort},
    textChannels: [TextChannelSchema],
    categorys: [CategorySchema],
});
export type GuildModel = GuildSchema & Document;
export const GuildModel = model<GuildModel>("Guild", GuildSchema);

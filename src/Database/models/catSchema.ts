import {LANG} from "../../Language/all";
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
        if (typeof cS[key].default != "undefined" && typeof obj[key] == "undefined") obj[key] = cS[key].default;
    }
    return obj;
}

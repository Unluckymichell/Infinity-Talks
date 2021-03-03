const dcid = {type: String, required: true, minlength: 3, maxlength: 20};

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
        if (typeof tcS[key].default != "undefined" && typeof obj[key] == "undefined") obj[key] = tcS[key].default;
    }
    return obj;
}

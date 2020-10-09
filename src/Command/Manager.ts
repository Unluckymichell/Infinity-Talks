import Eris from "eris";
import {tcSchema} from "../Database/models";
import {GuildModel} from "../Database/models";
import {owners} from "../config.json";
import {Logger} from "../Util/Logger";
import {readdirSync} from "fs";
import {join} from "path";
const LOGGER = new Logger(__filename);

type privateHandler = (m: Eris.Message) => Promise<boolean>;
type handelCustom = (m: Eris.Message, gInfo: GuildModel, tcInfo: tcSchema) => Promise<boolean>;
type handleGeneral = (
    m: Eris.Message,
    command: parsedCom,
    gInfo: GuildModel,
    tcInfo: tcSchema
) => Promise<boolean>;

export class CommandManager {
    handlers: {
        private: privateHandler[];
        general: handleGeneral[];
        custom: handelCustom[];
    } = {private: [], general: [], custom: []};

    loadModules() {
        var files = readdirSync(join(__dirname, "/Modules"), {withFileTypes: true});
        for (const f of files) {
            if (f.isFile() && f.name.match(/\.cm\.js$/gi)) {
                try {
                    const commandModule: CommandModule = require(join(
                        __dirname,
                        "/Modules",
                        f.name
                    ));
                    if (commandModule.handlePrivate)
                        this.handlers.private.push(commandModule.handlePrivate);
                    if (commandModule.handleGeneral)
                        this.handlers.general.push(commandModule.handleGeneral);
                    if (commandModule.handelCustom)
                        this.handlers.custom.push(commandModule.handelCustom);
                    LOGGER.log(`Loaded command module ${f.name.replace(/\.cm\.js$/gi, "")}`);
                } catch (err) {
                    LOGGER.error(`Error while loading module ${f.name.replace(/\.cm\.js$/gi, "")}`);
                    LOGGER.error(err);
                }
            }
        }
    }

    parseCommand(m: Eris.Message, gInfo: GuildModel): void | parsedCom {
        // Verify existance of data;
        var message = m;
        if (!message.guildID) return;
        if (!message.member) return;

        // Check for permission overwrite
        var admin = message.member.permission.has("ADMINISTRATOR");
        if (
            /^\[PO->A\]/gi.exec(message.content) &&
            owners.findIndex(u => u._dcid == message.author.id) > -1
        ) {
            LOGGER.log(`Permission overwrite for user ${message.author.username} to admin level`);
            admin = true;
        } else if (
            /^\[PO->!A\]/gi.exec(message.content) &&
            owners.findIndex(u => u._dcid == message.author.id) > -1
        ) {
            LOGGER.log(`Permission overwrite for user ${message.author.username} to user level`);
            admin = false;
        }

        // Check and remove prefix
        const r = /^(\[PO\->A\])|^(\[PO\->!A\])/gi;
        const c = message.content.replace(r, "");
        if (c.indexOf(gInfo.prefix) != 0) return;
        var content = c.slice(gInfo.prefix.length).trim();

        // Parse command
        const argsRaw: carg[] = [];
        const qSplit = content.split(/"|'/gi);
        var quote = false;
        for (const i in qSplit) {
            if (!quote) {
                var sSplit = qSplit[i].split(/ +/g);
                for (const j in sSplit) {
                    argsRaw.push({val: sSplit[j], quote: false});
                }
            } else {
                argsRaw.push({val: qSplit[i], quote: true});
            }
            quote = !quote;
        }
        const args: carg[] = [];
        for (var a of argsRaw) {
            if (a.val != "") args.push(a);
        }
        var command = args.shift() || {val: "", quote: false};
        command.val = command.val.toLowerCase();

        return {command, args, admin};
    }

    async handlePrivate(m: Eris.Message) {
        var proms = [];
        for (const ph of this.handlers.private) {
            if (typeof ph == "function") proms.push(ph(m));
        }
        for (const res of await Promise.all(proms)) {
            if (res) return true;
        }
        return false;
    }

    async handelCustom(m: Eris.Message, gInfo: GuildModel, tcInfo: tcSchema) {
        var proms = [];
        for (const ph of this.handlers.custom) {
            if (typeof ph == "function") proms.push(ph(m, gInfo, tcInfo));
        }
        for (const res of await Promise.all(proms)) {
            if (res) return true;
        }
        return false;
    }

    async handleGeneral(m: Eris.Message, com: parsedCom, gInfo: GuildModel, tcInfo: tcSchema) {
        var proms = [];
        for (const ph of this.handlers.general) {
            if (typeof ph == "function") proms.push(ph(m, com, gInfo, tcInfo));
        }
        for (const res of await Promise.all(proms)) {
            if (res) return true;
        }
        return false;
    }
}

export interface CommandModule {
    handlePrivate?: privateHandler;
    handelCustom?: handelCustom;
    handleGeneral?: handleGeneral;
}

export interface parsedCom {
    command: carg;
    args: carg[];
    admin: boolean;
}

export interface carg {
    val: string;
    quote: boolean;
}

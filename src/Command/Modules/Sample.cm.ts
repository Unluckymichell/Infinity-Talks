import {Message} from "eris";
import {GuildModel, tcSchema} from "../../Database/models";
import {CommandModule, parsedCom} from "../Manager";

/**
 * Sample command module
 */
module.exports = class implements CommandModule {
    async handlePrivate(message: Message) {
        return false;
    }
    async handelCustom(message: Message, gInfo: GuildModel, tcInfo: tcSchema) {
        return false;
    }
    async handleGeneral(message: Message, command: parsedCom, gInfo: GuildModel, tcInfo: tcSchema) {
        return false;
    }
};

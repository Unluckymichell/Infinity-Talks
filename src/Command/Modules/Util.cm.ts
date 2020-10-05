import {Message} from "eris";
import {GuildModel, tcSchema} from "../../Database/models";
import {CommandModule, parsedCom} from "../Manager";

module.exports = class implements CommandModule {
    async handelCustom(message: Message, gInfo: GuildModel, tcInfo: tcSchema) {
        return false;
    }
    async handleGeneral(message: Message, command: parsedCom, gInfo: GuildModel, tcInfo: tcSchema) {
        return false;
    }
};

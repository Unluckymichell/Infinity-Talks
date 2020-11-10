import {Message} from "eris";
import {GuildModel, tcSchema} from "../../Database/models";
import {CommandModule, parsedCom} from "../Manager";
import {StringGenerator} from "../../Util/StringGen";
import {LANG} from "../../Language/all";

/**
 * Util Commands
 */
export default new (class implements CommandModule {
    sg = StringGenerator.instance;
    async handlePrivate(message: Message) {
        switch (message.content) {
            case "ping":
                message.channel.createMessage(LANG.default.commands.guild.ping);
                return true;

            default:
                return false;
        }
    }
    async handleGeneral(message: Message, command: parsedCom, gInfo: GuildModel, tcInfo: tcSchema) {
        console.log("ping");
        switch (command.command.val) {
            case "ping":
                message.channel.createMessage(LANG.default.commands.guild.ping);
                return true;

            default:
                return false;
        }
    }
})();

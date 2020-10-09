import {Message} from "eris";
import {GuildModel, tcSchema, GuildSchema, GuildSchemaRaw} from "../../Database/models";
import {CommandModule, parsedCom} from "../Manager";
import {StringGenerator} from "../../Util/StringGen";
import {LANG} from "../../Language/all";

/**
 * Sample command module
 */
module.exports = class implements CommandModule {
    sg = StringGenerator.instance;
    async handlePrivate(message: Message) {
        return false;
    }
    async handelCustom(message: Message, gInfo: GuildModel, tcInfo: tcSchema) {
        return false;
    }
    async handleGeneral(message: Message, command: parsedCom, gInfo: GuildModel, tcInfo: tcSchema) {
        var channel = message.channel;
        var lang = LANG[gInfo.language];
        switch (command.command.val) {
            case "prefix":
                if (command.args.length != 1) {
                    // Wrong arg amount
                    channel.createMessage(
                        this.sg.build(
                            {prefix: gInfo.prefix},
                            command.args.length < 1
                                ? lang.commands.guild.prefix.notEnoughtArgs
                                : lang.commands.guild.prefix.toManyArgs
                        )
                    );
                } else {
                    // Update prefix
                    gInfo.prefix = command.args[0].val;
                    gInfo = await gInfo.save();
                    channel.createMessage(
                        this.sg.build(
                            {prefix: gInfo.prefix},
                            lang.commands.guild.prefix.successfull
                        )
                    );
                }
                return true;

            default:
                return false;
        }
    }
};

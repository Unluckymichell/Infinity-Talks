import {Message} from "eris";
import {GuildModel, tcSchema} from "../../Database/models";
import {language} from "../../Language/all";
import {StringGenerator} from "../../Util/StringGen";
import { SimpleCommand } from "../Abstract/SimpleCommand";
import {carg, CommandHandler} from "../CommandHandler";

class PingCommand extends SimpleCommand {
    command = "ping";
    async trigger(message: Message, args: carg[], lang: language, gInfo: GuildModel, tcInfo: tcSchema, admin: boolean): Promise<void | Error> {
        var pongMessage = await message.channel.createMessage(StringGenerator.buildVars({ms: ""}, lang.commands.guild.ping));
        await pongMessage.edit(StringGenerator.buildVars({ms: `${pongMessage.timestamp - message.timestamp}ms`}, lang.commands.guild.ping));
    }
}

CommandHandler.registerCommand(new PingCommand());

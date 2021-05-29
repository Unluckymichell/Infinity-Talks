import {Message} from "eris";
import {GuildModel} from "../../Database/models/GuildSchema";
import {tcSchema} from "../../Database/models/tcSchema";
import {language} from "../../Language/all";
import {SimpleCommand} from "../Abstract/SimpleCommand";
import {carg, CommandHandler} from "../CommandHandler";
import {HelpWindow} from "../Windows/Help";

class TestWindowTriggerCommand extends SimpleCommand {
    command = "help";
    async trigger(message: Message, args: carg[], lang: language, gInfo: GuildModel, tcInfo: tcSchema, admin: boolean): Promise<void | Error> {
        // TODO: Implement CommandHandler.registerWindow and CommandHandler.spawnWindow(widownName, lang, gInfo, tcInfo, admin)
        var win = new HelpWindow(lang, gInfo, tcInfo, admin);
        var err;
        if (args[0] && win.hasPage(args[0].val)) err = await win.attach(message.channel, message.author, args[0].val);
        else err = await win.attach(message.channel, message.author, "root");

        if (!err) {
            CommandHandler.addWindow(win);
            message.delete();
        } else message.channel.createMessage("Internal Error: " + err);
    }
}

CommandHandler.registerCommand(new TestWindowTriggerCommand());

import {Message} from "eris";
import {GuildModel, tcSchema} from "../../Database/models";
import {LANG, language} from "../../Language/all";
import {ChatPage, ChatPageButton, ChatRootPage, ChatWindow, SimpleCommand} from "../Classes";
import {carg, CommandHandler} from "../CommandHandler";

class HelpWindow extends ChatWindow {
    rootPage: ChatRootPage = {
        buttons: [{buttonName: "close", emoji: "❌"}],
        content: LANG.default.commands.guild.help.root,
        handleChatInput: true,
    };
    pages: ChatPage[] = [];
    pageVars: {[key: string]: string | number | boolean | Function} = {text: ""};
    timeout: number = 60000;

    async onButton(button: ChatPageButton): Promise<void | Error> {
        if (button.buttonName == "close") this.close();
    }
    async onMessage(message: Message, gInfo: GuildModel, tcInfo: tcSchema): Promise<void | Error> {
        this.pageVars.text = message.content;
        message.delete();
        this.render();
    }
}

class TestWindowTriggerCommand extends SimpleCommand {
    command = "help";
    async trigger(message: Message, args: carg[], lang: language, gInfo: GuildModel, tcInfo: tcSchema, admin: boolean): Promise<void | Error> {
        var win = new HelpWindow();
        var err;

        if (args[0] && win.hasPage(args[0].val)) err = await win.attach(message.channel, message.author, args[0].val);
        else err = await win.attach(message.channel, message.author);

        if (!err) {
            CommandHandler.addWindow(win);
            message.delete();
        } else message.channel.createMessage("Internal Error!");
    }
}

CommandHandler.registerCommand(new TestWindowTriggerCommand());

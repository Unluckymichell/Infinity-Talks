import {Message} from "eris";
import {GuildModel} from "../../Database/models/GuildSchema";
import {tcSchema} from "../../Database/models/tcSchema";
import {LANG, language} from "../../Language/all";
import {ChatPage, ChatPageButton, ChatRootPage, ChatWindow} from "../Abstract/ChatWindow";
import {SimpleCommand} from "../Abstract/SimpleCommand";
import {carg, CommandHandler} from "../CommandHandler";

class HelpWindow extends ChatWindow {
    rootPage: ChatRootPage = {
        buttons: [{buttonName: "close", emoji: "❌"}],
        content: LANG.default.commands.guild.help.root,
        handleChatInput: true,
    };
    pages: ChatPage[] = [
        {
            pageName: "help",
            buttons: [
                {buttonName: "root", emoji: "⬅️"},
                {buttonName: "close", emoji: "❌"},
            ],
            content: LANG.default.commands.guild.help.help,
        },
    ];
    pageVars: {[key: string]: string | number | boolean | Function} = {};
    vars: {language: language} = {language: LANG.default};
    timeout: number = 10000;

    async onButton(button: ChatPageButton): Promise<void | Error> {
        if (button.buttonName == "close") this.close();
        if (button.buttonName == "root") this.switchPage("root");
    }
    async onMessage(message: Message, gInfo: GuildModel, tcInfo: tcSchema): Promise<void | Error> {
        if (this.hasPage(message.content)) this.switchPage(message.content);
        message.delete();
        this.render();
    }
}

class TestWindowTriggerCommand extends SimpleCommand {
    command = "help";
    async trigger(message: Message, args: carg[], lang: language, gInfo: GuildModel, tcInfo: tcSchema, admin: boolean): Promise<void | Error> {
        var win = new HelpWindow();
        var err;

        win.vars.language = lang;

        if (args[0] && win.hasPage(args[0].val)) err = await win.attach(message.channel, message.author, args[0].val);
        else err = await win.attach(message.channel, message.author);

        if (!err) {
            CommandHandler.addWindow(win);
            message.delete();
        } else message.channel.createMessage("Internal Error!");
    }
}

CommandHandler.registerCommand(new TestWindowTriggerCommand());

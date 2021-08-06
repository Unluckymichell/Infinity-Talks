import {Message} from "eris";
import {GuildModel} from "../../Database/models/GuildSchema";
import {tcSchema} from "../../Database/models/tcSchema";
import {ChatPage, ChatPageButton, ChatWindow} from "../Abstract/ChatWindow";

const rootPage: ChatPage = {
    pageName: "root",
    buttons: [{buttonName: "close", emoji: "❌"}],
    content: {
        title: "Help menu",
        description:
            "You need help? Could you be a little more specific?\nYou can write any command below (without prefix) this Window to switch to the coresponding help page.\n\nFollowing commands can be executed:\n\n`$prefixhelp [command]`\nDisplay this window\n\n`$prefixping`\nCheck bot ping\n\n`$prefixlock`\nLock voice channel you are in\n\n`$prefixunlock`\nUnlock voice channel you are in",
        footer: {
            text: "Close this Window using the ❌ reaction!",
        },
        color: 16753920,
    },
    handleChatInput: true,
};

const helpHelpPage: ChatPage = {
    pageName: "help",
    buttons: [
        {buttonName: "root", emoji: "⬅️"},
        {buttonName: "close", emoji: "❌"},
    ],
    content: {
        title: "Help menu - Help command",
        description: "Realy?",
        footer: {
            text: "Close using ❌, Go back using ⬅️",
        },
        color: 16753920,
    },
    handleChatInput: true,
};

const pingHelpPage: ChatPage = {
    pageName: "ping",
    buttons: [
        {buttonName: "root", emoji: "⬅️"},
        {buttonName: "close", emoji: "❌"},
    ],
    content: {
        title: "Help menu - Ping command",
        description:
            "This command can be used to check the availability and net speed of the bot host.\nIf the value is higher than 1500ms, the bot will respond very slowly.\nUsage:\n\n`$prefixping`",
        footer: {
            text: "Close using ❌, Go back using ⬅️",
        },
        color: 16753920,
    },
    handleChatInput: true,
};

const lockHelpPage: ChatPage = {
    pageName: "lock",
    buttons: [
        {buttonName: "root", emoji: "⬅️"},
        {buttonName: "close", emoji: "❌"},
    ],
    content: {
        title: "Help menu - Lock command",
        description:
            "Lock the voice channel you are connected to.\nThis means no new people will be able to connect!\nThis will only work if the server administrator has allowed channel blocking and you are in a bot-managed channel.\n\nUsage:\n`$prefixlock`",
        footer: {
            text: "Close using ❌, Go back using ⬅️",
        },
        color: 16753920,
    },
    handleChatInput: true,
};

const unlockHelpPage: ChatPage = {
    pageName: "unlock",
    buttons: [
        {buttonName: "root", emoji: "⬅️"},
        {buttonName: "close", emoji: "❌"},
    ],
    content: {
        title: "Help menu - Lock command",
        description:
            "Unlock the voice channel you are connected to.\nThis means no new people will be able to connect again!\nThis will only work on locked channels.\n\nUsage:\n`$prefixunlock`",
        footer: {
            text: "Close using ❌, Go back using ⬅️",
        },
        color: 16753920,
    },
    handleChatInput: true,
};

export class HelpWindow extends ChatWindow {
    rootPageName = "root";
    pages: ChatPage[] = [rootPage, helpHelpPage, pingHelpPage, lockHelpPage, unlockHelpPage];
    pageVars: {[key: string]: string | number | boolean | Function} = {
        langName: "Deutsch",
        prefix: "t!",
    };
    timeout: number = 30000;

    async onInit(gInfo: GuildModel, tcInfo: tcSchema): Promise<void | Error> {
        this.pageVars.prefix = gInfo.prefix;
    }

    async onButton(button: ChatPageButton): Promise<void | Error> {
        if (button.buttonName == "close") this.close();
        if (button.buttonName == "root") this.switchPage("root");
        this.resetTimeout();
    }

    async onMessage(message: Message, gInfo: GuildModel, tcInfo: tcSchema): Promise<void | Error> {
        this.pageVars.prefix = gInfo.prefix;
        this.resetTimeout();
        if (message.content.replace(gInfo.prefix, "") == "close") this.close();
        else if (this.hasPage(message.content)) this.switchPage(message.content);
        else {
            message.channel
                .createMessage(
                    "Close the window to be able to send messages!\nYou can also type a command in this channel (without prefix) and the corresponding help page will open."
                )
                .then(errMessage => {
                    setTimeout(() => errMessage.delete(), 10000);
                });
        }
        message.delete();
    }
}

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
            "You need help? Could you be a little more specific?\nYou can write any command below this Window to switch to the coresponding help page.",
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
            text: "$langName Close using ❌, Go back using ⬅️",
        },
        color: 16753920,
    },
    handleChatInput: true,
};

const langTestHelpPage: ChatPage = {
    pageName: "langTest",
    buttons: [
        {buttonName: "root", emoji: "⬅️"},
        {buttonName: "close", emoji: "❌"},
    ],
    content: {
        title: "Das ist ein test",
        description: "LOL Sprache ist $langName",
        footer: {
            text: "Close using ❌, Go back using ⬅️",
        },
        color: 16753920,
    },
    handleChatInput: true,
};

export class HelpWindow extends ChatWindow {
    rootPageName = "root";
    pages: ChatPage[] = [rootPage, helpHelpPage, langTestHelpPage];
    pageVars: {[key: string]: string | number | boolean | Function} = {
        langName: "Deutsch",
    };
    timeout: number = 30000;

    async onButton(button: ChatPageButton): Promise<void | Error> {
        if (button.buttonName == "close") this.close();
        if (button.buttonName == "root") this.switchPage("root");
        this.resetTimeout();
    }

    async onMessage(message: Message, gInfo: GuildModel, tcInfo: tcSchema): Promise<void | Error> {
        if (this.hasPage(message.content)) this.switchPage(message.content);
        message.delete();
        this.resetTimeout();
        this.render();
    }
}

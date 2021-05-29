import {Message} from "eris";
import {GuildModel} from "../../Database/models/GuildSchema";
import {tcSchema} from "../../Database/models/tcSchema";
import {ChatPageButton, RenderableEmbed} from "./ChatWindow";

export abstract class ChatWindow {
    abstract vars: {[key: string]: string | number | boolean} = {};

    constructor() {
        this.onOpen();
    }
    abstract render(): RenderableEmbed;

    abstract onButton(button: ChatPageButton): void;
    abstract onMessage(message: Message, gInfo: GuildModel, tcInfo: tcSchema): void;

    abstract onOpen(): void;
    abstract onClose(): void;
}

export interface ChatRootPage {
    buttons: ChatPageButton[];
    handleChatInput?: boolean;
    content: RenderableEmbed;
}
export interface ChatPage extends ChatRootPage {
    pageName: string;
}

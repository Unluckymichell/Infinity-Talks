import {EmbedOptions, Emoji, Message, PossiblyUncachedMessage, TextableChannel, User} from "eris";
import {GuildModel} from "../../Database/models/GuildSchema";
import {tcSchema} from "../../Database/models/tcSchema";
import {language} from "../../Language/all";
import {StringGenerator} from "../../Util/classes/StringGen";
import {HandlerResponse} from "../CommandHandler";

/**
 * How to initialise a ChatWindow:
 *
 */

export abstract class ChatWindow {
    abstract rootPageName: string;
    abstract pages: ChatPage[];
    abstract pageVars: {[key: string]: string | number | boolean | Function};
    abstract timeout: number;

    private timeoutTimeout: NodeJS.Timeout | null = null;
    private channel: TextableChannel | null = null;
    private message: Message | null = null;
    private user: User | null = null;
    private currentPage: ChatPage | null = null;
    attached: boolean = false;
    closed: boolean = false;

    private lang: language;
    private gInfo: GuildModel;
    private tcInfo: tcSchema;
    private admin: boolean;

    constructor(lang: language, gInfo: GuildModel, tcInfo: tcSchema, admin: boolean) {
        this.lang = lang;
        this.gInfo = gInfo;
        this.tcInfo = tcInfo;
        this.admin = admin;
        setImmediate(() => this.onInit(gInfo, tcInfo));
    }

    resetTimeout() {
        if (this.timeoutTimeout) clearTimeout(this.timeoutTimeout);
        this.timeoutTimeout = setTimeout(() => {
            this.close();
        }, this.timeout);
    }

    hasPage(pageName: string) {
        return pageName == "root" ? true : this.pages.some(p => p.pageName == pageName);
    }

    async attach(channel: TextableChannel, user: User, pageName: string): Promise<string | void> {
        if (this.channel) return "Window is attached";
        this.channel = channel;
        this.user = user;
        this.timeoutTimeout = setTimeout(() => {
            this.close();
        }, this.timeout);
        var renderResult = await this.switchPage(pageName);
        if (renderResult) {
            this.channel = channel;
            this.user = user;
            clearTimeout(this.timeoutTimeout);
        } else this.attached = true;
        return renderResult;
    }

    async switchPage(pageName: string): Promise<string | void> {
        var page = this.pages.find(p => p.pageName == pageName);
        if (page) {
            this.currentPage = page;
            await this.message?.removeReactions();
            var ret = await this.render();
            this.currentPage.buttons.forEach(btn => this.message?.addReaction(btn.emoji));
            return ret;
        } else return "Page not found: " + pageName;
    }

    async render(): Promise<string | void> {
        if (this.closed) return "Window is closed";
        if (!this.channel) return "Not bound to channel";
        if (!this.currentPage) return "No selected page";

        var embed = {...this.currentPage.content};
        if (this.currentPage.content.description) embed.description = StringGenerator.buildVars(this.pageVars, this.currentPage.content.description);
        if (this.currentPage.content.footer) embed.footer!.text = StringGenerator.buildVars(this.pageVars, this.currentPage.content.footer.text);
        if (this.currentPage.content.title) embed.title = StringGenerator.buildVars(this.pageVars, this.currentPage.content.title);
        this.currentPage.content.url;

        embed.fields = this.currentPage.content.fields?.map(f => {
            return {
                name: StringGenerator.buildVars(this.pageVars, f.name),
                value: StringGenerator.buildVars(this.pageVars, f.value),
                inline: f.inline,
            };
        });

        if (this.message) await this.message.edit({embed});
        else this.message = await this.channel.createMessage({embed});
    }

    async close(): Promise<void> {
        if (this.timeoutTimeout) clearTimeout(this.timeoutTimeout);
        this.closed = true;
        try {
            await this.message?.delete();
        } catch (err) {}
    }

    async onDiscordMessage(message: Message, gInfo: GuildModel, tcInfo: tcSchema): Promise<HandlerResponse> {
        if (this.currentPage?.handleChatInput && this.message && this.user && this.channel == message.channel && this.user == message.author) {
            var err = await this.onMessage(message, gInfo, tcInfo);
            return {handled: true, error: err ? err.message : undefined};
        } else return {handled: false};
    }

    async onDiscordReaction(message: PossiblyUncachedMessage, emoji: Emoji, userID: string): Promise<HandlerResponse> {
        if (this.message && this.user && this.message.id == message.id && this.user.id == userID) {
            var btn = this.currentPage?.buttons.find(b => b.emoji == emoji.name);
            if (btn) {
                var err = await this.onButton(btn);
                return {handled: true, error: err ? err.message : undefined};
            }
        }
        return {handled: false};
    }

    abstract onInit(gInfo: GuildModel, tcInfo: tcSchema): Promise<void | Error>;
    abstract onButton(button: ChatPageButton): Promise<void | Error>;
    abstract onMessage(message: Message, gInfo: GuildModel, tcInfo: tcSchema): Promise<void | Error>;
}

export type RenderableEmbed = EmbedOptions;
export interface ChatPageButton {
    buttonName: string;
    emoji: string;
}

export interface ChatPage {
    buttons: ChatPageButton[];
    handleChatInput?: boolean;
    content: RenderableEmbed;
    pageName: string;
}

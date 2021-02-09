import {EmbedOptions, Emoji, Message, PossiblyUncachedMessage, TextableChannel, User} from "eris";
import {GuildModel, tcSchema} from "../Database/models";
import {language} from "../Language/all";
import {Main} from "../Main";
import {StringGenerator} from "../Util/StringGen";
import {carg} from "./CommandHandler";

export abstract class SimpleCommand {
    abstract command: string;

    async onDiscordCommand(
        message: Message,
        command: carg,
        args: carg[],
        lang: language,
        gInfo: GuildModel,
        tcInfo: tcSchema,
        admin: boolean
    ): Promise<HandlerResponse> {
        if (this.command == command.val) {
            var err = await this.trigger(message, args, lang, gInfo, tcInfo, admin);
            return {handled: true, error: err ? err.message : undefined};
        } else return {handled: false};
    }

    abstract trigger(message: Message, args: carg[], lang: language, gInfo: GuildModel, tcInfo: tcSchema, admin: boolean): Promise<void | Error>;
}

export abstract class ChatWindow {
    abstract rootPage: ChatRootPage;
    abstract pages: ChatPage[];
    abstract pageVars: {[key: string]: string | number | boolean | Function};
    abstract timeout: number;

    private timeoutTimeout: NodeJS.Timeout | null = null;
    private channel: TextableChannel | null = null;
    private message: Message | null = null;
    private user: User | null = null;

    closed: boolean = false;
    private openPage: ChatRootPage | null = null;

    hasPage(pageName: string) {
        return pageName == "root" ? true : this.pages.some(p => p.pageName == pageName);
    }
    async attach(channel: TextableChannel, user: User, pageName: string = "root"): Promise<string | void> {
        if (this.channel) return "Window is attached";
        this.channel = channel;
        this.user = user;
        this.timeoutTimeout = setTimeout(() => {
            this.close();
        }, this.timeout);
        return await this.switchPage(pageName);
    }
    async switchPage(pageName: string): Promise<string | void> {
        if (this.closed) return "Window is closed";
        if (pageName == "root") {
            this.openPage = this.rootPage;
            await this.message?.removeReactions();
            var ret = await this.render();
            this.openPage.buttons.forEach(btn => this.message?.addReaction(btn.emoji));
            return ret;
        }
        var page = this.pages.find(p => p.pageName == pageName);
        if (page) {
            this.openPage = page;
            await this.message?.removeReactions();
            this.openPage.buttons.forEach(btn => this.message?.addReaction(btn.emoji));
            var ret = await this.render();
            this.openPage.buttons.forEach(btn => this.message?.addReaction(btn.emoji));
            return ret;
        }
        return "Page not found";
    }
    async render(): Promise<string | void> {
        if (this.closed) return "Window is closed";
        if (!this.channel) return "Not bound to channel";
        if (!this.openPage) return "No selected page";

        var embed = {...this.openPage.content};
        if (this.openPage.content.description) embed.description = StringGenerator.buildVars(this.pageVars, this.openPage.content.description);
        if (this.openPage.content.footer) embed.footer!.text = StringGenerator.buildVars(this.pageVars, this.openPage.content.footer.text);
        if (this.openPage.content.title) embed.title = StringGenerator.buildVars(this.pageVars, this.openPage.content.title);
        this.openPage.content.url;

        embed.fields = this.openPage.content.fields?.map(f => {
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
        await this.message?.delete();
    }

    async onDiscordMessage(message: Message, gInfo: GuildModel, tcInfo: tcSchema): Promise<HandlerResponse> {
        if (this.openPage?.handleChatInput && this.message && this.user && this.channel == message.channel && this.user == message.author) {
            var err = await this.onMessage(message, gInfo, tcInfo);
            return {handled: true, error: err ? err.message : undefined};
        } else return {handled: false};
    }
    async onDiscordReaction(message: PossiblyUncachedMessage, emoji: Emoji, userID: string): Promise<HandlerResponse> {
        if (this.message && this.user && this.message.id == message.id && this.user.id == userID) {
            var btn = this.openPage?.buttons.find(b => b.emoji == emoji.name);
            if (btn) {
                var err = await this.onButton(btn);
                return {handled: true, error: err ? err.message : undefined};
            }
        }
        return {handled: false};
    }

    abstract onButton(button: ChatPageButton): Promise<void | Error>;
    abstract onMessage(message: Message, gInfo: GuildModel, tcInfo: tcSchema): Promise<void | Error>;
}

export type RenderableEmbed = EmbedOptions;
export interface ChatPageButton {
    buttonName: string;
    emoji: string;
}
export interface ChatRootPage {
    buttons: ChatPageButton[];
    handleChatInput?: boolean;
    content: RenderableEmbed;
}
export interface ChatPage extends ChatRootPage {
    pageName: string;
}
export interface HandlerResponse {
    error?: string;
    handled: boolean;
}

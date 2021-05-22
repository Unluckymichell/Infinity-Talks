import {Emoji, Message, PossiblyUncachedMessage} from "eris";
import {GuildModel} from "../Database/models/GuildSchema";
import {tcDefault, tcSchema} from "../Database/models/tcSchema";
import {LOGGER} from "../Util/classes/Logger";
import {owners} from "../static.json";
import {ChatWindow} from "./Abstract/ChatWindow";
import {SimpleCommand} from "./Abstract/SimpleCommand";
import {Main} from "../Main";
import {LANG} from "../Language/all";
import {readdirSync} from "fs";
import {join} from "path";
import {getFileTypes} from "../Util/functions/other";
import {StringGenerator} from "../Util/classes/StringGen";

export class CommandHandler {
    static instance: CommandHandler;
    static windows: ChatWindow[] = [];
    static commands: SimpleCommand[] = [];

    constructor() {
        CommandHandler.instance = this;

        var files = readdirSync(join(__dirname, "Commands"));
        files.forEach(file => (getFileTypes(file).shift() == "js" ? require(join(__dirname, "Commands", file)) : null));

        files = readdirSync(join(__dirname, "Windows"));
        files.forEach(file => (getFileTypes(file).shift() == "js" ? require(join(__dirname, "Windows", file)) : null));
    }

    static registerCommand(command: SimpleCommand) {
        CommandHandler.commands.push(command);
    }

    static addWindow(window: ChatWindow) {
        CommandHandler.windows.push(window);
    }

    async onDiscordMessage(message: Message) {
        const bot = Main.instance.bot;

        // Ignor self
        if (message.author == bot.user) return;

        if (!message.guildID) {
            // Handle Privat
        } else {
            // Handle Guild

            // Get guildInfo
            var gInfo = await GuildModel.findOne({_dcid: message.guildID}); // Request guild information from db
            if (!gInfo) gInfo = await new GuildModel({_dcid: message.guildID}).save(); // Save default if not found

            // Get channelInfo
            var tcInfo: tcSchema | undefined = gInfo.textChannels.find(c => c._dcid == message.channel.id); // Find category information from guild information
            if (!tcInfo) {
                // Save default if not found
                tcInfo = tcDefault({_dcid: message.channel.id});
                gInfo.textChannels.push(tcInfo);
                await gInfo.save();
            }

            // Send message event to all windows (and fully remove closed ones)
            var winPromises = [];
            var i = 0;
            while (i < CommandHandler.windows.length) {
                if (CommandHandler.windows[i].closed) CommandHandler.windows.splice(i, 1);
                else {
                    winPromises.push(CommandHandler.windows[i].onDiscordMessage(message, gInfo, tcInfo));
                    i++;
                }
            }
            var handled = (await Promise.all(winPromises)).find(r => r.handled == true || r.error);
            if (handled) {
                if (handled.error) return message.channel.createMessage(handled?.error);
                if (handled.handled) return;
            }

            // Parse Command
            var parsedCom = this.parseCommand(message, gInfo, tcInfo);
            if (parsedCom) {
                var commmand = CommandHandler.commands.find(c => c.command == parsedCom!.command.val);
                var lang = LANG.get(gInfo.language);

                if (!commmand) {
                    // Send not found message
                    return message.channel.createMessage(
                        StringGenerator.build(
                            {
                                prefix: lang.general.default.prefix,
                            },
                            lang.commands.guild.notFound
                        )
                    );
                }

                handled = await commmand.onDiscordCommand(message, parsedCom.command, parsedCom.args, lang, gInfo, tcInfo, parsedCom.admin);

                if (handled.error) return message.channel.createMessage(handled?.error);
                if (handled.handled) return;
            }
        }
    }
    async onDiscordReaction(message: PossiblyUncachedMessage, emoji: Emoji, userID: string) {
        var winPromises = [];
        var i = 0;
        while (i < CommandHandler.windows.length) {
            if (CommandHandler.windows[i].closed) CommandHandler.windows.splice(i, 1);
            else {
                winPromises.push(CommandHandler.windows[i].onDiscordReaction(message, emoji, userID));
                i++;
            }
        }
        var handled = (await Promise.all(winPromises)).find(r => r.handled == true || r.error);
        if (handled && handled.error) {
            var textChannel = Main.instance.bot.getChannel(message.channel.id);
            if (textChannel.type == 0) {
                textChannel.createMessage(handled?.error);
            }
        }
    }

    parseCommand(m: Message, gInfo: GuildModel, tcInfo: tcSchema): null | parsedCom {
        // Verify existance of data;
        var message = m;
        if (!message.guildID) return null;
        if (!message.member) return null;

        // Check for permission overwrite
        var admin = message.member.permission.has("administrator");
        if (/^\[PO->A\]/gi.exec(message.content) && owners.findIndex(u => u._dcid == message.author.id) > -1) {
            LOGGER.log(`Permission overwrite for user ${message.author.username} to admin level`);
            admin = true;
        } else if (/^\[PO->!A\]/gi.exec(message.content) && owners.findIndex(u => u._dcid == message.author.id) > -1) {
            LOGGER.log(`Permission overwrite for user ${message.author.username} to user level`);
            admin = false;
        }

        // Check if commands are allowed here
        if (!tcInfo.allowCommands && !admin) return null;

        // Check and remove prefix
        const r = /^(\[PO\->A\])|^(\[PO\->!A\])/gi;
        const c = message.content.replace(r, "");
        if (c.indexOf(gInfo.prefix) != 0) return null;
        var content = c.slice(gInfo.prefix.length).trim();

        // Parse command
        const argsRaw: carg[] = [];
        const qSplit = content.split(/"|'/gi);
        var quote = false;
        for (const i in qSplit) {
            if (!quote) {
                var sSplit = qSplit[i].split(/ +/g);
                for (const j in sSplit) {
                    argsRaw.push({val: sSplit[j], quote: false});
                }
            } else {
                argsRaw.push({val: qSplit[i], quote: true});
            }
            quote = !quote;
        }
        const args: carg[] = [];
        for (var a of argsRaw) {
            if (a.val != "") args.push(a);
        }
        var command = args.shift() || {val: "", quote: false};
        command.val = command.val.toLowerCase();
        return {command, args, admin};
    }
}

export interface parsedCom {
    command: carg;
    args: carg[];
    admin: boolean;
}

export interface carg {
    val: string;
    quote: boolean;
}

export interface HandlerResponse {
    error?: string;
    handled: boolean;
}

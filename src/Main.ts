export const projectRoot = require("path").join(__dirname, "..");
import Eris from "eris";
import {GuildModel, catDefault, tcDefault, catSchema, tcSchema} from "./Database/models";
import {EventCompressor} from "./Util/EventCompressor";
import {LANG} from "./Language/all";
import {Logger} from "./Util/Logger";
import {StringGenerator} from "./Util/StringGen";
import {DatabaseManager} from "./Database/Manager";
import {CommandManager, parsedCom} from "./Command/Manager";
require("dotenv").config();
const LOGGER = new Logger(__filename);

class Main {
    bot: Eris.Client;
    ec: EventCompressor;
    sg: StringGenerator;
    dbm: DatabaseManager;
    cm: CommandManager;

    constructor() {
        if (!process.env.TOKEN) throw new Error("Missing login token.");
        this.bot = Eris(process.env.TOKEN);
        this.ec = new EventCompressor();
        this.sg = new StringGenerator();
        this.dbm = new DatabaseManager();
        this.cm = new CommandManager();

        LOGGER.log("Starting...");

        this.bot.on("ready", () => {
            LOGGER.log("... Discord Ready!");
            this.cm.loadModules();
        });
        this.bot.on("error", err => LOGGER.error(err));

        // Voice channel update
        this.bot.on("voiceChannelJoin", (_m, c) => this.voiceChannelUpdate(c));
        this.bot.on("voiceChannelLeave", (_m, c) => this.voiceChannelUpdate(c));
        this.bot.on("voiceChannelSwitch", (_m, c, oc) => {
            this.voiceChannelUpdate(c);
            this.voiceChannelUpdate(oc);
        });
        this.bot.on("voiceStateUpdate", m => {
            if (m.voiceState.channelID) {
                var c = this.bot.getChannel(m.voiceState.channelID);
                if (c.type == 2) this.voiceChannelUpdate(c);
            }
        });

        this.bot.on("messageCreate", m => this.messageRecieved(m));

        this.bot.connect();
    }

    async messageRecieved(message: Eris.Message) {
        if (!message.guildID) {
            // Handle Command
            if (!(await this.cm.handlePrivate(message)))
                // Send not found message
                message.channel.createMessage(
                    this.sg.build(
                        {
                            prefix: LANG.default.general.default.prefix,
                        },
                        LANG.default.commands.private.notFound
                    )
                );
        } else {
            var gInfo = await GuildModel.findOne({_dcid: message.guildID}); // Request guild information from db
            if (!gInfo) gInfo = await new GuildModel({_dcid: message.guildID}).save(); // Save default if not found

            var tcInfo: tcSchema | null = gInfo.textChannels.find(
                c => c._dcid == message.channel.id
            ); // Find category information from guild information
            if (!tcInfo) {
                // Save default if not found
                tcInfo = tcDefault({_dcid: message.channel.id});
                gInfo.textChannels.push(tcInfo);
                await gInfo.save();
            }

            // Handle custom command module handlers.
            if (await this.cm.handelCustom(message, gInfo, tcInfo)) return;

            // Parse command
            var parsedCom = this.cm.parseCommand(message, gInfo);
            if (!parsedCom) return;

            // Handle general command module handlers.
            if (await this.cm.handleGeneral(message, parsedCom, gInfo, tcInfo)) return;

            // Send not found message
            message.channel.createMessage(
                this.sg.build(
                    {
                        prefix: LANG.default.general.default.prefix,
                    },
                    LANG.default.commands.guild.notFound
                )
            );
        }
    }

    async voiceChannelUpdate(ch: Eris.VoiceChannel) {
        const guild = ch.guild;
        if (!ch.parentID) return; // If there is no category, ignore event
        if (!(await this.ec.waitcomp(`vcu#${ch.parentID}`, 300))) return; // Compress spamed Events

        var gInfo = await GuildModel.findOne({_dcid: guild.id}); // Request guild information from db
        if (!gInfo) gInfo = await new GuildModel({_dcid: guild.id}).save(); // Save default if not found

        var catInfo: catSchema | null = gInfo.categorys.find(c => c._dcid == ch.parentID); // Find category information from guild information
        if (!catInfo) {
            // Save default if not found
            catInfo = catDefault({_dcid: ch.parentID});
            gInfo.categorys.push(catInfo);
            await gInfo.save();
        }
        if (!catInfo.enableInfTalks) return; // Bot is turned off

        var lang = LANG["default"]; // Use default language
        if (Object.prototype.hasOwnProperty.call(LANG, gInfo.language)) lang = LANG[gInfo.language]; // Switch to guild specific if availabel

        const category = this.bot.getChannel(ch.parentID);
        if (category.type != 4) return LOGGER.warn("ch.parrent was not a category!"); // Verify channel is a category

        // Reorganize and filter channels in normal array
        const channels: Eris.VoiceChannel[] = [];
        for (const c of category.channels.values()) {
            if (c.type == 2) channels.push(c);
        }
        channels.sort((a, b) => a.position - b.position);

        // Start processing channels
        var pos = 1;
        LOGGER.debug(`Event(${guild.name}:${category.name})`);
        for (var i = 0; i < channels.length; i++) {
            var channel = channels[i];
            var userCount = channel.voiceMembers.size;
            var locked = (channel.userLimit || 0) > 0;
            var name = this.sg.build({pos, locked}, catInfo.namingRule);
            if (i == channels.length - 1) {
                if (userCount > 0) {
                    const newname = this.sg.build(
                        {pos: pos + 1, locked: false},
                        catInfo.namingRule
                    );
                    this.bot
                        .createChannel(
                            channel.guild.id,
                            newname,
                            2,
                            lang.internal.auditLog.reasons.new,
                            {
                                parentID: category.id,
                            }
                        )
                        .catch(err => console.error(err));
                    LOGGER.debug(`new Channel(${newname})`);
                }
                let edit = {bitrate: channel.bitrate, name, userLimit: locked ? userCount : 0};
                if ((locked && channel.userLimit != userCount) || channel.name != name) {
                    channel.edit(edit, lang.internal.auditLog.reasons.edit);
                    LOGGER.debug(`[${channel.name}].edit(${JSON.stringify(edit)})`);
                }
            } else {
                if (userCount < 1) {
                    this.bot
                        .deleteChannel(channel.id, lang.internal.auditLog.reasons.delete)
                        .catch(err => console.error(err));
                    LOGGER.debug(`[${channel.name}].delete()`);
                } else {
                    let edit = {bitrate: channel.bitrate, name, userLimit: locked ? userCount : 0};
                    if ((locked && channel.userLimit != userCount) || channel.name != name) {
                        channel.edit(edit, lang.internal.auditLog.reasons.edit);
                        LOGGER.debug(`[${channel.name}].edit(${JSON.stringify(edit)})`);
                    }
                    pos++;
                }
            }
        }
    }
}

new Main();

export const projectRoot = require("path").join(__dirname, "..");
import Eris from "eris";
import {GuildModel, catDefault, tcDefault, catSchema, tcSchema} from "./Database/models";
import {EventCompressor} from "./Util/EventCompressor";
import {LANG} from "./Language/all";
import {Logger} from "./Util/Logger";
import {StringGenerator} from "./Util/StringGen";
import {DatabaseManager} from "./Database/Manager";
import {CommandManager, parsedCom} from "./Command/Manager";
import {WebServer} from "./Web/Server";
import {highestOccurrence} from "./Util/Functions";
import {ApiLimitCache} from "./Util/ApiLimitCache";
require("dotenv").config();
const LOGGER = new Logger(__filename);

export class Main {
    static instance: Main;
    bot: Eris.Client;
    ec: EventCompressor;
    sg: StringGenerator;
    dbm: DatabaseManager;
    cm: CommandManager;
    ws: WebServer;
    alc: ApiLimitCache;

    constructor() {
        if (!process.env.TOKEN) throw new Error("Missing login token.");

        LOGGER.log("Starting ...");

        this.bot = Eris(process.env.TOKEN, {
            intents: [
                "guilds",
                "guildVoiceStates",
                "guildPresences",
                "guildMessages",
                "guildMessageReactions",
                "guildVoiceStates",
                "guildMembers",
            ],
        });

        this.ec = new EventCompressor();
        this.sg = new StringGenerator();
        this.dbm = new DatabaseManager();
        this.cm = new CommandManager();
        this.ws = new WebServer();
        this.alc = new ApiLimitCache();

        this.bot.on("ready", () => {
            LOGGER.log("... Discord Ready!");
        });
        this.bot.on("error", err => LOGGER.error(err));

        // Load command modules
        this.bot.once("ready", () => {
            this.cm.loadModules();
        });

        // Voice channel update
        this.bot.on("voiceChannelJoin", (_m, c) => this.voiceChannelUpdate(c));
        this.bot.on("voiceChannelLeave", (_m, c) => this.voiceChannelUpdate(c));
        this.bot.on("voiceChannelSwitch", (_m, c, oc) => {
            this.voiceChannelUpdate(c);
            this.voiceChannelUpdate(oc);
        });
        this.alc.on("channelLimitExpires", (cid, callsLeft) => {
            // If callsLeft is negative then there have been calls that could not be executed.
            if (callsLeft < 0) {
                var c = this.bot.getChannel(cid);
                if (!c) return;
                setImmediate(() => (c.type == 2 ? this.voiceChannelUpdate(c) : null));
            }
        });
        // TODO: Remove debug update trigger
        this.bot.on("voiceStateUpdate", m => {
            if (m.voiceState.channelID) {
                var c = this.bot.getChannel(m.voiceState.channelID);
                if (c.type == 2) this.voiceChannelUpdate(c);
            }
        });

        this.bot.on("messageCreate", m => this.messageRecieved(m));

        this.bot.connect();
        Main.instance = this;
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
            // Stop if limit is reached.
            if (catInfo.channelLimit > 0 && pos >= catInfo.channelLimit) break;

            // Some basic info about the channel that is parsed
            var channel = channels[i];
            var userCount = channel.voiceMembers.size;
            var locked = (channel.userLimit || 0) == 1;
            var editsLeft = this.alc.getLimit("channel", channel.id);

            // The name that the channel should have
            var name = this.sg
                .build(
                    {
                        pos,
                        locked,
                        userCount: userCount,
                        isEven: (number: string) => parseInt(number) % 2 == 0,
                        hasMember: (id: string) =>
                            channel.voiceMembers.find(m => m.id == id) ? true : false,
                        mostPlayedGame: () => {
                            let n = highestOccurrence(
                                channel.voiceMembers.map(m =>
                                    m.activities && m.activities.length > 0
                                        ? m.activities[0].name
                                        : null
                                )
                            );
                            return n ? n : "";
                        },
                    },
                    catInfo.namingRule
                )
                .trim()
                .substr(0, 100);

            //---- If last channel
            if (i == channels.length - 1) {
                if (userCount > 0) {
                    // Create a new channel
                    let newname = this.sg
                        .build(
                            {
                                pos: pos + 1,
                                locked: false,
                                userCount: 0,
                                hasMember: () => false,
                                mostPlayedGame: () => "",
                            },
                            catInfo.namingRule
                        )
                        .trim()
                        .substr(0, 100);
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

                // Edit channel
                let edit = {
                    bitrate: channel.bitrate,
                    name,
                    userLimit: locked ? 1 : catInfo.channelUserLimit,
                };
                if (
                    channel.bitrate != edit.bitrate ||
                    channel.userLimit != edit.userLimit ||
                    channel.name != edit.name
                ) {
                    if (editsLeft > 0) {
                        channel.edit(edit, lang.internal.auditLog.reasons.edit);
                        LOGGER.debug(
                            `[${channel.name}].edit(${JSON.stringify(
                                edit
                            )}) apiCallsLeft: ${this.alc.edit(channel.id)}`
                        );
                    } else {
                        LOGGER.warn(
                            `[${channel.name}].edit(${JSON.stringify(
                                edit
                            )}) apiCallsLeft: ${this.alc.edit(channel.id)}`
                        );
                    }
                }

                // If not last channel
            } else {
                //---- If empty
                if (userCount < 1) {
                    // Delete channel
                    if (editsLeft > 0) {
                        this.bot
                            .deleteChannel(channel.id, lang.internal.auditLog.reasons.delete)
                            .catch(err => console.error(err));
                        LOGGER.debug(
                            `[${channel.name}].delete() apiCallsLeft: ${this.alc.delete(
                                channel.id
                            )}`
                        );
                    } else {
                        LOGGER.warn(
                            `[${channel.name}].delete() apiCallsLeft: ${this.alc.delete(
                                channel.id
                            )}`
                        );
                    }

                    // If not empty
                } else {
                    // Edit channel
                    let edit = {
                        bitrate: channel.bitrate,
                        name,
                        userLimit: locked ? 1 : catInfo.channelUserLimit,
                    };
                    if (
                        channel.bitrate != edit.bitrate ||
                        channel.userLimit != edit.userLimit ||
                        channel.name != edit.name
                    ) {
                        if (editsLeft > 0) {
                            channel.edit(edit, lang.internal.auditLog.reasons.edit);
                            LOGGER.debug(
                                `[${channel.name}].edit(${JSON.stringify(
                                    edit
                                )}) apiCallsLeft: ${this.alc.edit(channel.id)}`
                            );
                        } else {
                            LOGGER.warn(
                                `[${channel.name}].edit(${JSON.stringify(
                                    edit
                                )}) apiCallsLeft: ${this.alc.edit(channel.id)}`
                            );
                        }
                    }
                    pos++;
                }
            }
        }
    }
}

new Main();

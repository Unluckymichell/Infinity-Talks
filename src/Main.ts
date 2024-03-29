export const projectRoot = require("path").join(__dirname, "..");
import Eris from "eris";
import {getEnsureGuildInfo} from "./Database/models/GuildSchema";
import {getEnsureCatInfo} from "./Database/models/catSchema";
import {EventCompressor} from "./Util/classes/EventCompressor";
import {LANG} from "./Language/all";
import {LOGGER, init as loggerInit} from "./Util/classes/Logger";
import {StringGenerator} from "./Util/classes/StringGen";
import {DatabaseManager} from "./Database/Manager";
import {WebServer} from "./Web/Server";
import {highestOccurrence} from "./Util/functions/other";
import {ApiLimitCache} from "./Util/classes/ApiLimitCache";
import {CommandHandler} from "./Commands/CommandHandler";
require("dotenv").config();
loggerInit({projectPath: projectRoot, outFile: "./out.log", useStdout: true});

export class Main {
    static instance: Main;

    ch: CommandHandler;
    bot: Eris.Client;
    ec: EventCompressor;
    dbm: DatabaseManager;
    ws: WebServer;
    alc: ApiLimitCache;

    constructor() {
        if (!process.env.TOKEN) throw new Error("Missing login token.");
        Main.instance = this;

        LOGGER.log("Starting ...");

        this.bot = Eris(process.env.TOKEN, {
            intents: ["guilds", "guildVoiceStates", "guildPresences", "guildMessages", "guildMessageReactions", "guildVoiceStates", "guildMembers"],
        });

        this.ec = new EventCompressor();
        this.dbm = new DatabaseManager();
        this.ws = new WebServer();
        this.alc = new ApiLimitCache();
        this.ch = new CommandHandler();

        this.bot.on("ready", () => {
            LOGGER.log("... Discord Ready!");
        });
        this.bot.on("error", err => LOGGER.error(err));

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

        // Commands and Windows
        this.bot.on("messageCreate", m => this.ch.onDiscordMessage(m));
        this.bot.on("messageReactionAdd", (m, e, u) => this.ch.onDiscordReaction(m, e, u));

        this.bot.connect();
    }

    async voiceChannelUpdate(ch: Eris.VoiceChannel) {
        const guild = ch.guild;
        if (!ch.parentID) return; // If there is no category, ignore event
        if (!(await this.ec.waitcomp(`vcu#${ch.parentID}`, 300))) return; // Compress spamed Events

        var gInfo = await getEnsureGuildInfo(guild.id);
        var catInfo = await getEnsureCatInfo(gInfo, ch.parentID);
        if (!catInfo.enableInfTalks) return; // Bot is turned off

        var lang = LANG.get(gInfo.language); // Get guild specific language if availabel

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

            // Vars and Functions usable in naming rule
            var usableVars = {
                    pos,
                    locked,
                    userCount,
                },
                usableFuntions = {
                    isEven: (number: string) => parseInt(number) % 2 == 0,
                    hasMember: (id: string) => (channel.voiceMembers.find(m => m.id == id) ? true : false),
                    mostPlayedGame: () => {
                        var games: string[] = [];
                        channel.voiceMembers.forEach(vm => {
                            if (vm.activities && vm.activities.length > 0) {
                                var name = vm.activities[0].name;
                                if (name != "Custom Status") {
                                    games.push(name);
                                }
                            }
                        });
                        let mostPlayedGame = highestOccurrence(games);
                        return mostPlayedGame ? mostPlayedGame : "";
                    },
                };

            // The name that the channel should have
            var name = StringGenerator.build({...usableVars, ...usableFuntions}, catInfo.namingRule)
                .trim()
                .substr(0, 100);

            //---- If last channel
            if (i == channels.length - 1) {
                if (userCount > 0) {
                    // Function and vars overwrite for new channel
                    usableVars = {
                        pos: pos + 1,
                        locked: false,
                        userCount: 0,
                    };
                    usableFuntions = {
                        isEven: (number: string) => parseInt(number) % 2 == 0,
                        hasMember: () => false,
                        mostPlayedGame: () => "",
                    };
                    // Create a new channel
                    let newname = StringGenerator.build({...usableVars, ...usableFuntions}, catInfo.namingRule)
                        .trim()
                        .substr(0, 100);
                    this.bot
                        .createChannel(channel.guild.id, newname, 2, lang.internal.auditLog.reasons.new, {
                            parentID: category.id,
                        })
                        .catch(err => LOGGER.error(err));
                    LOGGER.debug(`new Channel(${newname})`);
                }

                // Edit channel if necessary
                let edit = {
                    bitrate: channel.bitrate,
                    name: name ? name : "[EMPTY]",
                    userLimit: locked ? 1 : catInfo.channelUserLimit,
                };
                if (channel.bitrate != edit.bitrate || channel.userLimit != edit.userLimit || channel.name != edit.name) {
                    if (editsLeft > 0) {
                        channel.edit(edit, lang.internal.auditLog.reasons.edit);
                        LOGGER.debug(`[${channel.name}].edit(${JSON.stringify(edit)}) apiCallsLeft: ${this.alc.edit(channel.id)}`);
                    } else {
                        LOGGER.warn(`[${channel.name}].edit(${JSON.stringify(edit)}) apiCallsLeft: ${this.alc.edit(channel.id)}`);
                    }
                }

                // If not last channel
            } else {
                if (userCount < 1) {
                    // Delete channel if necessary
                    if (editsLeft > 0) {
                        this.bot.deleteChannel(channel.id, lang.internal.auditLog.reasons.delete).catch(err => LOGGER.error(err));
                        LOGGER.debug(`[${channel.name}].delete() apiCallsLeft: ${this.alc.delete(channel.id)}`);
                    } else {
                        LOGGER.warn(`[${channel.name}].delete() apiCallsLeft: ${this.alc.delete(channel.id)}`);
                    }
                } else {
                    // Edit channel if necessary
                    let edit = {
                        bitrate: channel.bitrate,
                        name: name ? name : "[EMPTY]",
                        userLimit: locked ? 1 : catInfo.channelUserLimit,
                    };
                    if (channel.bitrate != edit.bitrate || channel.userLimit != edit.userLimit || channel.name != edit.name) {
                        if (editsLeft > 0) {
                            channel.edit(edit, lang.internal.auditLog.reasons.edit);
                            LOGGER.debug(`[${channel.name}].edit(${JSON.stringify(edit)}) apiCallsLeft: ${this.alc.edit(channel.id)}`);
                        } else {
                            LOGGER.warn(`[${channel.name}].edit(${JSON.stringify(edit)}) apiCallsLeft: ${this.alc.edit(channel.id)}`);
                        }
                    }
                    pos++;
                }
            }
        }
    }
}

new Main();

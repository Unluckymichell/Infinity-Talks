export const projectRoot = require("path").join(__dirname, "..");
import Eris from "eris";
import {CategorySchema, GuildModel} from "./Database/models";
import {EventCompressor} from "./Util/EventCompressor";
import {LANG} from "./Language/all";
import {Logger} from "./Util/Logger";
import {ChannelNameGenerator} from "./Util/ChannelNameGen";
import {DatabaseManager} from "./Database/Manager";
require("dotenv").config();
const LOGGER = new Logger(__filename);

class Main {
    bot: Eris.Client;
    ec: EventCompressor;
    cng: ChannelNameGenerator;
    dbm: DatabaseManager;

    constructor() {
        if (!process.env.TOKEN) throw new Error("Missing login token.");
        this.bot = Eris(process.env.TOKEN);
        this.ec = new EventCompressor();
        this.cng = new ChannelNameGenerator();
        this.dbm = new DatabaseManager();

        LOGGER.log("Connecting...");
        this.bot.on("ready", () => LOGGER.log("Ready"));
        this.bot.on("error", err => LOGGER.error(err));

        this.bot.on("voiceChannelJoin", (_m, c) => this.voiceChannelUpdate(c));
        this.bot.on("voiceChannelSwitch", (_m, c, oc) => {
            this.voiceChannelUpdate(c);
            this.voiceChannelUpdate(oc);
        });
        this.bot.on("voiceChannelLeave", (_m, c) => this.voiceChannelUpdate(c));

        this.bot.connect();
    }

    async voiceChannelUpdate(ch: Eris.VoiceChannel) {
        const guild = ch.guild;
        if (!ch.parentID) return; // If there is no category, ignore event
        if (!(await this.ec.waitcomp(`vcu#${ch.parentID}`, 100))) return; // Compress spamed Events

        var gInfo = await GuildModel.findOne({_dcid: guild.id}); // Request guild information from db
        if (!gInfo) gInfo = await new GuildModel({_dcid: guild.id}).save(); // Save default if not found

        var catInfo = gInfo.categorys.find(c => c._dcid == ch.parentID); // Find category information from guild information
        if (!catInfo) return; // If there is no info, ignor event

        var lang = LANG["default"]; // Use default language
        if (Object.prototype.hasOwnProperty.call(LANG, gInfo.language))
            var lang = LANG[gInfo.language]; // Switch to guild specific if availabel

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
        for (var i = 0; i < channels.length; i++) {
            const channel = channels[i];
            const userCount = channel.voiceMembers.size;
            const locked = (channel.userLimit || 0) > 0;
            const name = this.cng.build(
                {pos: pos, num: pos, l: locked, ul: !locked},
                catInfo.namingRule
            );
            if (i == channels.length - 1) {
                if (userCount > 0) {
                    const newname = this.cng.build(
                        {pos: pos + 1, num: pos + 1, l: false, ul: true},
                        catInfo.namingRule
                    );
                    this.bot
                        .createChannel(channel.guild.id, newname, 2, "Talk Bot", {
                            parentID: category.id,
                        })
                        .catch(err => console.error(err));
                }
                if (locked && userCount != channel.userLimit) channel.edit({userLimit: userCount});
                if (channel.name != name) channel.edit({name});
            } else {
                if (userCount < 1) {
                    this.bot.deleteChannel(channel.id).catch(err => console.error(err));
                    continue;
                } else {
                    if (locked && userCount != channel.userLimit)
                        channel.edit({userLimit: userCount});
                    if (channel.name != `${pos}`) channel.edit({name: `${pos}`});
                    pos++;
                }
            }
        }
    }
}

new Main();

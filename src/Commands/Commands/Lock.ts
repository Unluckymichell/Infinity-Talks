import {Message} from "eris";
import {catDefault, catSchema, GuildModel, tcSchema} from "../../Database/models";
import {language} from "../../Language/all";
import {Main} from "../../Main";
import {SimpleCommand} from "../Classes";
import {carg, CommandHandler} from "../CommandHandler";

class LockCommand extends SimpleCommand {
    command = "lock";
    async trigger(message: Message, args: carg[], lang: language, gInfo: GuildModel, tcInfo: tcSchema, admin: boolean): Promise<void | Error> {
        // Not in voice Channel
        if (!message.member?.voiceState.channelID) {
            message.channel.createMessage(lang.commands.guild.lock.notInVoiceChannel);
            return;
        }

        // Get voice channel
        var voiceChannel = Main.instance.bot.getChannel(message.member.voiceState.channelID);
        if (voiceChannel.type != 2) return new Error("Voice channel is not Voice channel!!!");

        // Check if voice channel has category
        if (!voiceChannel.parentID) {
            message.channel.createMessage(lang.commands.guild.lock.notEnabled);
            return;
        }

        // Get category info
        var catInfo: catSchema | null = gInfo.categorys.find(c => voiceChannel.type == 2 && c._dcid == voiceChannel.parentID); // Find category information from guild information
        if (!catInfo) {
            // Save default if not found
            catInfo = catDefault({_dcid: voiceChannel.parentID});
            gInfo.categorys.push(catInfo);
            await gInfo.save();
        }

        // Bot is turned off
        if (!catInfo.enableInfTalks || !catInfo.allowLock) {
            message.channel.createMessage(lang.commands.guild.lock.notEnabled);
            return;
        }

        // Already locked
        if (voiceChannel.userLimit == 1) {
            message.channel.createMessage(lang.commands.guild.lock.alreadyLocked);
            return;
        } else {
            // Do lock
            await voiceChannel.edit({userLimit: 1});
            message.channel.createMessage(lang.commands.guild.lock.success);
            Main.instance.bot.emit("voiceChannelJoin", message.member, voiceChannel);
        }
    }
}

CommandHandler.registerCommand(new LockCommand());

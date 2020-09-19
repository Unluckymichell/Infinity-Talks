import Eris, {Channel} from "eris";
import {EventCompressor} from "./EventCompressor";

const ec = new EventCompressor();
const bot = Eris("NjA4MzQ5NTA5MDI1NzkyMDE4.XUm3oQ.v-6nMW4c7jMAVr304kQ5xTawMKA");

bot.on("voiceChannelJoin", (m, c) => ec.compress("voiceChannelUpdate", m.guild.id, c, 10));
bot.on("voiceChannelLeave", (m, c) => ec.compress("voiceChannelUpdate", m.guild.id, c, 10));
bot.on("voiceChannelSwitch", (m, c) => ec.compress("voiceChannelUpdate", m.guild.id, c, 10));
ec.on("voiceChannelUpdate", data => {
    voiceChannelUpdate(data[0]);
});

function voiceChannelUpdate(c: Eris.VoiceChannel, nc?: Eris.VoiceChannel) {
    const channel = c || nc;
    if (channel.type != 2 || !channel.parentID) return;
    const category = bot.getChannel(channel.parentID);
    if (category.type == 4) {
        const channels: Eris.VoiceChannel[] = [];
        for (const c of category.channels.values()) {
            if (c.type == 2) channels.push(c);
        }
        channels.sort((a, b) => a.position - b.position);
        channelAlgorithm(category, channels);
    }
}

async function channelAlgorithm(category: Eris.CategoryChannel, channels: Eris.VoiceChannel[]) {
    var pos = 1;
    for (var i = 0; i < channels.length; i++) {
        const channel = channels[i];
        const userCount = channel.voiceMembers.size;
        if (i == channels.length - 1) {
            if (userCount > 0) {
                bot.createChannel(channel.guild.id, `${pos + 1}`, 2, "Talk Bot", {
                    parentID: category.id,
                }).catch(err => console.error(err));
            }
            if (channel.name != `${pos}`) channel.edit({name: `${pos}`});
        } else {
            if (userCount < 1) {
                bot.deleteChannel(channel.id).catch(err => console.error(err));
                continue;
            } else {
                if (channel.name != `${pos}`) channel.edit({name: `${pos}`});
                pos++;
            }
        }
    }
}

bot.connect();

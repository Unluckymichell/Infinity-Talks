import Eris from "eris";
import {getEnsureCatInfo} from "./Database/models/catSchema";
import {getEnsureGuildInfo} from "./Database/models/GuildSchema";
import {LANG} from "./Language/all";
import {LOGGER} from "./Util/classes/Logger";

export async function processVoiceChannels(bot: Eris.Client, category: Eris.CategoryChannel) {
    // Some litle short writings
    const guild = category.guild;

    // Fetch important info from db
    var gInfo = await getEnsureGuildInfo(guild.id);
    var catInfo = await getEnsureCatInfo(gInfo, category.id);

    // Bot is turned off
    if (!catInfo.enableInfTalks) return;

    // Use guild specific language
    var lang = LANG.get(gInfo.language);

    // Reorganize and filter channels
    const channels: Eris.VoiceChannel[] = [];
    for (const c of category.channels.values()) {
        if (c.type == 2) channels.push(c);
    }
    channels.sort((a, b) => a.position - b.position);

    // Start processing channels
    var actionsToTake = [];
    // for() {
    // }
}

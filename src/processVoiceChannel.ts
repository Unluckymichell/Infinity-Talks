import Eris from "eris";
import {LANG} from "./Language/all";
import {getEnsureCatInfoDb} from "./Util/functions/database";
import {LOGGER} from "./Util/classes/Logger";

export async function processVoiceChannels(bot: Eris.Client, category: Eris.CategoryChannel) {
    // Some litle short writings
    const guild = category.guild;

    // Fetch important info from db
    var {catInfo, gInfo} = await getEnsureCatInfoDb(guild.id, category.id);

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

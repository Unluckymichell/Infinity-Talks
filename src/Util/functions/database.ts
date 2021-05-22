import {GuildModel} from "../../Database/models/GuildSchema";
import {catDefault, catSchema} from "../../Database/models/catSchema";
import {tcDefault, tcSchema} from "../../Database/models/tcSchema";

export async function getEnsureCatInfoDb(guildId: string, catId: string) {
    var gInfo = await GuildModel.findOne({_dcid: guildId}); // Request guild information from db
    if (!gInfo) gInfo = await new GuildModel({_dcid: guildId}).save(); // Save default if not found

    var catInfo: catSchema | null = gInfo.categorys.find(c => c._dcid == catId) || null; // Find category information from guild information
    if (!catInfo) {
        // Save default if not found
        catInfo = catDefault({_dcid: catId});
        gInfo.categorys.push(catInfo);
        await gInfo.save();
    }

    return {gInfo, catInfo};
}

export async function getEnsureTcInfoDb(guildId: string, channelId: string) {
    var gInfo = await GuildModel.findOne({_dcid: guildId}); // Request guild information from db
    if (!gInfo) gInfo = await new GuildModel({_dcid: guildId}).save(); // Save default if not found

    var tcInfo: tcSchema | null = gInfo.textChannels.find(c => c._dcid == channelId) || null; // Find category information from guild information
    if (!tcInfo) {
        // Save default if not found
        tcInfo = tcDefault({_dcid: channelId});
        gInfo.textChannels.push(tcInfo);
        await gInfo.save();
    }

    return {gInfo, tcInfo};
}

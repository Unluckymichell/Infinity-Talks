import {GuildModel} from "../../Database/models/GuildSchema";
import {catDefault, catSchema} from "../../Database/models/catSchema";

export async function getEnsureCatInfoDb(guildId: string, catId: string) {
    var gInfo = await GuildModel.findOne({_dcid: guildId}); // Request guild information from db
    if (!gInfo) gInfo = await new GuildModel({_dcid: guildId}).save(); // Save default if not found

    var catInfo: catSchema | null = gInfo.categorys.find(c => c._dcid == catId); // Find category information from guild information
    if (!catInfo) {
        // Save default if not found
        catInfo = catDefault({_dcid: catId});
        gInfo.categorys.push(catInfo);
        await gInfo.save();
    }

    return {gInfo, catInfo};
}

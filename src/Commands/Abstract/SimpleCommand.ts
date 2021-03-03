import {Message} from "eris";
import {GuildModel} from "../../Database/models/GuildSchema";
import {tcSchema} from "../../Database/models/tcSchema";
import {language} from "../../Language/all";
import {carg, HandlerResponse} from "../CommandHandler";

export abstract class SimpleCommand {
    abstract command: string;

    async onDiscordCommand(
        message: Message,
        command: carg,
        args: carg[],
        lang: language,
        gInfo: GuildModel,
        tcInfo: tcSchema,
        admin: boolean
    ): Promise<HandlerResponse> {
        if (this.command == command.val) {
            var err = await this.trigger(message, args, lang, gInfo, tcInfo, admin);
            return {handled: true, error: err ? err.message : undefined};
        } else return {handled: false};
    }

    abstract trigger(message: Message, args: carg[], lang: language, gInfo: GuildModel, tcInfo: tcSchema, admin: boolean): Promise<void | Error>;
}

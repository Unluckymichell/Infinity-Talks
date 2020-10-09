import mongoose from "mongoose";
import {Logger} from "../Util/Logger";
import {GuildModel} from "./models";
const LOGGER = new Logger(__filename);

export class DatabaseManager {
    con: mongoose.Connection;

    constructor() {
        mongoose.connect(process.env.DBURL || "mongodb://localhost/infinitytalks", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
        });
        this.con = mongoose.connection;
        this.con.on("error", error => console.error(error));
        this.con.on("open", async () => {
            LOGGER.log("... DB Ready");
            if (process.argv.find(arg => arg.replace(/--/gi, "-") == "-dropDb"))
                this.con.db.dropDatabase();

            /*(async () => {
                var test = await new GuildModel({_dcid: "445980619483119616"});
                var cat = {
                    _dcid: "759524209772068867",
                };
                if (test) test.categorys.push(cat);
                test?.save();
            })();*/
        });
    }
}
import mongoose from "mongoose";
import {LOGGER} from "../Util/Logger";

export class DatabaseManager {
    con: mongoose.Connection;

    constructor() {
        LOGGER.log(
            `Connecting to ${
                !process.env.DBURL
                    ? "default mongodb://localhost/infinitytalks! Specify env var DBURL to change"
                    : process.env.DBURL
            }`
        );
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
        });
    }
}

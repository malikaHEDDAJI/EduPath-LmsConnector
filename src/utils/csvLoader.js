import fs from "fs";
import csv from "csv-parser";

export function loadCSV(path) {
    return new Promise((resolve) => {
        const rows = [];

        fs.createReadStream(path)
            .pipe(csv())
            .on("data", (data) => rows.push(data))
            .on("end", () => resolve(rows));
    });
}

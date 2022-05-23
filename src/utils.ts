import { format } from "date-fns";
import fs from "fs";
import { parse } from "fast-csv";
import * as path from "path";
import stringify from "csv-stringify";

export const readCsvSource = (pathFile: string): Promise<any[]> => {
  return new Promise(function (resolve, reject) {
    const registersCrc = [];
    fs.createReadStream(path.resolve(__dirname, pathFile))
      .pipe(parse({ headers: true, delimiter: ";" }))
      .on("error", (error) => {
        console.log("readCsvSource error", error);
        reject;
      })
      .on("data", (row) => {
        if (row && row["REGISTRO"].includes("PI")) {
          registersCrc.push(row);
        }
      })
      .on("end", (rowCount: number) => {
        console.log(`Parsed ${rowCount} rows`);
        console.log(`Filtered rows ${registersCrc.length}`);
        resolve(registersCrc);
      });
  });
};

export const readCsvResult = (pathFile: string): Promise<any[]> => {
  return new Promise(function (resolve, reject) {
    const registersCrc = [];
    fs.createReadStream(path.resolve(__dirname, pathFile))
      .pipe(parse({ headers: true, delimiter: "," }))
      .on("error", (error) => reject)
      .on("data", (row) => {
        registersCrc.push(row);
      })
      .on("end", (rowCount: number) => {
        console.log(`Parsed ${rowCount} rows`);
        resolve(registersCrc);
      });
  });
};

export const writeCsv = (values: any[], fileName: string): void => {
  stringify(
    values,
    {
      header: true,
    },
    function (err, output) {
      fs.writeFile(`./csv/${fileName}`, output, (err) => {
        if (err) {
          console.error(err);
          return;
        }
      });
    }
  );
};

export const countCsvFiles = (pathFolder: string): number => {
  return fs.readdirSync(pathFolder).length;
};

export const mergeAllCsvs = async (pathFolder: string) => {
  const csvFiles = fs.readdirSync(pathFolder);
  const rowsFinal = [];

  const count = {
    active: 0,
    notActive: 0,
  };

  if (csvFiles.length > 0) {
    for (let index = 0; index < csvFiles.length; index++) {
      const rows = await readCsvResult(
        `./../csv/${format(new Date(), "yyyy-MM-dd")}/${csvFiles[index]}`
      );

      rows.map((row) => {
        if (row["active"] === "1") {
          count.active++;
        } else {
          count.notActive++;
        }
      });

      rowsFinal.push(...rows);
    }
  }

  if (rowsFinal.length > 0) {
    console.log("count", count);
    writeCsv(
      rowsFinal,
      `${format(
        new Date(),
        "yyyy-MM-dd"
      )}/results-final-${new Date().getTime()}.csv`
    );
  }
};

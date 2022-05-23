import { format } from "date-fns";
import puppeteer, { Browser } from "puppeteer";
import { readCsvSource, writeCsv, countCsvFiles, mergeAllCsvs } from "./utils";

let browser: Browser;
const timeout = 2000;
const batchSize = 50;
const cookie = "ASP.NET_SessionId=czlqtyztkjxqakxwpyajr4jw";

const selectors = {
  input:
    'input[id="ContentPlaceHolder1_ASPxRoundPanel1_txtnumregistrocertificado_I"]',
  submit: 'div[id="ContentPlaceHolder1_ASPxRoundPanel1_btnConsultar"]',
  nextPage: 'span[id="ContentPlaceHolder1_lblimpressao"]',
  cpf: "div#conteudo table td table:nth-child(3) tbody tr:nth-child(4)",
};

(async () => {
  // mergeAllCsvs(`./csv/${format(new Date(), "yyyy-MM-dd")}`);

  console.log(`Verificando ...`);
  let registersCrc = await readCsvSource("../dados-crc-pi-irregulares.csv");
  browser = await puppeteer.launch();

  const count = countCsvFiles(`./csv/${format(new Date(), "yyyy-MM-dd")}`);
  registersCrc.splice(0, batchSize * count);

  while (registersCrc.length > 0) {
    console.log("------ registersCrc", registersCrc.length);
    console.time("process1");
    var batch = registersCrc.splice(0, batchSize);
    await processingBot(batch);
    console.timeEnd("process1");
  }

  await browser.close();
})();

const processingBot = async (batch: any[]): Promise<void> => {
  const results = [];
  for (let index = 0; index < batch.length; index++) {
    const code = batch[index]["REGISTRO"]
      .replace("PI-", "")
      .replace("/O", "")
      .replace("/P", "");
    console.log(`${code} ...`);

    if (code) {
      const page = await browser.newPage();
      await page.setExtraHTTPHeaders({
        cookie: cookie,
      });
      await page.goto(
        "https://boleto.crcpi.org.br/spwpi/ConsultaCadastral/CertidaoExterna.aspx",
        { waitUntil: "load" }
      );

      await page.waitForSelector(selectors.input);
      await page.$eval(
        selectors.input,
        (el: HTMLInputElement, code: string) => {
          return (el.value = code);
        },
        code
      );

      try {
        await Promise.all([
          page.click(selectors.submit),
          page.waitForNavigation({
            waitUntil: "networkidle2",
            timeout: timeout,
          }),
        ]);
      } catch (e) {
        results.push({
          code: batch[index]["REGISTRO"],
          cpf: "",
          active: false,
        });
        console.error(e);
        await page.close();
        continue;
      }

      await page.waitForSelector(selectors.nextPage);

      const checkString =
        "CONSELHO REGIONAL DE CONTABILIDADE DO ESTADO DO PIAUÍ";

      const matches = await page.evaluate((value: string) => {
        const text = document.body.innerText;
        return text.includes(value);
      }, checkString);

      if (matches) {
        await page.evaluate((value: string) => {
          const text = document.body.innerText;
          return text.includes(value);
        }, checkString);

        await page.waitForSelector(selectors.cpf);
        let element = await page.$(selectors.cpf);
        let value = await page.evaluate((el) => el.textContent, element);
        const matchesCPF = value.match(
          `[0-9]{3}[\.][0-9]{3}[\.][0-9]{3}[-][0-9]{2}`
        );

        results.push({
          code: batch[index]["REGISTRO"],
          cpf: matchesCPF[0],
          active: true,
        });
        await page.screenshot({
          path: `./screenshots/${format(new Date(), "yyyy-MM-dd")}/${code}.png`,
        });
      }
      await page.close();
    }
  }

  if (results.length > 0) {
    writeCsv(
      results,
      `${format(new Date(), "yyyy-MM-dd")}/results-${new Date().getTime()}.csv`
    );
  }
};

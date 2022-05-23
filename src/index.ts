import { format, getUnixTime } from "date-fns";
import puppeteer, { Browser } from "puppeteer";

let browser: Browser;
const timeout = 2000;
const batchSize = 50;
const cookie = "ASP.NET_SessionId=czlqtyztkjxqakxwpyajr4jw";

const credentials = {
  email: "gdsmonteiro@hotmail.com",
  password: "canada2022",
};

const selectors = {
  inputEmail: 'input[id="user_email"]',
  inputPassword: 'input[id="user_password"]',
  checkBoxPolicyConfirmed: 'input[id="policy_confirmed"]',
  submit: 'input[type="submit"]',
  // nextPage: 'span[id="ContentPlaceHolder1_lblimpressao"]',
  // cpf: "div#conteudo table td table:nth-child(3) tbody tr:nth-child(4)",
};

(async () => {
  console.log(`Acessando página ...`);
  browser = await puppeteer.launch();

  await bot();
  await browser.close();
})();

const bot = async (): Promise<void> => {
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    cookie: cookie,
  });
  await page.goto("https://ais.usvisa-info.com/pt-br/niv/users/sign_in", {
    waitUntil: "load",
  });

  console.log(`Autenticando ...`);

  await page.waitForSelector(selectors.inputEmail);
  await page.$eval(
    selectors.inputEmail,
    (el: HTMLInputElement, code: string) => {
      return (el.value = code);
    },
    credentials.email
  );

  await page.waitForSelector(selectors.inputPassword);
  await page.$eval(
    selectors.inputPassword,
    (el: HTMLInputElement, code: string) => {
      return (el.value = code);
    },
    credentials.password
  );
  await page.click(selectors.checkBoxPolicyConfirmed);

  try {
    await Promise.all([
      page.click(selectors.submit),
      page.waitForNavigation({
        waitUntil: "networkidle2",
        timeout: timeout,
      }),
    ]);
  } catch (e) {
    console.error(e);
    await page.close();
  }

  await printscreen(page);

  await page.close();
};

const printscreen = async (page: puppeteer.Page) => {
  await page.screenshot({
    path: `./screenshots/${format(new Date(), "yyyy-MM-dd")}/${getUnixTime(
      new Date()
    )}.png`,
  });
};

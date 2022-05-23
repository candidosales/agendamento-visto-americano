import { format, getUnixTime } from "date-fns";
import puppeteer, { Browser } from "puppeteer";

let browser: Browser;
const timeout = 3000;

const credentials = {
  email: "gdsmonteiro@hotmail.com",
  password: "canada2022",
};

const selectors = {
  loginForm: {
    inputEmail: 'input[id="user_email"]',
    inputPassword: 'input[id="user_password"]',
    checkBoxPolicyConfirmed: 'input[id="policy_confirmed"]',
    submit: 'input[type="submit"]',
  },
  profilePage: {
    continueButton: "a.button.primary",
  },
  bookingPage: {
    firstAccordionItem: "ul.accordion>li",
    makeAppointmentButton: "a.button.small.primary.small-only-expanded",
  },
  appointmentPage: {
    selectCity: 'select[id="appointments_consulate_appointment_facility_id"]',
    inputDate: 'input[id="appointments_consulate_appointment_date"]',
    datepicker: 'div[id="ui-datepicker-div"]',
    tableDatepicker: "table.ui-datepicker-calendar",
    datesAvailable: 'table.ui-datepicker-calendar td[data-handler="selectDay"]',
  },
};

(async () => {
  console.log(`Acessando página ...`);
  browser = await puppeteer.launch();

  await bot();
  await browser.close();
})();

const bot = async (): Promise<void> => {
  const page = await browser.newPage();
  await page.goto("https://ais.usvisa-info.com/pt-br/niv/users/sign_in", {
    waitUntil: "load",
  });

  console.log(`Autenticando ...`);

  await page.waitForSelector(selectors.loginForm.inputEmail);
  await page.$eval(
    selectors.loginForm.inputEmail,
    (el: HTMLInputElement, code: string) => {
      return (el.value = code);
    },
    credentials.email
  );

  await page.waitForSelector(selectors.loginForm.inputPassword);
  await page.$eval(
    selectors.loginForm.inputPassword,
    (el: HTMLInputElement, code: string) => {
      return (el.value = code);
    },
    credentials.password
  );
  await page.click(selectors.loginForm.checkBoxPolicyConfirmed);

  try {
    console.log(`Enviar form ...`);

    await Promise.all([
      page.click(selectors.loginForm.submit),
      page.waitForNavigation({
        waitUntil: "networkidle2",
        timeout: timeout,
      }),
    ]);
  } catch (e) {
    console.error(e);
    await page.close();
  }

  console.log(`Página de perfil ...`);

  await page.waitForSelector(selectors.profilePage.continueButton);
  await Promise.all([
    page.click(selectors.profilePage.continueButton),
    page.waitForNavigation({
      waitUntil: "networkidle2",
      timeout: timeout,
    }),
  ]);

  console.log(`Página de agendamento ...`);
  await page.waitForSelector(selectors.bookingPage.firstAccordionItem);
  await page.click(selectors.bookingPage.firstAccordionItem);

  await Promise.all([
    page.click(selectors.bookingPage.makeAppointmentButton),
    page.waitForNavigation({
      waitUntil: "networkidle2",
      timeout: timeout,
    }),
  ]);

  console.log(`Página de agendamento entrevista ...`);
  await page.waitForSelector(selectors.appointmentPage.selectCity);

  // 54 Brasília - 128 Porto Alegre - 57 Recife - 55 Rio de Janeiro - 56 Sao Paulo
  await page.select(selectors.appointmentPage.selectCity, "57");

  // await Promise.all([
  //   page.select(selectors.appointmentPage.selectCity, "57"),
  //   page.waitForNavigation({
  //     waitUntil: "networkidle2",
  //     timeout: timeout,
  //   }),
  // ]);

  // await page.evaluate((selectors) => {
  //   const example = document.querySelector(
  //     selectors.appointmentPage.selectCity
  //   );
  //   const example_options = example.querySelectorAll("option");
  //   let selected_option;

  //   example_options.forEach((option) => {
  //     if (option.text === "Recife") {
  //       selected_option = option;
  //     }
  //   });

  //   if (selected_option) {
  //     selected_option.selected = true;
  //   }
  // }, selectors);

  // await page.waitForTimeout(3000);

  // page.evaluate((btnSelector) => {
  //   // this executes in the page
  //   document.querySelector(btnSelector).click();
  // }, selectors.appointmentPage.inputDate);

  await page.waitForSelector(selectors.appointmentPage.inputDate);
  await page.click(selectors.appointmentPage.inputDate);
  await page.waitForSelector(selectors.appointmentPage.datepicker);
  await printscreen(page);

  // const dates = await page.waitForSelector(
  //   selectors.appointmentPage.datesAvailable
  // );

  // console.log("dates", dates);

  await page.close();
};

const printscreen = async (page: puppeteer.Page) => {
  await page.screenshot({
    path: `./screenshots/${format(new Date(), "yyyy-MM-dd")}/${getUnixTime(
      new Date()
    )}.png`,
  });
};

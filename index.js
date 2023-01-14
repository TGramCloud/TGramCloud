const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const sql = require("better-sqlite3");
const child = require("child_process");
const pm2 = require("pm2");

const { EngineFunctions, EngineVariables } = require("./engine.js");
const { CustomFunctions, CustomVariables } = require("./functions.js");

var adminid = "";
const bot = new TelegramBot(EngineVariables.Token, {
  polling: true,
  onlyFirstMatch: true,
});

if (!fs.existsSync("./config/")) {
  fs.mkdirSync("./config/");
}

let settings = new sql("./config/settings.db");

const instance = EngineFunctions.InitInstance(bot, settings);

EngineFunctions.CreateSettingsTable(settings);
EngineFunctions.AddSetting(settings, "cloud_token", "");
EngineFunctions.SetCurrentVersion(child);


bot.onText(/\/login/, (msg) => {
  if (EngineFunctions.CheckFirstRun(settings) === true) CustomFunctions.AuthAccount(instance, msg);
});

bot.onText(/\/logout/, (msg) => {
  CustomFunctions.Logout(instance, msg);
});

bot.onText(/\/update/, (msg) => {
  EngineFunctions.UpdateBot(child, instance, msg);
});
  

bot.on('polling_error', (err) => {
  console.log(err);
});
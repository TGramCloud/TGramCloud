const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const sql = require("better-sqlite3");
const child = require("child_process");
const pm2 = require("pm2");

const token = process.env.TOKEN || process.argv[2];
var adminid = "";
const bot = new TelegramBot(token, {
  polling: true,
  onlyFirstMatch: true,
});

const engine = require("./engine.js");
const functions = require("./functions.js");

if (!fs.existsSync("./config/")) {
  fs.mkdirSync("./config/");
}


var defaultlang = "";
let settings = new sql("./config/settings.db");

const instance = engine.InitInstance(bot, settings);

engine.CreateSettingsTable(settings);
engine.AddSetting(settings, "token", "");

bot.onText(/\/start/, (msg) => {
  if (engine.CheckFirstRun(settings) === true) functions.AuthAccount(instance, msg);
});

bot.on('polling_error', (err) => {
  console.log(err);
});
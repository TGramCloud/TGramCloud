const { EngineDependencies, EngineFunctions, EngineVariables } = require("./engine.js");
const { CustomFunctions, CustomVariables } = require("./functions.js");

var adminid = "";

EngineFunctions.InitInstance("./settings.db");

EngineFunctions.CreateSettingsTable();
EngineFunctions.AddSetting("cloud_token", "");
EngineFunctions.SetCurrentVersion();


EngineVariables.Instance.bot.onText(/\/login/, (msg) => {
  if (EngineFunctions.CheckFirstRun() === true) CustomFunctions.AuthAccount(instance, msg);
});

EngineVariables.Instance.bot.onText(/\/logout/, (msg) => {
  CustomFunctions.Logout(instance, msg);
});

EngineVariables.Instance.bot.onText(/\/update/, (msg) => {
  EngineFunctions.UpdateBot(msg);
});
  

EngineVariables.Instance.bot.on('polling_error', (err) => {
  console.log(err);
});
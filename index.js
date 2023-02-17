const {
  EngineDependencies,
  EngineFunctions,
  EngineVariables,
} = require("./engine.js");
const { CustomFunctions } = require("./functions.js");

var adminid = "";

EngineFunctions.InitInstance("./config/settings.db");

EngineFunctions.CreateSettingsTable();
EngineFunctions.AddSetting("cloud_token", "");
EngineFunctions.AddSetting("cloud_provider", "");
EngineFunctions.SetCurrentVersion();
CustomFunctions.CreateTempDir();

EngineVariables.Instance.bot.onText(/\/login/, (msg) => {
  if (EngineFunctions.CheckFirstRun() === true)
    CustomFunctions.AuthAccount(msg);
});

EngineVariables.Instance.bot.onText(/\/logout/, (msg) => {
  CustomFunctions.Logout(msg);
});

EngineVariables.Instance.bot.onText(/\/update/, (msg) => {
  EngineFunctions.UpdateBot(msg);
});

EngineVariables.Instance.bot.on("polling_error", (err) => {
  console.log(err);
});

const {
  EngineDependencies,
  EngineFunctions,
  EngineVariables,
} = require("./engine.js");
const { CustomFunctions } = require("./functions.js");
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "https://d249f99c4bd745f0bf8877b01395bedd@o4504756755824640.ingest.sentry.io/4504756756873216",
  tracesSampleRate: 1.0,
});

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
  Sentry.captureException(err);
  console.log(err);
});

process.on("unhandledRejection", (error) => {
  Sentry.captureException(error);
  console.error("Error:", error);
});

process.on("uncaughtException", (error) => {
  Sentry.captureException(error);
  console.error("Error:", error);
});

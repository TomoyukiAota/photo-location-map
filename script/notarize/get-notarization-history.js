const runCommandSync = require('../util/run-command-sync');

const getNotarizationHistory = () => {
  const appleId = process.env.APPLE_ID;
  const appSpecificPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD;
  const command = `xcrun altool --notarization-history 0 -u ${appleId} -p ${appSpecificPassword}`;
  runCommandSync(command,
    'Started asking notarization history to Apple...',
    'Finished asking notarization history.');
};

getNotarizationHistory();

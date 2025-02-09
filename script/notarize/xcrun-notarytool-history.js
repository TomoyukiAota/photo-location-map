const runCommandSync = require('../util/run-command-sync');

const xcrunNotarytoolHistory = () => {
  const appleId = process.env.APPLE_ID;
  const appSpecificPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD;
  const teamId = process.env.APPLE_TEAM_ID;
  const command = `xcrun notarytool history --apple-id ${appleId} --password ${appSpecificPassword} --team-id ${teamId}`;
  runCommandSync(command,
    'Running "xcrun notarytool history" command...',
    'Finished running "xcrun notarytool history" command.');
};

xcrunNotarytoolHistory();

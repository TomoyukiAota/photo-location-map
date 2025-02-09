const runCommandSync = require('../util/run-command-sync');

const submissionId = process.argv[2];
if (!submissionId) {
  console.error('Error: Missing the argument for the submission ID.');
  console.error('Usage: npm run notarytool:log -- <submission-id>');
  console.error('Example: npm run notarytool:log -- 12345678-1234-1234-1234-123456789012');
  console.error('To get the submission ID, run "npm run notarytool:history" first.');
  process.exit(1);
}

const xcrunNotarytoolLog = () => {
  const appleId = process.env.APPLE_ID;
  const appSpecificPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD;
  const teamId = process.env.APPLE_TEAM_ID;
  const command = `xcrun notarytool log ${submissionId} --apple-id ${appleId} --password ${appSpecificPassword} --team-id ${teamId}`;
  runCommandSync(command,
    `Running "xcrun notarytool log" command for the submission ID ${submissionId}`,
    `Finished running "xcrun notarytool log" command for the submission ID ${submissionId}`);
};

xcrunNotarytoolLog();

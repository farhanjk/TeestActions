const core = require('@actions/core');
const github = require('@actions/github');
const client = require('firebase-tools');

async function run() {
  try {
    const firebase_app_id = "1:123867269939:android:e30be690339b146d844c46"// core.getInput('APPID');
    const firebase_token = "1//06lBdXEBk6B8uCgYIARAAGAYSNwF-L9IrTgvJSXab3gOoQ6IIvFvbL345MMCP41-zvyMB6rTlWSnW88OwqSdWzQ9l0O7GX8piaJo\n" // core.getInput('FIREBASE_TOKEN');
    const input_file = "/Users/farhankhan/GreenwoodBank/app/build/outputs/apk/dev/debug/app-dev-debug.apk" // core.getInput('FILE');
    // const groups = core.getInput('GROUPS');
    // const testers = core.getInput('TESTERS');
    // const releaseNotes = core.getInput('RELEASENOTES');
    await client.appdistribution.distribute(input_file, {
      app: firebase_app_id,
      token: firebase_token,
      // groups: groups,
      // testers: testers,
      // releaseNotes: releaseNotes
    })
    console.log("Done");
  } catch (error) {
    core.setFailed(error.message);
  }
}

run()

const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
  } catch (error) {
    core.setFailed(error.message);
  }
}

run()

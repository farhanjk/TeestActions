const core = require('@actions/core');

const commitList = (commits) => {
  const filteredCommits = commits.filter((value => value.committer.username !== 'web-flow'))

  const commitInformation = filteredCommits.map((value => {
    return {
      message: value.message || '',
      userTime: `${value.author.name} (${new Date(value.timestamp).toDateString()})`,
    };
  }));

  const commitMessages = () => {
    var prevUserTime = '';

    return commitInformation.flatMap((info) => {
      const formattedMessage = `==> ${info.message}`
      const toReturn = (info.userTime !== prevUserTime ? [info.userTime, formattedMessage] : [formattedMessage]);
      prevUserTime = info.userTime;
      return toReturn;
    });
  }

  return commitMessages();
}

async function run() {
  try {
    const githubContext = core.getInput('github-context');
    if (!githubContext.events || !githubContext.events.commits) {
      core.setFailed('Github Context is Missing events.commits');
    } else {
      core.setOutput('commit-list', commitList(githubContext.events.commits));
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run()

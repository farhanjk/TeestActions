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
    const githubContextString = core.getInput('github-context');
    const githubContext = JSON.parse(githubContextString);
    console.log({ githubContext });
    if (!githubContext.event || !githubContext.event.commits) {
      core.setFailed('Github Context is Missing event.commits');
    } else {
      const list = commitList(githubContext.event.commits);
      console.log(  { list });
      core.setOutput('commit-list', list);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run()

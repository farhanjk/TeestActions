const core = require('@actions/core');
const { Octokit } = require("@octokit/action");
const eventPayload = require(process.env.GITHUB_EVENT_PATH);
const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");

const commitList = (commits) => {
  const filteredCommits = commits.filter((value => value.committer.username !== 'web-flow'))

  const commitInformation = filteredCommits.map((value => {
    return {
      message: value.message || '',
      userTime: `${value.author.name} (${new Date(value.timestamp || value.author.date).toDateString()})`,
    };
  }));

  const commitMessages = () => {
    var prevUserTime = '';

    return commitInformation.flatMap((info) => {
      const formattedMessage = `==> ${info.message}`
      const toReturn = (info.userTime !== prevUserTime ? [info.userTime, formattedMessage] : [formattedMessage]);
      console.log(`I return ${toReturn}`);
      prevUserTime = info.userTime;
      return toReturn;
    });
  }

  return commitMessages();
}

const getCommitsFromPR = async (pull_number) => {
  const octokit = new Octokit();

  let pr = {};
  try {
    pr = await octokit.request("GET /repos/:owner/:repo/pulls/:pull_number/commits{?per_page}", {
      owner,
      repo,
      pull_number,
      per_page: 100,
    });

    return pr.data.map((value => value.commit));
  } catch (error) {
    core.setFailed(`Getting pr for '${pull_number}' failed with error ${error}`);
  }
}

const getCommitsFromTag = async () => {
  const octokit = new Octokit();

  let tags = {};
  try {
    tags = await octokit.request("GET /repos/:owner/:repo/tags", {
      owner,
      repo,
    });
    tags = tags.data;

    if (tags.length >= 2) {
      const tag1 = tags[0];
      const tag2 = tags[1];
      const tag1Name = tag1.name;
      const tag2Name = tag2.name;

      let tagCommits = await octokit.request("GET /repos/:owner/:repo/compare/:tag2Name...:tag1Name{?per_page}", {
        owner,
        repo,
        tag1Name,
        tag2Name,
        per_page: 100,
      });
      tagCommits = tagCommits.data.commits.map((value => value.commit));
      return tagCommits;
    } else {
      return [];
    }
  } catch (error) {
    core.setFailed(`Getting tags for '${repo}' failed with error ${error}`);
  }
}

async function run() {

  try {
    let commits = [];

    const pull_number = eventPayload.pull_request ? eventPayload.pull_request.number : undefined;

    if (pull_number) {
      commits = await getCommitsFromPR(pull_number);
    } else {
      const tag = eventPayload.ref && eventPayload.ref.includes('refs/tags/') && eventPayload.ref.replace('refs/tags/', '');

      if (tag) {
        commits = await getCommitsFromTag();
      }
    }

    if (!commits || commits.length <= 0) {
      commits = (eventPayload && eventPayload.commits) || [];
    }

    const list = commitList(commits);
    core.setOutput('commit-list', list.join('\n'));
  } catch (error) {
    core.setFailed(error.message);
  }
}

run()

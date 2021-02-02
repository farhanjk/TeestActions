const core = require('@actions/core');
const axios = require('axios');
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

async function run() {
  try {
    const githubContextString = core.getInput('github-context');
    const githubContext = JSON.parse(githubContextString);
    console.log({ githubContextString });
    const hasCommits = githubContext.event && githubContext.event.commits;
    console.log(`Has commits is ${hasCommits}`);

    const octokit = new Octokit();
    const tag = eventPayload.ref && eventPayload.ref.includes('refs/tags/') && eventPayload.ref.replace('refs/tags/', '');
    console.log(`tag is ${tag}`);
    // const pull_number = eventPayload.pull_request ? eventPayload.pull_request.number : undefined;
    // console.log(`pull number is ${pull_number}`);

    // let pr = {};
    // try {
    //   pr = await octokit.request("GET /repos/:owner/:repo/pulls/:pull_number/commits", {
    //     owner,
    //     repo,
    //     pull_number,
    //   });
    //   console.log(`${JSON.stringify(pr.data.map((value => value.commit)), null, 2)}`);
    // } catch (error) {
    //   core.setFailed(`Getting pr for '${pull_number}' failed with error ${error}`);
    // }

    let tags = {};
    try {
      tags = await octokit.request("GET /repos/:owner/:repo/tags", {
        owner,
        repo,
      });
      tags = tags.data;
      console.log(`${JSON.stringify(tags, null, 2)}`);
      if (tags.length >= 2) {
        const tag1 = tags[0];
        const tag2 = tags[1];
        const tag1Name = tag1.name;
        const tag2Name = tag2.name;
        console.log(`${JSON.stringify(tag1, null, 2)}`);
        console.log(`${JSON.stringify(tag2, null, 2)}`);
        tagCommits = await octokit.request("GET /repos/:owner/:repo/compare/:tag2Name...:tag1Name", {
          owner,
          repo,
          tag1Name,
          tag2Name,
        });
        console.log(`${JSON.stringify(tagCommits.data.commits.map((value => value.commit)), null, 2)}`);
      }
    } catch (error) {
      core.setFailed(`Getting tags for '${repo}' failed with error ${error}`);
    }

    if (!githubContext.event || !githubContext.event.commits) {
      if(githubContext.event && githubContext.event.pull_request && githubContext.event.pull_request._links
        && githubContext.event.pull_request._links.commits) {
        const href = githubContext.event.pull_request._links.commits.href;
        const response = await axios.get(href, {
          params: {
            per_page: 200,
          }
        });
        let commits = response.data.map((value => value.commit));
        // console.log(JSON.stringify(commits, null, 2));
        const list = commitList(commits);
        // console.log(  { list });
        core.setOutput('commit-list', list.join('\n'));
      } else {
        core.setFailed('Github Context is Missing Commits');
      }
    } else {
      const list = commitList(githubContext.event.commits);
      // console.log(  { list });
      core.setOutput('commit-list', list.join('\n'));
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run()

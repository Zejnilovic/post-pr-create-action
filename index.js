import axios from 'axios';

const core = require("@actions/core");
const github = require("@actions/github");
const { Octokit } = require("@octokit/action");

async function run() {
  const pullRequest = github.context.payload.pull_request;
  if (!pullRequest) { core.setFailed("Could not get pull request number from context"); }
  const zenhubToken = core.getInput('ZENHUB_TOKEN', {required: true})
  const { owner, repo } = github.context.repo;
  const prNumber = pullRequest.number;

  const octokit = new Octokit();

  const response = await octokit.pulls.get({
    owner: owner,
    repo: repo,
    pull_number: prNumber
  });

  const branchName = response.data.head.ref
  const issueNumber = branchName.split("/")[1].split("-")[0]
  const prRepoId = response.data.head.repo.id

  axios.post(
    `https://api.zenhub.com/v4/repositories/${repo}/connection`,
    {
      issue_number: issueNumber,
      connected_repo_id: prRepoId,
      connected_issue_number: prNumber
    },
    {
      headers: {'X-Authentication-Token': zenhubToken}
    }
  ).then(
    _ => {},
    reason => {
      return reason.message === 'Not found'
        ? core.debug(`Issue number ${issueNumber} does not exist`)
        : throw new Error(`Failed to link PR #${prNumber} to issue #${issueNumber}: ${reason.message}`)
    }
  )
}

run();

import axios from 'axios';

const core = require("@actions/core");
const github = require("@actions/github");


async function run() {
  const pullRequest = github.context.payload.pull_request;
  if (!pullRequest) { core.setFailed("Could not get pull request number from context"); }
  const zenhubToken = core.getInput('ZENHUB_TOKEN', {required: true})
  const token = core.getInput("repo-token");
  const { owner, repo } = github.context.repo;
  const prNumber = pullRequest.number;

  const octokit = new github.GitHub(token);

  const response = await octokit.pulls.get({
    owner: owner,
    repo: repo,
    pull_number: prNumber
  });

  const branchName = response.data.head.ref
  const issueNumber = branchName.split("/")[1].split("-")[0]
  const prRepoId = response.data.head.repo.id

  await axios.post(
    `https://api.zenhub.com/v4/repositories/${repo}/connection`,
    {
      issue_number: issueNumber,
      connected_repo_id: prRepoId,
      connected_issue_number: prNumber
    },
    {
      headers: {'X-Authentication-Token': zenhubToken}
    }
  )
}

run();

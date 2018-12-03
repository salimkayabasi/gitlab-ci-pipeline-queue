const {
  GITLAB_API_TOKEN,
  CI_PIPELINE_ID,
  CI_PROJECT_ID,
  CI_PROJECT_URL,
} = process.env;
const request = require('request');
const url = require('url');

if (!CI_PROJECT_ID) {
  throw new Error('Env var CI_PROJECT_ID not present');
}

if (!CI_PIPELINE_ID) {
  throw new Error('Env var CI_PIPELINE_ID not present');
}

if (!GITLAB_API_TOKEN) {
  throw new Error('Env var GITLAB_API_TOKEN not present');
}
if (!CI_PROJECT_URL) {
  throw new Error('Env var CI_PROJECT_URL not present');
}

const currentPipelineId = parseInt(CI_PIPELINE_ID, 10);
const fullUrl = url.parse(CI_PROJECT_URL);
const baseUrl = fullUrl.href.replace(fullUrl.path, '');

const pipelineUrl = `${baseUrl}/api/v4/projects/${CI_PROJECT_ID}/pipelines`;

const options = {
  method: 'GET',
  url: pipelineUrl,
  qs: {
    scope: 'running',
    page: '1',
  },
  headers: {
    'Cache-Control': 'no-cache',
    'PRIVATE-TOKEN': GITLAB_API_TOKEN,
  },
};

function pollPipelines() {
  request(options, (error, response, body) => {
    if (error) throw new Error(error);
    const pipelines = JSON.parse(body);
    if (pipelines.length <= 1) {
      console.log('No other pipelines in queue, ready to build !');
      process.exit(0);
    } else {
      const pipelineIds = pipelines.map((pipeline) => pipeline.id);
      const lowestPipelineId = Math.min(...pipelineIds);
      if (lowestPipelineId === currentPipelineId) {
        console.log('The current pipeline is the oldest one, ready to build !');
        process.exit(0);
      } else {
        console.log(
          "The current pipeline is not the oldest one, let's wait for 5 seconds and retry",
        );
        setTimeout(() => {
          pollPipelines();
        }, 5000);
      }
    }
  });
}

pollPipelines();

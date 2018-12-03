#!/usr/bin/env node
const request = require('request');
const url = require('url');

const {
  GITLAB_API_TOKEN,
  CI_PIPELINE_ID,
  CI_PROJECT_ID,
  CI_PROJECT_URL,
  INTERVAL_SEC,
} = process.env;

if (!GITLAB_API_TOKEN) {
  throw new Error('Env var GITLAB_API_TOKEN not present');
}
if (!CI_PROJECT_ID) {
  throw new Error('Env var CI_PROJECT_ID not present');
}
if (!CI_PIPELINE_ID) {
  throw new Error('Env var CI_PIPELINE_ID not present');
}
if (!CI_PROJECT_URL) {
  throw new Error('Env var CI_PROJECT_URL not present');
}

const intervalSec = Number(INTERVAL_SEC || 5);
const intervalMs = intervalSec * 1e3;
const currentPipelineId = parseInt(CI_PIPELINE_ID, 10);
const fullUrl = url.parse(CI_PROJECT_URL);
const baseUrl = fullUrl.href.replace(fullUrl.path, '');
const pipelineUrl = `${baseUrl}/api/v4/projects/${CI_PROJECT_ID}/pipelines`;
const options = {
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

function check() {
  request(options, (error, response, body) => {
    if (error) throw new Error(error);
    const pipelines = JSON.parse(body);
    if (pipelines.length <= 1) {
      console.log('No other pipelines in queue, ready to build !');
      process.exit(0);
      return;
    }
    const pipelineIds = pipelines.map((pipeline) => pipeline.id);
    const lowestPipelineId = Math.min(...pipelineIds);
    if (lowestPipelineId === currentPipelineId) {
      console.log('The current pipeline is the oldest one, ready to build !');
      process.exit(0);
      return;
    }
    console.log(
      `The current pipeline is not the oldest one, let's wait for ${intervalSec} seconds and retry`,
    );
    setTimeout(check, intervalMs);
  });
}

check();


import { Mastra } from '@mastra/core/mastra';
import {clashAgent } from "./agents/clash-agent"
import {clashWorkflow} from "./workflows/clash-workflow";

export const mastra = new Mastra({
  workflows: { clashWorkflow},
  agents: { clashAgent },
  // deployer: new CloudflareDeployer({
  //   scope: "d5b3bb970da79f07a9fb614e60d02766",
  //   projectName: "yc-travel-agent-app",
  //   routes: [],
  //   workerNamespace: "3223a366bb61449b8eaa2981622663d9",
  //   auth: {
  //     apiToken: "UM7POzRkIjAPY3h7EsQ6v16x3fwRE1x04UYJ2og0",
  //     apiEmail: "yangcongzhao123@gmail.com",
  //   },
  // }),
});

const {Redis} = require("ioredis");

const cluster_endpoint = "chat-app-cluster-rq1dr5.serverless.use2.cache.amazonaws.com";
const cluster_port = 6379;

const client = new Redis();

module.exports = client;
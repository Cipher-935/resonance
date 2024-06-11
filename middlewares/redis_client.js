const {Redis} = require("ioredis");

const cluster_endpoint = "resonance-cache-rq1dr5.serverless.use2.cache.amazonaws.com";
const cluster_port = 6379;

const client = new Redis({
    host: cluster_endpoint,
    port: 6379
});

module.exports = client;
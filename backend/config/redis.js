const redis = require("redis");

// Support REDIS_URL (e.g. redis://:password@host:port) or individual vars
const REDIS_URL = process.env.REDIS_URL;
const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_PASSWORD =
    process.env.REDIS_PASSWORD || process.env.REDIS_PASS || "";

let client;
if (REDIS_URL) {
    client = redis.createClient({ url: REDIS_URL });
} else {
    const options = {
        socket: { host: REDIS_HOST, port: parseInt(REDIS_PORT, 10) },
    };
    if (REDIS_PASSWORD) options.password = REDIS_PASSWORD;
    client = redis.createClient(options);
}

client.on("error", (err) => console.log("Redis Client Error", err));

(async () => {
    await client.connect();
    console.log("Đã kết nối Redis thành công");
})();

module.exports = client;

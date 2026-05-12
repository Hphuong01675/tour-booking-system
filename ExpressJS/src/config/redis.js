const redis = require("redis");
const client = redis.createClient(); // Mặc định là localhost:6379

client.on("error", (err) => console.log("Redis Client Error", err));

(async () => {
    await client.connect();
    console.log("Đã kết nối Redis thành công");
})();

module.exports = client;

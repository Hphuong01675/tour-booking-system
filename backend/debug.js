const db = require('./src/models');
db.PackingItem.findAll().then(res => {
  console.log(JSON.stringify(res, null, 2));
}).catch(console.error).finally(() => process.exit(0));

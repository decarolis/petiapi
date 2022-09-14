const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.CONNECTIONSTRING);
  console.log('Conectou com Mongoose!');
}

main().catch((err) => console.log(err));

module.exports = mongoose;

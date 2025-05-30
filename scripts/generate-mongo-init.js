// scripts/generate-mongo-init.js
// This script generates the mongo-init.js file based on the environment variables from the .env file.
// It creates two users: one for the production database and one for the test database.
// The users have readWrite access to their respective databases.

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const outputPath = path.resolve(__dirname, '../mongo-init.js');

const content = `
// Auto-generated by generate-mongo-init.js
// This file is used to initialize the MongoDB database in a container by the docker-compose.yml file based on the .env file (see .env.example).
// You don't need this file if you're not using Docker for development.
// Don't commit this file to version control since it uses environment variables containing sensitive information.
db = db.getSiblingDB('${process.env.MONGO_APP_DATABASE}');

db.createUser({
  user: '${process.env.MONGO_APP_USERNAME}',
  pwd: '${process.env.MONGO_APP_PASSWORD}',
  roles: [{ role: 'readWrite', db: '${process.env.MONGO_APP_DATABASE}' }],
});

db.createUser({
  user: '${process.env.MONGO_APP_USERNAME_TEST}',
  pwd: '${process.env.MONGO_APP_PASSWORD_TEST}',
  roles: [{ role: 'readWrite', db: '${process.env.MONGO_APP_DATABASE_TEST}' }],
});
`;

fs.writeFileSync(outputPath, content, 'utf8');
console.log(`✅ mongo-init.js generated at: ${outputPath}`);

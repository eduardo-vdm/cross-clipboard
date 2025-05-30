
// Auto-generated by generate-mongo-init.js
// This file is used to initialize the MongoDB database in a container by the docker-compose.yml file based on the .env file (see .env.example).
// You don't need this file if you're not using Docker for development.
// Don't commit this file to version control since it uses environment variables containing sensitive information.
db = db.getSiblingDB('cross_clipboard');

db.createUser({
  user: 'crossclip_app',
  pwd: 'clip123secure',
  roles: [{ role: 'readWrite', db: 'cross_clipboard' }],
});

db.createUser({
  user: 'crossclip_app_test',
  pwd: 'clip123secure',
  roles: [{ role: 'readWrite', db: 'crossclip_app_test' }],
});

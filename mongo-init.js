// mongo-init.js
db = db.getSiblingDB('cross_clipboard');

db.createUser({
  user: 'crossclip_app',
  pwd: 'clip123secure',
  roles: [
    {
      role: 'readWrite',
      db: 'cross_clipboard',
    },
  ],
});

db.createUser({
  user: 'crossclip_app_test',
  pwd: 'clip123secure',
  roles: [
    {
      role: 'readWrite',
      db: 'crossclip_app_test',
    },
  ],
});

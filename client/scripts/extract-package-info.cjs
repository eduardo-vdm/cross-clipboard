const fs = require('fs');
const path = require('path');

const STATIC_LINES = [
  // '# This file is auto-generated from package.json - DO NOT EDIT MANUALLY',
  '# The following variables are generated from package.json - DO NOT EDIT THESE LINES MANUALLY',
];

// Read package.json
const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8')
);

const varsToAdd = [
  {
    key: 'VITE_APP_VERSION',
    value: packageJson.version,
  },
  {
    key: 'VITE_APP_AUTHOR',
    value: packageJson.author.name,
  },
  {
    key: 'VITE_APP_REPOSITORY',
    value: packageJson.repository.url,
  },
];

// Load current .env.local or create it if it doesn't exist
const envLocalPath = path.resolve(__dirname, '../.env.local');
let envLocalContent = fs.readFileSync(envLocalPath, 'utf8');
if (!envLocalContent) {
  envLocalContent = `# This file is auto-generated from package.json - DO NOT EDIT MANUALLY`;
}

// read each line of envLocalContent, and check if it contains any of the keys in varsToAdd
// if it does, remove the line from envLocalContent
envLocalContent = envLocalContent.split('\n');
envLocalContent = envLocalContent.filter(line => !varsToAdd.some(v => line.includes(`${v.key}=`)));
envLocalContent = envLocalContent.filter(line => !line?.length || !STATIC_LINES.some(l => line.includes(l)));

// add the new lines to envLocalContent
envLocalContent.push(...STATIC_LINES);
envLocalContent.push(...varsToAdd.map(v => `${v.key}=${v.value}`));

// Write to .env.local
fs.writeFileSync(envLocalPath, envLocalContent.join('\n'));

console.log(`Generated additional variables in .env.local from package.json [${varsToAdd.map(v => `${v.key}=${v.value}`).join(', ')}]`);

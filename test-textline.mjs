import { config } from 'dotenv';
config();

const apiKey = process.env.TEXTLINE_API_KEY;
console.log('TextLine key:', apiKey ? apiKey.substring(0, 8) + '...' : 'MISSING');

// Try the groups endpoint to find the help desk text line number
const endpoints = [
  'https://application.textline.com/api/groups.json',
  'https://application.textline.com/api/accounts.json',
  'https://application.textline.com/api/conversations.json?page=1&per=1',
];

for (const url of endpoints) {
  const resp = await fetch(url, {
    headers: { 'X-TGP-ACCESS-TOKEN': apiKey },
  });
  console.log(`\n${url} → ${resp.status}`);
  const body = await resp.text();
  console.log(body.substring(0, 400));
}

const apiKey = process.env.TEXTLINE_API_KEY;
if (!apiKey) {
  console.error('TEXTLINE_API_KEY not set');
  process.exit(1);
}

const phone = '+15175130391';
const link = 'https://whipagree-3narmaq7.manus.space/agreement?mode=demo&prefill=1';
const message = `Whip Member Agreement – Agent Demo Link\n\nUse this link to walk through the full member agreement flow:\n${link}\n\nAll fields are pre-filled. Just click through each step.`;

const resp = await fetch('https://application.textline.com/api/conversations.json', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-TGP-ACCESS-TOKEN': apiKey,
  },
  body: JSON.stringify({
    phone_number: phone,
    comment: { body: message },
  }),
});

const body = await resp.json();
console.log('Status:', resp.status);
console.log('Response:', JSON.stringify(body, null, 2));

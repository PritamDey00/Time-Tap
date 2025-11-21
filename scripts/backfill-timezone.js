const fs = require('fs').promises;
const path = require('path');

async function backfill() {
  const file = path.join(process.cwd(), 'data', 'users.json');
  const raw = await fs.readFile(file, 'utf8');
  const users = JSON.parse(raw || '[]');
  let changed = 0;
  for (const u of users) {
    if (!u.timezone) {
      u.timezone = 'Asia/Kolkata';
      changed++;
    }
  }
  if (changed) {
    await fs.writeFile(file, JSON.stringify(users, null, 2));
    console.log(`Backfilled ${changed} users to Asia/Kolkata`);
  } else {  
    console.log('No users needed backfilling');
  }
}

backfill().catch(err => { console.error(err); process.exit(1); });
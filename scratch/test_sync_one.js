const fs = require('fs');
const path = require('path');

try {
  const envPath = path.resolve(__dirname, '../.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value.replace(/\\n/g, '\n');
    }
  });
} catch (e) {
  console.warn('Could not load .env.local:', e.message);
}

// Mimic mapping logic from sync route
function getMappedStatus(apiStatus, oldStatus) {
  let mappedStatus = oldStatus;
  if (apiStatus === 'Delivered') {
    mappedStatus = 'Delivered';
  } else if (apiStatus === 'Out for Delivery') {
    mappedStatus = 'Out of Delivery';
  } else if (apiStatus === 'Reached Destination') {
    mappedStatus = 'Reached Destination';
  } else if (apiStatus.includes('Processed & Forwarded') || apiStatus.includes('Forwarded') || apiStatus.includes('Transit') || apiStatus.includes('In Transit')) {
    mappedStatus = 'Transit';
  } else if (apiStatus.includes('Holding') || apiStatus.includes('Hold')) {
    mappedStatus = 'Holding at HUB';
  } else if (apiStatus.includes('Return') || apiStatus.includes('Returned')) {
    mappedStatus = 'Returned';
  }
  return mappedStatus;
}

async function testSync() {
  const awb = '48070112226';
  try {
    const response = await fetch('https://franchexpress.com/proxy.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ awb, captcha: '' }),
    });

    if (!response.ok) {
      console.log('HTTP Error:', response.status);
      return;
    }

    const result = await response.json();
    if (result.status !== 'success' || !result.data) {
      console.log('API call unsuccessful:', result);
      return;
    }

    const d = result.data;
    
    // Parse timeline
    const timeline = (d.tracking || []).map(t => {
      let location = t.from || '';
      if (t.to) location += ` → ${t.to}`;
      return {
        status: t.trans_for || '',
        location
      };
    });

    console.log('=== Current Logic (Using dl_status_txt) ===');
    const currentApiStatus = d.dl_status_txt || 'Transit';
    const currentMapped = getMappedStatus(currentApiStatus, 'Transit');
    console.log(`  apiStatus: "${currentApiStatus}"`);
    console.log(`  mappedStatus: "${currentMapped}"`);
    console.log(`  Will update in DB: ${currentMapped !== 'Transit'}`);

    console.log('\n=== Proposed Logic (Using latest timeline event status if available) ===');
    const proposedApiStatus = (timeline && timeline.length > 0 && timeline[0].status) ? timeline[0].status : (d.dl_status_txt || 'Transit');
    const proposedMapped = getMappedStatus(proposedApiStatus, 'Transit');
    console.log(`  apiStatus: "${proposedApiStatus}"`);
    console.log(`  mappedStatus: "${proposedMapped}"`);
    console.log(`  Will update in DB: ${proposedMapped !== 'Transit'}`);

  } catch (err) {
    console.error('Error:', err);
  }
}

testSync();

const awbs = ['48070112193', '48070112226'];

async function checkLiveStatus() {
  for (const awb of awbs) {
    console.log(`\n=== Live Carrier Check for AWB: ${awb} ===`);
    try {
      const response = await fetch('https://franchexpress.com/proxy.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          awb: awb,
          captcha: '',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('API Response Status:', result.status);
        if (result.status === 'success' && result.data) {
          const d = result.data;
          console.log(`  dl_status (code): ${d.dl_status}`);
          console.log(`  dl_status_txt (status text): ${d.dl_status_txt}`);
          console.log(`  bk_dtm: ${d.bk_dtm}`);
          console.log(`  delv_dtm: ${d.delv_dtm}`);
          console.log('  Timeline events:');
          if (d.tracking && d.tracking.length > 0) {
            d.tracking.forEach((t, i) => {
              console.log(`    [${i + 1}] Date: ${t.trans_dtm} | Status: ${t.trans_for} | From: ${t.from} | To: ${t.to} | Colors: ${t.awb_colors}`);
            });
          } else {
            console.log('    No timeline events returned.');
          }
        } else {
          console.log('No data or unsuccessful status:', result);
        }
      } else {
        console.log('HTTP response error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Fetch failed:', error.message);
    }
  }
}

checkLiveStatus();

async function triggerSync() {
  const url = 'http://localhost:3000/api/consignments/sync?secret=local_sync_secret_key_123';
  console.log('Sending GET request to:', url);
  try {
    const response = await fetch(url, {
      method: 'GET',
    });
    
    console.log('HTTP Status:', response.status);
    const data = await response.json();
    console.log('Response Body:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

triggerSync();

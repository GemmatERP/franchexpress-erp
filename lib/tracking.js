/**
 * FranchExpress AWB Tracking helper
 */

/**
 * Fetches live status from the FranchExpress external API proxy.
 * Returns a unified object if successful, or null if the request fails/times out.
 */
export async function fetchLiveStatus(awbNumber) {
  if (!awbNumber) {
    throw new Error('AWB number is required');
  }

  try {
    const response = await fetch('https://franchexpress.com/proxy.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        awb: awbNumber,
        captcha: '',
      }),
      // 8 second timeout to prevent hanging the sync process
      signal: AbortSignal.timeout(8000),
    });

    if (response.ok) {
      const result = await response.json();
      if (result && result.status === 'success' && result.data) {
        const d = result.data;
        
        // Map raw tracking timeline to clean structure
        const timeline = (d.tracking || []).map(t => {
          let type = 'info';
          if (t.awb_colors === 'success') type = 'success';
          else if (t.awb_colors === 'warning') type = 'warning';
          else if (t.awb_colors === 'danger') type = 'danger';

          // Combine from and to for a clean location representation
          let location = t.from || '';
          if (t.to) {
            location += ` → ${t.to}`;
          }

          return {
            date: t.trans_dtm || '',
            status: t.trans_for || '',
            location,
            type,
            icon: t.awb_icons || 'fa-truck'
          };
        });

        const statusTxt = (timeline && timeline.length > 0 && timeline[0].status)
          ? timeline[0].status
          : (d.dl_status_txt || 'Transit');

        return {
          isSimulated: false,
          awbNumber,
          dl_status: d.dl_status || '0',
          statusTxt,
          origin: d.orgin || '',
          destination: d.dest || '',
          consignment: d.consignment || '',
          bk_dtm: d.bk_dtm || '',
          delv_dtm: d.delv_dtm || '',
          pod_image: d.pod_image || '',
          timeline
        };
      }
    }
  } catch (error) {
    console.warn(`FranchExpress live tracking fetch failed for AWB ${awbNumber}: ${error.message}`);
  }

  return null;
}

/**
 * Resolves tracking details for an AWB, falling back to simulated data on failure.
 */
export async function trackAWB(awbNumber) {
  const liveData = await fetchLiveStatus(awbNumber);
  if (liveData) {
    return liveData;
  }
  return getSimulatedTrackingData(awbNumber);
}

function getSimulatedTrackingData(awbNumber) {
  // Deterministic simulation based on AWB number digits
  const hash = Array.from(awbNumber).reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const origins = ['CHENNAI-HUB', 'COIMBATORE HUB', 'MADURAI HUB', 'SALEM HUB'];
  const destinations = ['AVADI', 'AMBATTUR', 'TAMBARAM', 'MYLAPORE', 'VELACHERY'];

  const origin = origins[hash % origins.length];
  const destination = destinations[(hash + 2) % destinations.length];

  const statusOptions = [
    { txt: 'Delivered', code: '1' },
    { txt: 'Out for Delivery', code: '0' },
    { txt: 'Reached Destination', code: '0' },
    { txt: 'Transit', code: '0' },
    { txt: 'Holding at HUB', code: '0' }
  ];

  const statusIdx = hash % statusOptions.length;
  const statusObj = statusOptions[statusIdx];

  const timeline = [];

  // Create simulated timeline based on status index
  // The higher the statusIndex, the further in the timeline it is.
  timeline.push({
    date: '2026-06-05 08:35',
    status: 'Processed & Forwarded',
    location: `${origin} → ${destination}, TN`,
    type: 'info',
    icon: 'fa-truck'
  });

  if (statusIdx >= 3) {
    timeline.push({
      date: '2026-06-06 19:14',
      status: 'Transit',
      location: `Chennai hub → ${destination}`,
      type: 'info',
      icon: 'fa-truck'
    });
  }

  if (statusIdx >= 4) {
    timeline.push({
      date: '2026-06-07 10:22',
      status: 'Holding at HUB',
      location: `${destination} HUB, TN`,
      type: 'warning',
      icon: 'fa-home'
    });
  }

  if (statusIdx >= 2 && statusIdx !== 4) {
    timeline.push({
      date: '2026-06-08 10:36',
      status: 'Reached Destination',
      location: `${destination}, TN`,
      type: 'info',
      icon: 'fa-truck'
    });
  }

  if (statusIdx >= 1 && statusIdx !== 4) {
    timeline.push({
      date: '2026-06-09 12:04',
      status: 'Out for Delivery',
      location: `${destination}-1BA, TN`,
      type: 'success',
      icon: 'fa-file-text-o'
    });
  }

  if (statusIdx === 0) {
    timeline.push({
      date: '2026-06-09 14:20',
      status: 'Delivered',
      location: `${destination}-1BA, TN`,
      type: 'success',
      icon: 'fa-check-square-o'
    });
  }

  // We want the newest events at the beginning of the array
  const sortedTimeline = [...timeline].reverse();

  return {
    isSimulated: true,
    awbNumber,
    dl_status: statusObj.code,
    statusTxt: statusObj.txt,
    origin,
    destination,
    consignment: 'MDox - 1 Nos',
    bk_dtm: '05-06-2026 1:40 AM',
    delv_dtm: statusObj.txt === 'Delivered' ? '09-06-2026 10:26 PM' : '',
    pod_image: statusObj.txt === 'Delivered' ? 'https://erpstcourier.com/img/pod/20260606/48071025984-pod.jpg' : '',
    timeline: sortedTimeline
  };
}


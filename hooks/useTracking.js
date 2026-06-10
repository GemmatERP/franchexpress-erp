import { useState, useCallback } from 'react';

export function useTracking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [trackingData, setTrackingData] = useState(null);

  const track = useCallback(async (awbNumber) => {
    if (!awbNumber) {
      setError('AWB number is required');
      return null;
    }

    setLoading(true);
    setError(null);
    setTrackingData(null);

    try {
      const res = await fetch('/api/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ awb: awbNumber }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to track AWB');
      }

      const data = await res.json();
      setTrackingData(data);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    track,
    loading,
    error,
    trackingData,
  };
}

import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminDb, adminAuth, admin } from '../../../../lib/firebase-admin';
import { fetchLiveStatus } from '../../../../lib/tracking';
import { invalidateStatsCache } from '../../../../lib/stats-cache';

// Helper to delay execution (prevent rate limiting issues on FranchExpress server)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const secretParam = searchParams.get('secret');
    const authHeader = req.headers.get('authorization');
    
    let headerSecret = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      headerSecret = authHeader.split('Bearer ')[1];
    }
    const xSyncSecret = req.headers.get('x-sync-secret');

    // Verify sync secret (cron scheduler auth)
    const isSecretValid = (
      (process.env.SYNC_SECRET && secretParam === process.env.SYNC_SECRET) ||
      (process.env.SYNC_SECRET && headerSecret === process.env.SYNC_SECRET) ||
      (process.env.SYNC_SECRET && xSyncSecret === process.env.SYNC_SECRET)
    );

    let isAuthorizedUser = false;
    let trigger = 'scheduler';
    let triggeredByUid = 'system';
    let triggeredByName = 'Scheduler (cron-job.org)';

    if (!isSecretValid) {
      // Try standard Firebase user token authentication (for admin override manual sync)
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.split('Bearer ')[1];
          const decodedToken = await adminAuth.verifyIdToken(token);
          // Check role in users collection
          const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
          if (userDoc.exists && userDoc.data().role === 'admin') {
            isAuthorizedUser = true;
            trigger = 'admin_manual';
            triggeredByUid = decodedToken.uid;
            triggeredByName = userDoc.data().name || 'Admin';
          }
        } catch (authErr) {
          console.warn('Firebase token auth failed in sync route:', authErr.message);
        }
      }
    }

    if (!isSecretValid && !isAuthorizedUser) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid secret key or insufficient permissions' },
        { status: 401 }
      );
    }

    const startTime = Date.now();

    // Query pending consignments (no date filter in Firestore query to avoid needing a composite index)
    const consignmentsSnap = await adminDb.collection('consignments')
      .where('deliveryStatus', 'in', ['Transit', 'Reached Destination', 'Out of Delivery', 'Holding at HUB'])
      .get();

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Filter by date range in-memory
    const filteredDocs = consignmentsSnap.docs.filter(doc => {
      const data = doc.data();
      if (!data.date) return false;
      try {
        const bookingDate = data.date.toDate();
        return bookingDate >= sixtyDaysAgo;
      } catch (e) {
        return false;
      }
    });

    // Sort by booking date desc (in-memory)
    filteredDocs.sort((a, b) => {
      const dateA = a.data().date ? a.data().date.toDate() : new Date(0);
      const dateB = b.data().date ? b.data().date.toDate() : new Date(0);
      return dateB - dateA;
    });

    const pendingCount = filteredDocs.length;
    
    if (pendingCount === 0) {
      const durationMs = Date.now() - startTime;
      const logDoc = {
        timestamp: admin.firestore.Timestamp.now(),
        trigger,
        triggeredByUid,
        triggeredByName,
        totalProcessed: 0,
        updatedCount: 0,
        skippedCount: 0,
        failedCount: 0,
        durationMs,
        details: []
      };
      await adminDb.collection('sync_logs').add(logDoc);

      return NextResponse.json({
        message: 'No pending shipments to sync',
        processed: 0,
        updated: 0,
        skipped: 0,
        failed: 0
      });
    }

    // Process consignments
    let updatedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const details = [];
    const batch = adminDb.batch();
    let batchHasWrites = false;

    // Use sequential queries with a small delay to avoid overwhelming the proxy
    for (const doc of filteredDocs) {
      const data = doc.data();
      const awb = data.awbNumber;
      const oldStatus = data.deliveryStatus;

      if (!awb) {
        skippedCount++;
        continue;
      }

      // Small delay of 250ms between requests
      await delay(250);

      try {
        const live = await fetchLiveStatus(awb);
        if (live) {
          const apiStatus = live.statusTxt;
          let mappedStatus = oldStatus;

          // Map FranchExpress API status text to our internal deliveryStatus enum values
          if (apiStatus === 'Delivered') {
            mappedStatus = 'Delivered';
          } else if (apiStatus === 'Out for Delivery') {
            mappedStatus = 'Out of Delivery';
          } else if (apiStatus === 'Reached Destination') {
            mappedStatus = 'Reached Destination';
          } else if (apiStatus.includes('Processed & Forwarded') || apiStatus.includes('Forwarded')) {
            mappedStatus = 'Transit';
          } else if (apiStatus.includes('Holding') || apiStatus.includes('Hold')) {
            mappedStatus = 'Holding at HUB';
          } else if (apiStatus.includes('Return') || apiStatus.includes('Returned')) {
            mappedStatus = 'Returned';
          }

          if (mappedStatus !== oldStatus) {
            const updatePayload = {
              deliveryStatus: mappedStatus,
              lastSyncedAt: admin.firestore.Timestamp.now()
            };

            // If status is Delivered, set deliveredDate from live delv_dtm if possible
            if (mappedStatus === 'Delivered') {
              if (live.delv_dtm) {
                try {
                  // Attempt parsing standard format: "DD-MM-YYYY hh:mm AM/PM"
                  const parts = live.delv_dtm.match(/(\d+)-(\d+)-(\d+)\s+(\d+):(\d+)\s*(AM|PM)?/i);
                  if (parts) {
                    const day = parseInt(parts[1], 10);
                    const month = parseInt(parts[2], 10) - 1;
                    const year = parseInt(parts[3], 10);
                    let hour = parseInt(parts[4], 10);
                    const minute = parseInt(parts[5], 10);
                    const ampm = parts[6];

                    if (ampm) {
                      if (ampm.toUpperCase() === 'PM' && hour < 12) hour += 12;
                      if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0;
                    }
                    const delvDate = new Date(year, month, day, hour, minute);
                    updatePayload.deliveredDate = admin.firestore.Timestamp.fromDate(delvDate);
                  } else {
                    updatePayload.deliveredDate = admin.firestore.Timestamp.fromDate(new Date(live.delv_dtm));
                  }
                } catch (pe) {
                  updatePayload.deliveredDate = admin.firestore.Timestamp.now();
                }
              } else {
                updatePayload.deliveredDate = admin.firestore.Timestamp.now();
              }
            }

            batch.update(doc.ref, updatePayload);
            batchHasWrites = true;
            updatedCount++;

            details.push({
              awb,
              sno: data.sno,
              oldStatus,
              newStatus: mappedStatus,
              result: 'updated'
            });
          } else {
            skippedCount++;
            details.push({
              awb,
              sno: data.sno,
              result: 'skipped',
              reason: 'Status unchanged'
            });
          }
        } else {
          failedCount++;
          details.push({
            awb,
            sno: data.sno,
            result: 'failed',
            reason: 'Proxy API returned empty or invalid status'
          });
        }
      } catch (err) {
        failedCount++;
        details.push({
          awb,
          sno: data.sno,
          result: 'failed',
          reason: err.message
        });
      }
    }

    // Commit batch update if there are edits
    if (batchHasWrites) {
      await batch.commit();
      invalidateStatsCache(); // Invalidate dashboard statistics cache
    }

    const durationMs = Date.now() - startTime;

    // Record execution logs in sync_logs collection
    const logDoc = {
      timestamp: admin.firestore.Timestamp.now(),
      trigger,
      triggeredByUid,
      triggeredByName,
      totalProcessed: pendingCount,
      updatedCount,
      skippedCount,
      failedCount,
      durationMs,
      details: details.slice(0, 100) // Keep the log size bounded in Firestore
    };

    await adminDb.collection('sync_logs').add(logDoc);

    return NextResponse.json({
      message: 'Automatic sync execution complete',
      processed: pendingCount,
      updated: updatedCount,
      skipped: skippedCount,
      failed: failedCount,
      durationMs
    });

  } catch (error) {
    console.error('API Sync Route Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

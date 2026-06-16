'use client';

import React from 'react';
import { 
  Compass, 
  Calendar, 
  MapPin, 
  CheckSquare, 
  FileText, 
  Truck, 
  Home, 
  XCircle, 
  ExternalLink 
} from 'lucide-react';

export function TrackingTimeline({ trackingData }) {
  if (!trackingData) return null;

  const { 
    awbNumber, 
    origin, 
    destination, 
    statusTxt, 
    consignment, 
    bk_dtm, 
    delv_dtm, 
    pod_image, 
    timeline = [],
    isSimulated
  } = trackingData;

  const getStatusIcon = (iconName, type) => {
    // Map FontAwesome classes to Lucide icons
    if (iconName) {
      if (iconName.includes('check-square')) return <CheckSquare className="h-4.5 w-4.5 text-fe-teal shrink-0" />;
      if (iconName.includes('file-text')) return <FileText className="h-4.5 w-4.5 text-fe-teal shrink-0" />;
      if (iconName.includes('truck')) return <Truck className="h-4.5 w-4.5 text-blue-500 shrink-0" />;
      if (iconName.includes('home')) return <Home className="h-4.5 w-4.5 text-amber-500 shrink-0" />;
      if (iconName.includes('times-circle')) return <XCircle className="h-4.5 w-4.5 text-red-500 shrink-0" />;
    }

    switch (type) {
      case 'success':
        return <CheckSquare className="h-4.5 w-4.5 text-fe-teal shrink-0" />;
      case 'warning':
        return <Home className="h-4.5 w-4.5 text-amber-500 shrink-0" />;
      case 'danger':
        return <XCircle className="h-4.5 w-4.5 text-red-500 shrink-0" />;
      default:
        return <Truck className="h-4.5 w-4.5 text-blue-500 shrink-0" />;
    }
  };

  const getStatusDotColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-fe-teal ring-fe-teal/20';
      case 'warning':
        return 'bg-amber-500 ring-amber-100';
      case 'danger':
        return 'bg-red-500 ring-red-100';
      default:
        return 'bg-blue-500 ring-blue-100';
    }
  };

  const getBadgeColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('delivered')) return 'bg-fe-teal/10 text-fe-teal border-fe-teal/20';
    if (s.includes('out for delivery')) return 'bg-fe-teal/10 text-fe-teal border-fe-teal/20';
    if (s.includes('holding') || s.includes('hold')) return 'bg-amber-50 text-amber-600 border-amber-100';
    if (s.includes('return')) return 'bg-red-50 text-red-600 border-red-100';
    return 'bg-blue-50 text-blue-600 border-blue-100';
  };

  return (
    <div className="bg-white border border-fe-muted/30 rounded-xl p-6 mt-8 shadow-sm space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-fe-muted/20 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-fe-teal/10 text-fe-teal shrink-0">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-heading font-bold text-fe-dark">
                Tracking Details
              </h3>
              {isSimulated && (
                <span className="text-[9px] bg-fe-muted/40 text-fe-gray font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Simulated
                </span>
              )}
            </div>
            <p className="text-[11px] font-mono text-fe-gray mt-0.5">
              AWB No: <span className="font-semibold text-fe-dark">{awbNumber}</span>
            </p>
          </div>
        </div>

        {/* Big status badge */}
        <span className={`px-3 py-1 text-xs font-bold font-heading rounded-full border ${getBadgeColor(statusTxt)}`}>
          ● {statusTxt}
        </span>
      </div>

      {/* Main Delivery confirmation line */}
      {statusTxt === 'Delivered' && (
        <div className="p-3.5 bg-green-50/50 border border-green-100 rounded-xl text-green-800 text-xs font-sans leading-relaxed">
          Your order was successfully <span className="font-semibold">Delivered</span> on{' '}
          <span className="font-semibold">{delv_dtm || 'N/A'}</span> at destination location:{' '}
          <span className="font-semibold">{destination || 'N/A'}</span>.
        </div>
      )}

      {/* Info grid (grey card) */}
      <div className="bg-fe-bg/30 border border-fe-muted/25 rounded-xl p-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-sans">
        <div>
          <p className="text-[10px] uppercase font-bold tracking-wider text-fe-gray">Origin SRC</p>
          <p className="font-semibold text-fe-dark mt-0.5">{origin || 'N/A'}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold tracking-wider text-fe-gray">Destination</p>
          <p className="font-semibold text-fe-dark mt-0.5">{destination || 'N/A'}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold tracking-wider text-fe-gray">Consignment</p>
          <p className="font-semibold text-fe-dark mt-0.5 truncate" title={consignment}>
            {consignment || 'MDox - 1 Nos'}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold tracking-wider text-fe-gray">Book Date/Time</p>
          <p className="text-fe-dark mt-0.5 font-medium">{bk_dtm || 'N/A'}</p>
        </div>
        {delv_dtm && (
          <div className="col-span-2 md:col-span-1">
            <p className="text-[10px] uppercase font-bold tracking-wider text-fe-gray">Delivery Date/Time</p>
            <p className="text-fe-dark mt-0.5 font-medium">{delv_dtm}</p>
          </div>
        )}
      </div>

      {/* POD Image Display */}
      {pod_image && (
        <div className="border border-fe-muted/20 rounded-xl p-4 bg-white space-y-3">
          <p className="text-[10px] uppercase font-bold tracking-wider text-fe-gray">Proof of Delivery (POD)</p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <a 
              href={pod_image} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="relative block w-28 h-20 rounded-lg overflow-hidden border border-fe-muted/30 hover:border-fe-teal hover:shadow-sm transition-all shrink-0 bg-fe-bg"
            >
              <img 
                src={pod_image} 
                alt={`POD for AWB ${awbNumber}`} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/150x100?text=No+Preview';
                }}
              />
            </a>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-fe-dark">Signature / Receipt Image</p>
              <p className="text-[10px] text-fe-gray">Delivered and signed at receiver desk.</p>
              <a 
                href={pod_image} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-fe-teal hover:underline font-bold"
              >
                Open in Full Resolution <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Vertical Timeline */}
      <div className="space-y-4">
        <h4 className="text-[10px] uppercase font-bold tracking-wider text-fe-gray">Tracking Timeline</h4>
        {timeline.length === 0 ? (
          <p className="text-xs text-fe-gray italic">No tracking updates recorded for this consignment.</p>
        ) : (
          <div className="relative border-l border-fe-muted ml-3 pl-6 space-y-6">
            {timeline.map((event, idx) => {
              return (
                <div key={idx} className="relative">
                  {/* Dot */}
                  <span className={`absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full ring-4 bg-white ${getStatusDotColor(event.type)}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  </span>

                  <div className="bg-fe-bg/20 p-3.5 rounded-xl border border-fe-muted/15 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      {getStatusIcon(event.icon, event.type)}
                      <div>
                        <p className="text-xs font-bold text-fe-dark font-sans leading-tight">
                          {event.status}
                        </p>
                        <p className="text-[10px] text-fe-gray font-sans flex items-center gap-1 mt-1 font-medium">
                          <MapPin className="h-3 w-3 shrink-0 text-fe-gray" />
                          {event.location}
                        </p>
                      </div>
                    </div>

                    <div className="text-[9px] text-fe-gray font-mono flex items-center gap-1 shrink-0 bg-white px-2 py-1 rounded-md border border-fe-muted/10">
                      <Calendar className="h-3.5 w-3.5 text-fe-gray shrink-0" />
                      {event.date}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

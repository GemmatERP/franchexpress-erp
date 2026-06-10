'use client';

import React from 'react';
import { Compass, Calendar, MapPin, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export function TrackingTimeline({ trackingData }) {
  if (!trackingData) return null;

  const { awbNumber, origin, destination, timeline = [] } = trackingData;

  const getStatusIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-fe-teal shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
      default:
        return <RefreshCw className="h-4 w-4 text-blue-500 shrink-0 animate-spin" style={{ animationDuration: '6s' }} />;
    }
  };

  const getStatusDotColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-fe-teal ring-fe-teal/20';
      case 'warning':
        return 'bg-amber-500 ring-amber-100';
      default:
        return 'bg-blue-500 ring-blue-100';
    }
  };

  return (
    <div className="bg-white border border-fe-muted rounded-xl p-6 mt-8 shadow-sm">
      {/* Header info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-fe-muted/20 pb-4 mb-5 gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-fe-teal/15 text-fe-teal">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-fe-dark font-heading">
              Tracking Details
            </h3>
            <p className="text-[11px] font-mono text-fe-gray">
              AWB: {awbNumber}
            </p>
          </div>
        </div>

        <div className="flex gap-4 text-xs font-sans text-fe-gray">
          <div>
            <span className="font-bold text-fe-dark">Origin:</span> {origin}
          </div>
          <div>
            <span className="font-bold text-fe-dark">Dest:</span> {destination}
          </div>
        </div>
      </div>

      {/* Timeline entries */}
      {timeline.length === 0 ? (
        <p className="text-xs text-fe-gray italic">No tracking updates recorded for this consignment.</p>
      ) : (
        <div className="relative border-l border-fe-muted ml-3 pl-6 space-y-6">
          {timeline.map((event, idx) => {
            const isLast = idx === timeline.length - 1;
            return (
              <div key={idx} className="relative">
                {/* Dot */}
                <span className={`absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full ring-4 bg-white ${getStatusDotColor(event.type)}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </span>

                <div className="bg-fe-bg/30 p-3 rounded-lg border border-fe-muted/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    {getStatusIcon(event.type)}
                    <div>
                      <p className="text-xs font-bold text-fe-dark font-sans leading-tight">
                        {event.status}
                      </p>
                      <p className="text-[10px] text-fe-gray font-sans flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {event.location}
                      </p>
                    </div>
                  </div>

                  <div className="text-[10px] text-fe-gray font-mono flex items-center gap-1 shrink-0 bg-white px-2 py-0.5 rounded border border-fe-muted/10">
                    <Calendar className="h-3 w-3 shrink-0" />
                    {event.date}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

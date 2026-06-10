'use client';

import React, { Component } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { Card } from '../ui/Card';

// Local Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Recharts Error Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-red-50/20 border border-dashed border-red-200 rounded-xl p-4 text-center">
          <p className="text-sm font-semibold text-red-600">Failed to render chart</p>
          <p className="text-xs text-fe-gray mt-1">Check database values or format</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export function DashboardCharts({ volumeData = [], statusData = [], revenueData = [] }) {
  // Color configuration mapping
  const COLORS = {
    'Transit': '#f59e0b',             // Amber
    'Reached Destination': '#3b82f6', // Blue
    'Out of Delivery': '#60CAAD',     // fe-teal
    'Returned': '#ef4444',            // Red
    'Holding at HUB': '#8b5cf6',      // Purple
    'Delivered': '#A7C7AF',           // fe-green
  };

  const PIE_COLORS = ['#60CAAD', '#A7C7AF', '#B6CCBB', '#E0E4D6', '#9DA5A2', '#444444'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
      {/* 1. Bar Chart: Volume in last 7 days */}
      <Card hoverEffect className="lg:col-span-2">
        <h3 className="text-sm font-bold text-fe-dark font-heading mb-4">
          Consignment Volume (Last 7 Days)
        </h3>
        <div className="h-64">
          <ErrorBoundary>
            {volumeData.length === 0 ? (
              <EmptyChartState message="No volume data recorded in the last 7 days." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: '#9DA5A2', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9DA5A2', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E0E4D6' }}
                    labelStyle={{ fontWeight: 'bold', color: '#444' }}
                  />
                  <Bar dataKey="consignments" fill="#60CAAD" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ErrorBoundary>
        </div>
      </Card>

      {/* 2. Pie Chart: Status Distribution */}
      <Card hoverEffect>
        <h3 className="text-sm font-bold text-fe-dark font-heading mb-4">
          Status Distribution
        </h3>
        <div className="h-64">
          <ErrorBoundary>
            {statusData.length === 0 ? (
              <EmptyChartState message="No status distribution records available." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[entry.name] || PIE_COLORS[index % PIE_COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '10px', marginTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ErrorBoundary>
        </div>
      </Card>

      {/* 3. Line Chart: Daily Revenue Trend */}
      <Card hoverEffect className="lg:col-span-3">
        <h3 className="text-sm font-bold text-fe-dark font-heading mb-4">
          Daily Revenue Trend (Last 14 Days)
        </h3>
        <div className="h-64">
          <ErrorBoundary>
            {revenueData.length === 0 ? (
              <EmptyChartState message="No revenue recorded in the last 14 days." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f2ee" />
                  <XAxis dataKey="date" tick={{ fill: '#9DA5A2', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9DA5A2', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E0E4D6' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#60CAAD"
                    strokeWidth={2.5}
                    activeDot={{ r: 6 }}
                    dot={{ r: 3, fill: '#60CAAD', strokeWidth: 1 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ErrorBoundary>
        </div>
      </Card>
    </div>
  );
}

function EmptyChartState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <svg className="w-12 h-12 text-fe-gray opacity-40 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p className="text-xs font-semibold text-fe-gray">{message}</p>
    </div>
  );
}

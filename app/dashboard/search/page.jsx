'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  X, 
  Calendar, 
  MapPin, 
  Phone, 
  User, 
  Edit2, 
  Eye, 
  Compass
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { useTracking } from '../../../hooks/useTracking';
import { useConsignmentEdit } from '../../../lib/ConsignmentEditContext';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { Modal } from '../../../components/ui/Modal';
import { TrackingTimeline } from '../../../components/consignment/TrackingTimeline';
import { formatDate } from '../../../lib/utils';

export default function SearchPage() {
  const router = useRouter();
  const { user, role, loading: authLoading, getHeaders } = useAuth();
  const { toast } = useToast();
  const { setEditConsignment } = useConsignmentEdit();
  
  // Tracking hook
  const { track, trackingData, loading: trackLoading } = useTracking();

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Tracking Modal State
  const [selectedAwb, setSelectedAwb] = useState(null);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);

  // Authorization check - only Admin, Super Admin, and Employee allowed
  useEffect(() => {
    if (!authLoading && role && role !== 'admin' && role !== 'super_admin' && role !== 'employee') {
      router.replace('/dashboard');
    }
  }, [role, authLoading, router]);

  // Local getHeaders helper
  const localGetHeaders = useCallback(async () => {
    if (!user) return {};
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }, [user]);

  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      toast('Please enter a search query', 'warning');
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const headers = await localGetHeaders();
      const res = await fetch(`/api/consignments/search?q=${encodeURIComponent(trimmed)}`, { headers });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to search consignments');
      }
      
      const data = await res.json();
      setResults(data);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setResults([]);
    setHasSearched(false);
  };

  const handleTrackAwb = async (awbNumber) => {
    setSelectedAwb(awbNumber);
    setIsTrackModalOpen(true);
    await track(awbNumber);
  };

  const handleEdit = (id) => {
    setEditConsignment(id);
    router.push('/dashboard/consignments/edit');
  };

  if (authLoading || (role !== 'admin' && role !== 'super_admin' && role !== 'employee')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
        <p className="text-xs text-fe-gray font-sans mt-3">Verifying security credentials...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Search Bar Section */}
      <Card className="p-6 border border-fe-muted/10 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div>
            <h2 className="text-base font-heading font-bold text-fe-dark">Find Consignments</h2>
            <p className="text-xs text-fe-gray font-sans mt-1">
              Search by AWB number, Consignee or Consignor name/phone, City, or State. Matches across any field will be displayed.
            </p>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-fe-gray">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter AWB, Name, Phone, City, or State..."
                className="block w-full pl-9 pr-10 py-2.5 bg-fe-bg border border-fe-muted focus:border-fe-teal focus:ring-1 focus:ring-fe-teal rounded-lg text-xs font-sans text-fe-dark placeholder-fe-gray focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-fe-gray hover:text-fe-dark focus:outline-none"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="px-5 text-xs font-semibold shrink-0"
            >
              {loading ? <Spinner size="xs" color="white" /> : 'Search'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Results Section */}
      {hasSearched && (
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-fe-muted/20 flex justify-between items-center bg-white">
            <h3 className="text-sm font-heading font-bold text-fe-dark">
              Search Results {loading ? '' : `(${results.length} found)`}
            </h3>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-12">
              <Spinner size="md" />
              <p className="text-xs text-fe-gray font-sans mt-3">Searching database...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-12 text-center text-fe-gray text-xs font-sans">
              No consignments matched your search query. Try checking for typos or entering a different search term.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-fe-bg text-fe-gray font-semibold border-b border-fe-muted/20">
                    <th className="px-6 py-3.5">SNO</th>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5">AWB Number</th>
                    <th className="px-6 py-3.5">Consignor</th>
                    <th className="px-6 py-3.5">Consignee</th>
                    <th className="px-6 py-3.5">City</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fe-muted/10">
                  {results.map((item) => (
                    <tr key={item.id} className="hover:bg-fe-bg/40 transition-colors">
                      <td className="px-6 py-4 font-bold text-fe-teal font-mono whitespace-nowrap">
                        {item.sno}
                      </td>
                      <td className="px-6 py-4 text-fe-dark whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-fe-gray" />
                          {formatDate(item.date)}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-fe-dark">
                        {item.awbNumber}
                      </td>
                      <td className="px-6 py-4 text-fe-dark max-w-[150px] truncate">
                        <div className="font-medium">{item.consignorName}</div>
                        <div className="text-[10px] text-fe-gray flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3 shrink-0" />
                          {item.consignorPhone || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-fe-dark max-w-[150px] truncate">
                        <div className="font-medium">{item.consigneeName}</div>
                        <div className="text-[10px] text-fe-gray flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3 shrink-0" />
                          {item.consigneePhone || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-fe-gray">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-fe-gray shrink-0" />
                          {item.consigneeCity}, {item.consigneeState || 'TN'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge value={item.deliveryStatus} />
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleTrackAwb(item.awbNumber)}
                            className="p-1.5 rounded text-fe-gray hover:text-fe-teal hover:bg-fe-bg focus:outline-none"
                            title="Live Track"
                            aria-label={`Track consignment ${item.sno}`}
                          >
                            <Compass className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(item.id)}
                            className="p-1.5 rounded text-fe-gray hover:text-fe-teal hover:bg-fe-bg focus:outline-none"
                            title="Edit details"
                            aria-label={`Edit consignment ${item.sno}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Live Tracking Modal */}
      <Modal
        isOpen={isTrackModalOpen}
        onClose={() => {
          setIsTrackModalOpen(false);
          setSelectedAwb(null);
        }}
        title={`Live Tracking Status — #${selectedAwb}`}
        size="lg"
      >
        {trackLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Spinner size="md" />
            <p className="text-xs text-fe-gray font-sans mt-3">Fetching live updates from FranchExpress...</p>
          </div>
        ) : (
          <TrackingTimeline trackingData={trackingData} />
        )}
      </Modal>
    </div>
  );
}

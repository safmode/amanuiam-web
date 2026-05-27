// DispatchOfficerModal.jsx - Make sure this is the complete file
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send, User, Shield, AlertTriangle, Phone, Mail } from 'lucide-react';
import axios from 'axios';

export const DispatchOfficerModal = ({ open, onClose, onDispatch, alert }) => {
  console.log('DispatchOfficerModal rendered with open:', open, 'alert:', alert); // Debug log

  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [officerDetails, setOfficerDetails] = useState(null);

  useEffect(() => {
    if (open && alert) {
      console.log('Modal opened, fetching officers...'); // Debug log
      fetchOfficers();
      // Pre-fill notes with alert information
      setDispatchNotes(
        `EMERGENCY DISPATCH\n` +
        `Location: ${alert.address || alert.location?.mahallah || 'Unknown location'}\n` +
        `Reporter: ${alert.student?.name || alert.reporterName || 'Unknown'}\n` +
        `Phone: ${alert.student?.phone || alert.reporterPhone || 'Not provided'}\n` +
        `Time: ${new Date(alert.triggeredAt).toLocaleString()}\n\n` +
        `Please respond immediately to this emergency.`
      );
    }
  }, [open, alert]);

  const fetchOfficers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/officers/list');
      console.log('Officers fetched:', response.data); // Debug log
      setOfficers(response.data);
    } catch (error) {
      console.error('Failed to fetch officers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOfficerSelect = (officerId) => {
    setSelectedOfficer(officerId);
    const officer = officers.find(o => o.officerId === officerId);
    setOfficerDetails(officer);
  };

  const handleSubmit = async () => {
    if (!selectedOfficer) {
      alert('Please select an officer to dispatch');
      return;
    }

    setSubmitting(true);
    try {
      const officer = officers.find(o => o.officerId === selectedOfficer);
      await onDispatch({
        officerId: selectedOfficer,
        officerName: officer?.officerName,
        dispatchNotes: dispatchNotes
      });
      onClose();
    } catch (error) {
      console.error('Failed to dispatch officer:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!alert) {
    console.log('No alert provided to modal'); // Debug log
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] rounded-2xl p-0 overflow-hidden dark:bg-slate-800 dark:border-slate-700">
        <div className="p-6 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-b dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center dark:bg-red-900/30">
              <Send className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Dispatch Officer</DialogTitle>
              <p className="text-xs text-gray-500 mt-0.5 dark:text-gray-400">
                Assign an officer to respond to this emergency alert
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Emergency Summary */}
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0 dark:text-amber-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Emergency Details</p>
                <div className="mt-2 space-y-1 text-sm">
                  <p className="text-gray-700 dark:text-gray-300"><span className="text-gray-500 dark:text-gray-400">Location:</span> {alert.address || alert.location?.mahallah || alert.location || 'Unknown'}</p>
                  <p className="text-gray-700 dark:text-gray-300"><span className="text-gray-500 dark:text-gray-400">Reporter:</span> {alert.student?.name || alert.reporterName || 'Unknown'}</p>
                  {alert.student?.phone && (
                    <p className="text-gray-700 dark:text-gray-300"><span className="text-gray-500 dark:text-gray-400">Contact:</span> {alert.student.phone}</p>
                  )}
                  <p className="text-gray-700 dark:text-gray-300"><span className="text-gray-500 dark:text-gray-400">Time:</span> {new Date(alert.triggeredAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Officer Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300">
              Select Responding Officer *
            </Label>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-[#D4A853]" />
              </div>
            ) : (
              <Select value={selectedOfficer} onValueChange={handleOfficerSelect}>
                <SelectTrigger className="bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200">
                  <SelectValue placeholder="Choose an officer to dispatch" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                  {officers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      No officers available. Please add officers first.
                    </div>
                  ) : (
                    officers.map((officer) => (
                      <SelectItem key={officer.officerId} value={officer.officerId} className="dark:text-gray-300 dark:focus:bg-slate-700">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          <span>{officer.officerName}</span>
                          {officer.rank && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">({officer.rank})</span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Officer Details (when selected) */}
          {officerDetails && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-200 dark:bg-green-950/20 dark:border-green-800">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-800 dark:text-green-300">Assigned Officer Details</span>
              </div>
              <div className="space-y-2 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Name: </span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{officerDetails.officerName}</span>
                {officerDetails.rank && (
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-500 dark:text-gray-400">Rank:</span>
                    <span className="text-gray-700 dark:text-gray-300">{officerDetails.rank}</span>
                  </div>
                )}
                {officerDetails.department && (
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-500 dark:text-gray-400">Department:</span>
                    <span className="text-gray-700 dark:text-gray-300">{officerDetails.department}</span>
                  </div>
                )}
                {officerDetails.phone && (
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-500 dark:text-gray-400">Phone:</span>
                    <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                      <Phone className="w-3 h-3" />
                      {officerDetails.phone}
                    </span>
                  </div>
                )}
                {officerDetails.email && (
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-500 dark:text-gray-400">Email:</span>
                    <span className="text-xs break-all text-gray-700 dark:text-gray-300">{officerDetails.email}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dispatch Notes */}
          <div>
            <Label className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300">
              Dispatch Instructions & Notes
            </Label>
            <Textarea
              value={dispatchNotes}
              onChange={(e) => setDispatchNotes(e.target.value)}
              placeholder="Add any specific instructions or notes for the responding officer..."
              className="min-h-[120px] bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1 rounded-xl dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-700" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl gap-2"
              onClick={handleSubmit}
              disabled={submitting || !selectedOfficer}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Dispatch Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

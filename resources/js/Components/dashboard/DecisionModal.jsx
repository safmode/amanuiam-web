// resources/js/Components/dashboard/DecisionModal.jsx

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Plus, MapPin, User, Shield, Clock } from 'lucide-react';

export const DecisionModal = ({ open, onClose, onYes, onNo, alert, formatDate }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] rounded-2xl p-0 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-amber-50 to-white dark:from-amber-900/20 dark:to-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <DialogTitle className="text-lg font-semibold">Create Incident Report?</DialogTitle>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-muted-foreground">
            This emergency alert has been resolved. Would you like to create an official incident report for documentation?
          </p>

          {alert && (
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-red-500" />
                <span className="font-medium">{alert.address || alert.location?.mahallah || alert.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-amber-500" />
                <span>{alert.student?.name || 'Unknown Student'}</span>
              </div>
              {alert.assigned_officer_name && (
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span>Responding Officer: {alert.assigned_officer_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs">{formatDate ? formatDate(alert.triggeredAt) : new Date(alert.triggeredAt).toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={onNo}>
              No, Skip
            </Button>
            <Button className="flex-1 bg-[#D4A853] hover:bg-[#C49A48] text-white rounded-xl gap-2" onClick={onYes}>
              <Plus className="w-4 h-4" />
              Yes, Create Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

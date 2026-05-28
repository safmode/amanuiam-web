// resources/js/Components/dashboard/DecisionModal.jsx

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Plus, MapPin, User, Shield, Clock } from 'lucide-react';

export const DecisionModal = ({ open, onClose, onYes, onNo, alert, formatDate }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] rounded-xl p-0 overflow-hidden dark:bg-slate-800 dark:border-slate-700">
        <div className="px-6 py-4 bg-amber-50 border-b border-amber-100 dark:bg-amber-950/20 dark:border-amber-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center dark:bg-amber-900/30">
              <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">Create Incident Report?</DialogTitle>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This emergency alert has been resolved. Would you like to create an official incident report for documentation?
          </p>

          {alert && (
            <div className="bg-gray-50 rounded-lg p-3 dark:bg-slate-800/50 dark:border dark:border-slate-700">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-red-500 dark:text-red-400" />
                <span className="font-medium text-gray-700 dark:text-gray-300">{alert.address || alert.location?.mahallah || alert.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm mt-1">
                <User className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span className="text-gray-700 dark:text-gray-300">{alert.student?.name || 'Unknown Student'}</span>
              </div>
              {alert.assigned_officer_name && (
                <div className="flex items-center gap-2 text-sm mt-1">
                  <Shield className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                  <span className="text-gray-700 dark:text-gray-300">Responding Officer: {alert.assigned_officer_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm mt-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate ? formatDate(alert.triggeredAt) : new Date(alert.triggeredAt).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 rounded-lg h-10 text-sm dark:border-slate-700 dark:text-gray-300" onClick={onNo}>
              No, Skip
            </Button>
            <Button className="flex-1 bg-[#D4A853] hover:bg-[#C49A48] text-white rounded-lg gap-2 h-10 text-sm font-medium" onClick={onYes}>
              <Plus className="w-4 h-4" />
              Yes, Create Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

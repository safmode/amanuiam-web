// components/dashboard/ViewOfficerModal.jsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Target, Edit, User, MapPin } from 'lucide-react';

const ViewOfficerModal = ({ isOpen, onClose, officer, onEdit, isAdmin }) => {
  const getInitials = (name) =>
    name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'NA';

  const getPerformanceText = (rate) => {
    if (rate >= 90) return '🌟 Excellent performance - Top tier officer';
    if (rate >= 75) return '👍 Good performance - Keep it up!';
    if (rate >= 60) return '📈 Average performance - Room for improvement';
    return '⚠️ Needs improvement - Additional training recommended';
  };

  if (!officer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px] rounded-2xl p-0 overflow-hidden dark:bg-slate-800 dark:border-slate-700">
        <DialogHeader className="p-6 pb-4 bg-gray-50 dark:bg-slate-800">
          <DialogTitle className="text-center text-lg font-semibold text-gray-900 dark:text-gray-100">Performance Details</DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-4 pt-4">
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-gray-50 rounded-xl dark:from-amber-950/20 dark:to-slate-800/50 dark:border dark:border-slate-700">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#D4A853] to-[#B8923A] flex items-center justify-center text-white font-bold text-base">
              {getInitials(officer.officerName)}
            </div>
            <div>
              <p className="font-semibold text-base text-gray-900 dark:text-gray-100">{officer.officerName}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{officer.rank}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-green-50 rounded-xl border border-green-100 dark:bg-green-950/20 dark:border-green-800">
              <p className="text-xs text-green-600 flex items-center gap-1 dark:text-green-400">
                <Activity className="w-3 h-3" />Cases Handled
              </p>
              <p className="text-2xl font-bold text-green-700 mt-1 dark:text-green-400">{officer.casesHandled || 0}</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 dark:bg-amber-950/20 dark:border-amber-800">
              <p className="text-xs text-amber-600 flex items-center gap-1 dark:text-amber-400">
                <Target className="w-3 h-3" />Response Rate
              </p>
              <p className="text-2xl font-bold text-amber-700 mt-1 dark:text-amber-400">{officer.responseRate || 0}%</p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl dark:bg-slate-800/50 dark:border dark:border-slate-700">
            <div className="flex justify-between mb-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Performance Score</p>
              <p className="text-sm font-semibold text-[#D4A853] dark:text-amber-400">{officer.responseRate || 0}%</p>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden dark:bg-slate-700">
              <div
                className="h-full bg-gradient-to-r from-[#D4A853] to-[#C49A48] rounded-full"
                style={{ width: `${officer.responseRate || 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center dark:text-gray-400">
              {getPerformanceText(officer.responseRate)}
            </p>
          </div>

          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 dark:bg-blue-950/20 dark:border-blue-800">
            <p className="text-xs text-blue-600 font-medium dark:text-blue-400">Department</p>
            <p className="text-sm text-blue-800 mt-0.5 flex items-center gap-1 dark:text-blue-300">
              <MapPin className="w-3 h-3" />{officer.department}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} className="rounded-xl dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-700">
              Close
            </Button>
            {isAdmin && (
              <Button
                className="bg-[#D4A853] hover:bg-[#C49A48] rounded-xl text-white"
                onClick={() => {
                  onClose();
                  onEdit(officer);
                }}
              >
                <Edit className="w-4 h-4 mr-2" />Edit
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewOfficerModal;

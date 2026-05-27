import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';

const DeleteOfficerModal = ({ isOpen, onClose, officer, onConfirm, isDeleting }) => {
  if (!officer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] rounded-2xl p-0 dark:bg-slate-800 dark:border-slate-700">
        <DialogHeader className="p-6 pb-2 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Delete Officer
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-6">
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300 font-medium mb-2">
                ⚠️ This action cannot be undone!
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {officer.officerName}
                </span>
                {' '}from the system?
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <strong>Note:</strong> Deleting this officer will also remove all their associated data, including:
              </p>
              <ul className="text-xs text-amber-700 dark:text-amber-400 mt-1 list-disc list-inside">
                <li>Assigned reports history</li>
                <li>Performance metrics</li>
                <li>Case handling records</li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Officer ID</p>
                  <p className="font-mono text-gray-800 dark:text-gray-200">{officer.officerId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Rank</p>
                  <p className="text-gray-800 dark:text-gray-200">{officer.rank}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Department</p>
                  <p className="text-gray-800 dark:text-gray-200">{officer.department}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Cases Handled</p>
                  <p className="text-gray-800 dark:text-gray-200">{officer.casesHandled || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 pt-2 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl border-gray-200 text-gray-700 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-700"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-xl gap-2 bg-red-500 hover:bg-red-600 text-white"
          >
            {isDeleting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</>
            ) : (
              <><Trash2 className="w-4 h-4" /> Confirm Delete</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteOfficerModal;

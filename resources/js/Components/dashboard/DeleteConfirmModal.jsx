// components/dashboard/DeleteConfirmModal.jsx
import { Button } from '@/components/ui/button';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { categoryLabels } from '@/Pages/Reports';

const DeleteConfirmModal = ({ isOpen, report, onConfirm, onCancel, isDeleting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200 dark:bg-slate-800 dark:border dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center dark:bg-red-900/30">
            <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Delete Report</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
          </div>
        </div>

        {/* Warning Message */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 dark:bg-amber-950/20 dark:border-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5 dark:text-amber-400" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Warning!</p>
              <p className="text-xs text-amber-700 mt-1 dark:text-amber-400">
                All attachments associated with this report will also be permanently deleted.
              </p>
            </div>
          </div>
        </div>

        {/* Report Details */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 dark:bg-slate-800/50 dark:border dark:border-slate-700">
          <p className="text-xs text-gray-500 mb-2 dark:text-gray-400">REPORT DETAILS</p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Report ID:</span>
              <span className="text-sm font-mono font-medium text-gray-900 dark:text-gray-200">{report?.reportId || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Category:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                {categoryLabels[report?.incidentCategory] || report?.incidentCategory || '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Date:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                {report?.incidentDateTime ? new Date(report.incidentDateTime).toLocaleDateString('en-MY') : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Reporter:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-200">{report?.studentName || '—'}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            className="rounded-xl px-4 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-700"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-4 gap-2"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</>
            ) : (
              <><Trash2 className="w-4 h-4" /> Delete Report</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;

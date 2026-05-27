// resources/js/Components/dashboard/ConfirmationModal.jsx

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, MapPin, User } from 'lucide-react';

export const ConfirmationModal = ({ open, onClose, onConfirm, title, description, alert, isProcessing, confirmText = "Confirm", confirmColor = "green" }) => {
  const getConfirmColorClasses = () => {
    if (confirmColor === 'green') {
      return {
        bg: 'bg-green-50 dark:bg-green-900/20',
        iconBg: 'bg-green-100 dark:bg-green-900/30',
        iconText: 'text-green-600 dark:text-green-400',
        button: 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700'
      };
    } else if (confirmColor === 'red') {
      return {
        bg: 'bg-red-50 dark:bg-red-900/20',
        iconBg: 'bg-red-100 dark:bg-red-900/30',
        iconText: 'text-red-600 dark:text-red-400',
        button: 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
      };
    } else if (confirmColor === 'amber') {
      return {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        iconBg: 'bg-amber-100 dark:bg-amber-900/30',
        iconText: 'text-amber-600 dark:text-amber-400',
        button: 'bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700'
      };
    }
    return {
      bg: 'bg-gray-50 dark:bg-gray-800',
      iconBg: 'bg-gray-100 dark:bg-gray-700',
      iconText: 'text-gray-600 dark:text-gray-400',
      button: 'bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700'
    };
  };

  const colors = getConfirmColorClasses();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] rounded-2xl p-0 overflow-hidden dark:bg-slate-800 dark:border-slate-700">
        <div className={`p-6 bg-gradient-to-r ${colors.bg} to-white dark:to-slate-800`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${colors.iconBg} flex items-center justify-center`}>
              <CheckCircle className={`w-5 h-5 ${colors.iconText}`} />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</DialogTitle>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-gray-600 dark:text-gray-400">{description}</p>

          {alert && (
            <div className="bg-gray-50 rounded-lg p-3 dark:bg-slate-800/50 dark:border dark:border-slate-700">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-red-500 dark:text-red-400" />
                <span className="text-gray-700 dark:text-gray-300">{alert.address || alert.location?.mahallah || alert.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm mt-1">
                <User className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span className="text-gray-700 dark:text-gray-300">{alert.student?.name || 'Unknown Student'}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-700" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className={`flex-1 ${colors.button} text-white rounded-xl gap-2`}
              onClick={onConfirm}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {confirmText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

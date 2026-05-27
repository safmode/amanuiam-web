// components/dashboard/EditOfficerModal.jsx
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Phone, Mail, MessageCircle } from 'lucide-react';

const EditOfficerModal = ({ isOpen, onClose, officer, onSave, ranks, departments, isLoading }) => {
  const [editedOfficer, setEditedOfficer] = useState({
    officerName: '',
    rank: '',
    department: '',
    phone: '',
    email: '',
    telegram_chat_id: '',
    receive_emergency: true,
    receive_daily_digest: false
  });

  useEffect(() => {
    if (officer) {
      setEditedOfficer({
        officerName: officer.officerName || '',
        rank: officer.rank || '',
        department: officer.department || '',
        phone: officer.phone || '',
        email: officer.email || '',
        telegram_chat_id: officer.telegram_chat_id || '',
        receive_emergency: officer.receive_emergency !== undefined ? officer.receive_emergency : true,
        receive_daily_digest: officer.receive_daily_digest || false
      });
    }
  }, [officer]);

  const handleSave = () => {
    onSave(editedOfficer);
  };

  if (!officer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl p-0 overflow-hidden dark:bg-slate-800 dark:border-slate-700">
        <DialogHeader className="p-6 pb-4 bg-gray-50 dark:bg-slate-800">
          <DialogTitle className="text-center text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Officer</DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-4 pt-4">
          {/* Basic Information */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Officer full name"
                value={editedOfficer.officerName}
                onChange={e => setEditedOfficer({ ...editedOfficer, officerName: e.target.value })}
                className="pl-9 rounded-xl border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Rank</Label>
              <Select value={editedOfficer.rank} onValueChange={v => setEditedOfficer({ ...editedOfficer, rank: v })}>
                <SelectTrigger className="rounded-xl border-gray-200 bg-gray-50 text-gray-900 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200">
                  <SelectValue placeholder="Select rank" />
                </SelectTrigger>
                <SelectContent className="rounded-xl dark:bg-slate-800 dark:border-slate-700">
                  {ranks.map(rank => (
                    <SelectItem key={rank} value={rank} className="dark:text-gray-300 dark:focus:bg-slate-700">{rank}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Department</Label>
              <Select value={editedOfficer.department} onValueChange={v => setEditedOfficer({ ...editedOfficer, department: v })}>
                <SelectTrigger className="rounded-xl border-gray-200 bg-gray-50 text-gray-900 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200">
                  <SelectValue placeholder="Select dept" />
                </SelectTrigger>
                <SelectContent className="rounded-xl dark:bg-slate-800 dark:border-slate-700">
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept} className="dark:text-gray-300 dark:focus:bg-slate-700">{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <Input
                  placeholder="+60..."
                  value={editedOfficer.phone}
                  onChange={e => setEditedOfficer({ ...editedOfficer, phone: e.target.value })}
                  className="pl-9 rounded-xl border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <Input
                  placeholder="email@..."
                  value={editedOfficer.email}
                  onChange={e => setEditedOfficer({ ...editedOfficer, email: e.target.value })}
                  className="pl-9 rounded-xl border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Telegram Settings Section */}
          <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-4 h-4 text-[#26A5E4]" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Telegram Notifications</span>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Telegram Chat ID</Label>
                <Input
                  value={editedOfficer.telegram_chat_id || ''}
                  onChange={(e) => setEditedOfficer({...editedOfficer, telegram_chat_id: e.target.value})}
                  placeholder="Enter Telegram Chat ID"
                  className="mt-1 bg-white dark:bg-slate-800"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Get Chat ID by messaging @BotFather then @your_bot
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Receive Emergency Alerts</p>
                  <p className="text-xs text-muted-foreground">Get instant notifications for emergencies</p>
                </div>
                <Switch
                  checked={editedOfficer.receive_emergency !== false}
                  onCheckedChange={(checked) => setEditedOfficer({...editedOfficer, receive_emergency: checked})}
                  className="data-[state=checked]:bg-[#D4A853]"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Daily Digest</p>
                  <p className="text-xs text-muted-foreground">Receive daily performance summary</p>
                </div>
                <Switch
                  checked={editedOfficer.receive_daily_digest || false}
                  onCheckedChange={(checked) => setEditedOfficer({...editedOfficer, receive_daily_digest: checked})}
                  className="data-[state=checked]:bg-[#D4A853]"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={onClose} className="rounded-xl dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-700" disabled={isLoading}>
              Cancel
            </Button>
            <Button
              className="bg-[#D4A853] hover:bg-[#C49A48] text-white rounded-xl"
              onClick={handleSave}
              disabled={isLoading}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditOfficerModal;

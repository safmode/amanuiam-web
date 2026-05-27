// components/dashboard/AddOfficerModal.jsx
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Phone, Mail, MessageCircle } from 'lucide-react';

const AddOfficerModal = ({ isOpen, onClose, onAdd, isLoading, ranks, departments }) => {
  const [newOfficer, setNewOfficer] = useState({
    officerName: '',
    rank: '',
    department: '',
    phone: '',
    email: '',
    telegram_chat_id: '',
    receive_emergency: true,
    receive_daily_digest: false
  });

  const handleSubmit = () => {
    onAdd(newOfficer);
    // Reset form
    setNewOfficer({
      officerName: '',
      rank: '',
      department: '',
      phone: '',
      email: '',
      telegram_chat_id: '',
      receive_emergency: true,
      receive_daily_digest: false
    });
  };

  const handleClose = () => {
    setNewOfficer({
      officerName: '',
      rank: '',
      department: '',
      phone: '',
      email: '',
      telegram_chat_id: '',
      receive_emergency: true,
      receive_daily_digest: false
    });
    onClose();
  };

  const availableRanks = ranks?.length > 0 ? ranks : [
    'Junior Officer',
    'Security Officer',
    'Senior Security Officer',
    'Chief Security Officer'
  ];

  const availableDepartments = departments?.length > 0 ? departments : [
    'Operations',
    'Patrol',
    'Administration'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl p-0 overflow-hidden dark:bg-slate-800 dark:border-slate-700">
        <DialogHeader className="p-6 pb-4 bg-gray-50 dark:bg-slate-800">
          <DialogTitle className="text-center text-lg font-semibold text-gray-900 dark:text-gray-100">Add New Officer</DialogTitle>
          <DialogDescription className="text-center text-sm text-gray-500 dark:text-gray-400">Fill in the details to register a new officer.</DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-4 pt-4">
          {/* Basic Information */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Officer full name"
                value={newOfficer.officerName}
                onChange={e => setNewOfficer({ ...newOfficer, officerName: e.target.value })}
                className="pl-9 rounded-xl border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Rank</Label>
              <Select value={newOfficer.rank} onValueChange={v => setNewOfficer({ ...newOfficer, rank: v })}>
                <SelectTrigger className="rounded-xl border-gray-200 bg-gray-50 text-gray-900 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200">
                  <SelectValue placeholder="Select rank" />
                </SelectTrigger>
                <SelectContent className="rounded-xl dark:bg-slate-800 dark:border-slate-700">
                  {availableRanks.map(rank => (
                    <SelectItem key={rank} value={rank} className="dark:text-gray-300 dark:focus:bg-slate-700">{rank}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Department</Label>
              <Select value={newOfficer.department} onValueChange={v => setNewOfficer({ ...newOfficer, department: v })}>
                <SelectTrigger className="rounded-xl border-gray-200 bg-gray-50 text-gray-900 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200">
                  <SelectValue placeholder="Select dept" />
                </SelectTrigger>
                <SelectContent className="rounded-xl dark:bg-slate-800 dark:border-slate-700">
                  {availableDepartments.map(dept => (
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
                  value={newOfficer.phone}
                  onChange={e => setNewOfficer({ ...newOfficer, phone: e.target.value })}
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
                  value={newOfficer.email}
                  onChange={e => setNewOfficer({ ...newOfficer, email: e.target.value })}
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
                  value={newOfficer.telegram_chat_id || ''}
                  onChange={(e) => setNewOfficer({...newOfficer, telegram_chat_id: e.target.value})}
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
                  checked={newOfficer.receive_emergency !== false}
                  onCheckedChange={(checked) => setNewOfficer({...newOfficer, receive_emergency: checked})}
                  className="data-[state=checked]:bg-[#D4A853]"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Daily Digest</p>
                  <p className="text-xs text-muted-foreground">Receive daily performance summary</p>
                </div>
                <Switch
                  checked={newOfficer.receive_daily_digest || false}
                  onCheckedChange={(checked) => setNewOfficer({...newOfficer, receive_daily_digest: checked})}
                  className="data-[state=checked]:bg-[#D4A853]"
                />
              </div>
            </div>
          </div>

          <Button
            className="w-full rounded-xl bg-[#D4A853] hover:bg-[#C49A48] text-white mt-2"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            Add Officer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddOfficerModal;

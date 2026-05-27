// components/dashboard/SafetyTips.jsx - Simplified General Announcements
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Loader2, Plus, X, Bell, Shield, History, Megaphone } from 'lucide-react';
import axios from 'axios';

const SafetyTips = () => {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newTip, setNewTip] = useState({
    title: '',
    message: '',
    type: 'announcement'
  });

  // Pre-defined templates
  const templates = [
    { title: "Night Safety", message: "When walking at night, stay in well-lit areas and walk with friends.", type: "safety_tip" },
    { title: "Theft Prevention", message: "Don't leave laptops or bags unattended in public areas.", type: "safety_tip" },
    { title: "Emergency Contacts", message: "HOTLINE (24H): +603-6421 5555 / 4173 | Email: osem@iium.edu.my. Any emergency cases can also be contacted through this.", type: "announcement" },
    { title: "Weather Alert", message: "Heavy rain expected. Drive carefully and avoid driving recklessly.", type: "reminder" },
  ];

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('/api/safety-tips/history');
      setTips(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newTip.title || !newTip.message) {
      alert('Please fill in title and message');
      return;
    }

    setSending(true);
    try {
      await axios.post('/api/safety-tips/send', newTip);
      alert('✅ Announcement sent to all students!');
      setNewTip({ title: '', message: '', type: 'announcement' });
      setShowForm(false);
      fetchHistory();
    } catch (error) {
      alert('❌ Failed to send announcement');
      console.error('Send error:', error);
    } finally {
      setSending(false);
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'safety_tip': return '🛡️';
      case 'reminder': return '🔔';
      case 'weather': return '🌧️';
      default: return '📢';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-[#D4A853]/10 flex items-center justify-center">
                  <Megaphone className="w-4 h-4 text-[#D4A853]" />
                </div>
                <h3 className="text-lg font-semibold">Broadcast Announcements</h3>
              </div>
              <p className="text-sm text-muted-foreground ml-10">Send announcements to all students' mobile devices</p>
            </div>
            {!showForm && (
              <Button
                className="bg-[#D4A853] hover:bg-[#C49A48] text-white rounded-xl gap-2"
                onClick={() => setShowForm(true)}
              >
                <Plus className="w-4 h-4" />
                New Announcement
              </Button>
            )}
          </div>

          {/* Quick Templates */}
          {!showForm && (
            <div className="mb-6 ml-10">
              <p className="text-sm font-medium mb-2">Quick Templates</p>
              <div className="flex flex-wrap gap-2">
                {templates.map((template, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-sm rounded-full"
                    onClick={() => {
                      setNewTip({
                        title: template.title,
                        message: template.message,
                        type: 'announcement'
                      });
                      setShowForm(true);
                    }}
                  >
                    {getTypeIcon(template.type)} {template.title}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Send Form - Simplified */}
          {showForm && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-700/30 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Create New Announcement</h4>
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Title</Label>
                  <Input
                    value={newTip.title}
                    onChange={(e) => setNewTip({...newTip, title: e.target.value})}
                    placeholder="Announcement title"
                    maxLength={80}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{newTip.title.length}/80 characters</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Message</Label>
                  <Textarea
                    value={newTip.message}
                    onChange={(e) => setNewTip({...newTip, message: e.target.value})}
                    placeholder="Write your announcement message here..."
                    rows={4}
                    className="mt-1"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{newTip.message.length}/500 characters</p>
                </div>

                {/* Preview */}
                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#D4A853]/10 flex items-center justify-center flex-shrink-0">
                      <Megaphone className="w-4 h-4 text-[#D4A853]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{newTip.title || 'Your Announcement Title'}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {newTip.message || 'Your announcement message will appear here...'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">📢 General Announcement</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button
                    className="bg-[#D4A853] hover:bg-[#C49A48] text-white gap-2"
                    onClick={handleSend}
                    disabled={sending || !newTip.title || !newTip.message}
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send to All Students
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Recent Announcements History */}
          <div className="ml-10">
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-muted-foreground" />
              <p className="font-medium">Recent Announcements</p>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#D4A853] mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">Loading...</p>
              </div>
            ) : tips.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No announcements sent yet</p>
                <p className="text-xs mt-1">Click "New Announcement" to get started</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {tips.map((tip, i) => (
                  <div key={i} className="p-3 bg-gray-50 dark:bg-slate-700/30 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#D4A853]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Megaphone className="w-3 h-3 text-[#D4A853]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{tip.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(tip.created_at).toLocaleDateString()} at {new Date(tip.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{tip.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-green-600 dark:text-green-400">
                            ✓ Sent to all students
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SafetyTips;

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, MapPin, Phone, Clock, ChevronRight, X } from 'lucide-react';
import { router } from '@inertiajs/react';

export const EmergencyAlertBanner = ({ alerts = [] }) => {
  const [dismissedAlerts, setDismissedAlerts] = useState([]);

  // Get active alerts that haven't been dismissed
  const activeAlerts = alerts.filter(
    alert => alert.status === 'active' && !dismissedAlerts.includes(alert.id)
  );

  // If no active alerts, don't render anything
  if (activeAlerts.length === 0) {
    return null;
  }

  const handleDismiss = (alertId) => {
    setDismissedAlerts([...dismissedAlerts, alertId]);
  };

  const handleRespond = (alert) => {
    // Navigate to alert details or emergency response page
    router.visit(`/Alerts`);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getAlertTypeLabel = (type) => {
    const labels = {
      panic_button: 'Panic Button',
      fire_alarm: 'Fire Alarm',
      security_breach: 'Security Breach',
      medical_emergency: 'Medical Emergency',
    };
    return labels[type] || 'Emergency Alert';
  };

  return (
    <div className="space-y-4 mb-6">
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      {activeAlerts.map((alert) => (
        <div
          key={alert.id}
          className="relative bg-gradient-to-r from-red-500 to-red-600 rounded-2xl shadow-lg overflow-hidden animate-pulse-slow"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-transparent"></div>

          <div className="relative px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Alert Icon */}
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center animate-pulse-slow">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>

                {/* Alert Details */}
                <div className="text-white">
                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-white/90 text-red-600 text-xs font-semibold px-3 py-1 hover:bg-white">
                      {getAlertTypeLabel(alert.type)}
                    </Badge>
                    <Badge className="bg-red-700 text-white text-xs font-semibold px-3 py-1 border-0">
                      ACTIVE
                    </Badge>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold mb-2">
                    Emergency Alert Triggered
                  </h3>

                  {/* Alert Info */}
                  <div className="flex items-center gap-6 text-sm text-white/95">
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {alert.location}
                    </span>

                    {alert.reporterContact && (
                      <span className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {alert.reporterContact}
                      </span>
                    )}

                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {formatTime(alert.triggeredAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Button
                  className="bg-white text-red-600 hover:bg-red-50 font-semibold px-6 py-2 gap-2 shadow-lg hover:shadow-xl transition-all rounded-lg"
                  onClick={() => handleRespond(alert)}
                >
                  Respond Now
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDismiss(alert.id)}
                  className="hover:bg-white/20 text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

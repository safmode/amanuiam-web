import { useState, useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import { DashboardLayout } from '@/components/dashboard/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertTriangle, Clock, CheckCircle, Radio, Send, Calendar, MapPin, ChevronDown, FileText, User, Phone, Loader2, Mail, Undo2, X, Search, Filter, Shield, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { DispatchOfficerModal } from '@/Components/dashboard/DispatchOfficerModal';
import { AddEmergencyReport } from '@/Components/dashboard/AddEmergencyReport';
import { DecisionModal } from '@/Components/dashboard/DecisionModal';
import { ConfirmationModal } from '@/Components/dashboard/ConfirmationModal';

// Location labels (unchanged)
const locationLabels = {
  'Mahallahs': {
    'Asiah': 'Mahallah Asiah',
    'Aminah': 'Mahallah Aminah',
    'Safiyyah': 'Mahallah Safiyyah',
    'Maryam': 'Mahallah Maryam',
    'Ruqayyah': 'Mahallah Ruqayyah',
    'Ali': 'Mahallah Ali',
    'Faruq': 'Mahallah Faruq',
    'Bilal': 'Mahallah Bilal',
    'Asma': 'Mahallah Asma',
    'Hafsah': 'Mahallah Hafsah',
    'Halimah': 'Mahallah Halimah',
    'Siddiq': 'Mahallah Siddiq',
    'Salahuddin': 'Mahallah Salahuddin',
    'Uthman': 'Mahallah Uthman',
    'Nusaibah': 'Mahallah Nusaibah',
    'Zubair Al-Awwam': 'Mahallah Zubair',
    'Sumayyah': 'Mahallah Sumayyah',
  },
  'Kulliyyahs': {
    'KIRKHS': 'KIRKHS (AHAS KIRKHS)',
    'KICT': 'KICT (ICT)',
    'KOE': 'KOE (Engineering)',
    'KAED': 'KAED (Architecture)',
    'KENMS': 'KENMS (Economics)',
    'AIKOL': 'AIKOL (Law)',
    'KOED': 'KOED (Education)',
  },
  'Facilities': {
    'Dar al-Hikmah Library': 'Dar al-Hikmah Library',
    'Female Sports Complex': 'Female Sports Complex',
    'Saidina Hamzah Stadium': 'Saidina Hamzah Stadium',
    'IIUM Archery Range': 'IIUM Archery Range',
    'UIA Football Turf': 'UIA Football Turf',
    'IIUM Cricket Ground': 'IIUM Cricket Ground',
    'IIUM Rugby Field': 'IIUM Rugby Field',
    'Padang Kawad UIAM': 'Padang Kawad UIAM',
    'IIUM Educare': 'IIUM Educare',
    'Sultan Haji Ahmad Shah Mosque': 'Sultan Haji Ahmad Shah Mosque',
  },
};

const formatLocationName = (locationKey) => {
  if (!locationKey) return 'Unknown Location';
  for (const group of Object.values(locationLabels)) {
    if (group[locationKey]) return group[locationKey];
  }
  return locationKey;
};

// Simple Dropdown Component (unchanged)
const SimpleDropdown = ({ trigger, children, isOpen, onClose, align = 'left' }) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div className="relative" ref={dropdownRef}>
      {trigger}
      {isOpen && (
        <div className={`absolute top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-50 min-w-[320px] ${align === 'right' ? 'right-0' : 'left-0'} dark:bg-slate-800 dark:border-slate-700`}>
          {children}
        </div>
      )}
    </div>
  );
};

// Toast Notification (unchanged)
const showToast = (message, type = 'success') => {
  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm animate-in slide-in-from-bottom-2 ${
    type === 'success' ? 'bg-green-500' : 'bg-red-500'
  }`;
  toast.innerHTML = `<div class="flex items-center gap-2">${type === 'success' ? '✓' : '✗'}<span>${message}</span></div>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
};

// Stat Card Component (unchanged)
const StatCard = ({ icon: Icon, label, value, color }) => {
  const getColorClasses = () => {
    switch (color) {
      case 'red':    return { card: 'bg-white border-red-500/30 dark:bg-red-900/20 dark:border-red-700',    iconBg: 'bg-red-100 dark:bg-red-900/50',    iconColor: 'text-red-600 dark:text-red-400',    valueColor: 'text-red-600 dark:text-red-400' };
      case 'amber':  return { card: 'bg-white border-amber-500/30 dark:bg-amber-900/20 dark:border-amber-700', iconBg: 'bg-amber-100 dark:bg-amber-900/50', iconColor: 'text-amber-600 dark:text-amber-400', valueColor: 'text-amber-600 dark:text-amber-400' };
      case 'green':  return { card: 'bg-white border-green-500/30 dark:bg-green-900/20 dark:border-green-700', iconBg: 'bg-green-100 dark:bg-green-900/50', iconColor: 'text-green-600 dark:text-green-400', valueColor: 'text-green-600 dark:text-green-400' };
      case 'blue':   return { card: 'bg-white border-blue-500/30 dark:bg-blue-900/20 dark:border-blue-700',   iconBg: 'bg-blue-100 dark:bg-blue-900/50',   iconColor: 'text-blue-600 dark:text-blue-400',   valueColor: 'text-blue-600 dark:text-blue-400' };
      default:       return { card: 'bg-white border-gray-500/30 dark:bg-gray-900/20 dark:border-gray-700',   iconBg: 'bg-gray-100 dark:bg-gray-900/50',   iconColor: 'text-gray-600 dark:text-gray-400',   valueColor: 'text-gray-600 dark:text-gray-400' };
    }
  };
  const classes = getColorClasses();
  return (
    <Card className={`${classes.card} rounded-2xl shadow-sm hover:shadow-md transition-shadow`}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl ${classes.iconBg} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${classes.iconColor}`} />
        </div>
        <div>
          <p className={`text-2xl font-bold ${classes.valueColor}`}>{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
};

// Status Badge Component (unchanged)
const StatusBadge = ({ status }) => {
  const config = {
    active:     { label: 'Active',     className: 'bg-red-500 dark:bg-red-600' },
    responding: { label: 'Responding', className: 'bg-amber-500 dark:bg-amber-600' },
    resolved:   { label: 'Resolved',   className: 'bg-green-500 dark:bg-green-600' },
  };
  const { label, className } = config[status] || config.active;
  return <Badge className={`${className} text-white text-[11px]`}>{label}</Badge>;
};

// Alert Card Component (unchanged - uses props)
const AlertCard = ({ alert, onClick, onAction, isDispatching, isReverting, getTimeAgo, formatDate, onDelete }) => {
  const getAlertCardStyle = (status) => {
    switch (status) {
      case 'active':     return 'border-l-red-500 bg-red-50/30 dark:bg-red-950/20 hover:border-l-red-600';
      case 'responding': return 'border-l-amber-500 bg-amber-50/30 dark:bg-amber-950/20 hover:border-l-amber-600';
      case 'resolved':   return 'border-l-green-500 bg-green-50/30 dark:bg-green-950/20 hover:border-l-green-600';
      default:           return '';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':     return <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />;
      case 'responding': return <Radio className="w-5 h-5 text-amber-500 dark:text-amber-400" />;
      case 'resolved':   return <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />;
      default:           return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'active':     return 'bg-red-100 dark:bg-red-900/30';
      case 'responding': return 'bg-amber-100 dark:bg-amber-900/30';
      case 'resolved':   return 'bg-green-100 dark:bg-green-900/30';
      default:           return 'bg-gray-100';
    }
  };

  const getActionButton = () => {
    if (alert.status === 'active') {
      return (
        <Button
          variant="ghost" size="sm"
          className="bg-red-500 text-white hover:bg-red-600 rounded-lg gap-1.5 px-3 h-8"
          onClick={(e) => { e.stopPropagation(); onAction('dispatch', alert); }}
          disabled={isDispatching}
        >
          {isDispatching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3 h-3" />}
          <span className="text-xs font-medium">Dispatch</span>
        </Button>
      );
    } else if (alert.status === 'responding') {
      return (
        <Button
          variant="ghost" size="sm"
          className="bg-green-500 text-white hover:bg-green-600 rounded-lg gap-1.5 px-3 h-8"
          onClick={(e) => { e.stopPropagation(); onAction('resolve', alert); }}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Resolve</span>
        </Button>
      );
    } else if (alert.status === 'resolved') {
      return (
        <div className="flex gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost" size="sm"
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg px-3 h-8 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-slate-700"
                onClick={(e) => e.stopPropagation()}
              >
                <Undo2 className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl min-w-[160px] dark:bg-slate-800 dark:border-slate-700">
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onAction('revertToResponding', alert); }}
                className="gap-2 text-amber-600 focus:text-amber-600 focus:bg-amber-50 cursor-pointer text-sm dark:text-amber-400 dark:focus:bg-amber-950/30"
                disabled={isReverting}
              >
                <Undo2 className="w-3.5 h-3.5" /><span>Revert to Responding</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onAction('revertToActive', alert); }}
                className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer text-sm dark:text-red-400 dark:focus:bg-red-950/30"
                disabled={isReverting}
              >
                <Undo2 className="w-3.5 h-3.5" /><span>Revert to Active</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost" size="sm"
            className="bg-transparent hover:bg-gray-100 rounded-lg px-3 h-8 dark:hover:bg-slate-700"
            onClick={(e) => { e.stopPropagation(); onDelete(alert); }}
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </Button>

          <Button
            variant="ghost" size="sm"
            className="bg-amber-500 text-white hover:bg-amber-600 rounded-lg gap-1.5 px-4 h-8"
            onClick={(e) => { e.stopPropagation(); onAction('createReport', alert); }}
          >
            <FileText className="w-4 h-4" />
            <span className="text-xs font-medium">Report</span>
          </Button>
        </div>
      );
    }
    return null;
  };

  const displayLocation = alert.determined_location
    ? formatLocationName(alert.determined_location)
    : (alert.address || alert.location?.mahallah || alert.location || 'Unknown Location');

  return (
    <Card
      className={`border-l-4 ${getAlertCardStyle(alert.status)} rounded-xl cursor-pointer hover:shadow-md transition-all duration-200 dark:bg-slate-800`}
      onClick={() => onClick(alert)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`w-9 h-9 rounded-full ${getStatusBg(alert.status)} flex items-center justify-center shrink-0`}>
              {getStatusIcon(alert.status)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-semibold text-sm text-gray-900 dark:text-gray-200">Emergency Alert</span>
                <StatusBadge status={alert.status} />
                <span className="text-xs text-gray-500 dark:text-gray-400">{getTimeAgo(alert.triggeredAt)}</span>
              </div>
              {alert.student && (
                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5 mb-0.5">
                  <User className="w-3 h-3" />
                  <span>{alert.student.name}</span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="text-xs">{alert.student.matrixNumber}</span>
                </p>
              )}
              <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{displayLocation}</span>
              </p>
            </div>
          </div>
          {getActionButton()}
        </div>
      </CardContent>
    </Card>
  );
};

// Alert Detail Modal (unchanged - too long but identical)
const AlertDetailModal = ({ alert, open, onClose, onAction, formatDate, getTimeAgo, isDispatching, isReverting, onDelete }) => {
  // ... (keep exactly the same as your original)
  // To save space, I'm not repeating it but keep your existing implementation
  const getHeaderColor = () => {
    switch (alert?.status) {
      case 'active':     return 'bg-red-500';
      case 'responding': return 'bg-amber-500';
      case 'resolved':   return 'bg-green-500';
      default:           return 'bg-gray-500';
    }
  };

  const getActionButtons = () => {
    if (!alert) return null;

    if (alert.status === 'active') {
      return (
        <Button
          className="bg-red-500 hover:bg-red-600 text-white rounded-lg gap-2 px-5 h-10 text-sm font-medium"
          onClick={() => onAction('dispatch', alert)}
          disabled={isDispatching}
        >
          {isDispatching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Dispatch Officer
        </Button>
      );
    } else if (alert.status === 'responding') {
      return (
        <Button
          className="bg-green-500 hover:bg-green-600 text-white rounded-lg gap-2 px-5 h-10 text-sm font-medium"
          onClick={() => onAction('resolve', alert)}
        >
          <CheckCircle className="w-4 h-4" />
          Mark as Resolved
        </Button>
      );
    } else if (alert.status === 'resolved') {
      return (
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-lg gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50 h-10 text-sm dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/30">
                <Undo2 className="w-4 h-4" />
                Revert
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-lg min-w-[170px] p-1">
              <DropdownMenuItem
                onClick={() => onAction('revertToResponding', alert)}
                className="gap-2 text-amber-600 text-sm cursor-pointer rounded-md dark:text-amber-400"
                disabled={isReverting}
              >
                <Undo2 className="w-4 h-4" /> To Responding
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onAction('revertToActive', alert)}
                className="gap-2 text-red-600 text-sm cursor-pointer rounded-md dark:text-red-400"
                disabled={isReverting}
              >
                <Undo2 className="w-4 h-4" /> To Active
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            className="rounded-lg gap-1.5 border-red-300 text-red-600 hover:bg-red-50 h-10 text-sm dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
            onClick={() => onDelete(alert)}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg gap-2 px-5 h-10 text-sm font-medium"
            onClick={() => onAction('createReport', alert)}
          >
            <FileText className="w-4 h-4" />
            Create Report
          </Button>
        </div>
      );
    }
    return null;
  };

  if (!alert) return null;

  const displayLocation = alert.determined_location
    ? formatLocationName(alert.determined_location)
    : (alert.address || alert.location?.mahallah || alert.location || 'Unknown');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-xl p-0 overflow-hidden bg-white dark:bg-slate-800 dark:border-slate-700">
        <div className={`px-6 py-4 ${getHeaderColor()} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              {alert.status === 'active' && <AlertTriangle className="w-4 h-4 text-white" />}
              {alert.status === 'responding' && <Radio className="w-4 h-4 text-white" />}
              {alert.status === 'resolved' && <CheckCircle className="w-4 h-4 text-white" />}
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white">Emergency Alert</DialogTitle>
              <p className="text-white/70 text-xs">ID: {alert._id?.slice(-8) || alert.id?.slice(-8) || 'N/A'}</p>
            </div>
          </div>
          <StatusBadge status={alert.status} />
        </div>

        <div className="p-6 space-y-4">
          {/* Reporter Information */}
          <div className="bg-white rounded-lg p-4 border border-gray-200 dark:bg-slate-800/50 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center dark:bg-amber-900/30">
                <User className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">Reporter Information</p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="text-gray-500 dark:text-gray-400">Name:</span>{' '}
                <span className="font-medium text-gray-900 dark:text-gray-200">{alert.student?.name || alert.reporterName || 'Unknown'}</span>
              </p>
              {alert.student?.matrixNumber && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="text-gray-500 dark:text-gray-400">Matrix:</span>{' '}
                  <span className="font-mono text-gray-900 dark:text-gray-200">{alert.student.matrixNumber}</span>
                </p>
              )}
              {alert.student?.phone && (
                <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>{alert.student.phone}</span>
                </p>
              )}
              {alert.student?.email && (
                <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1.5 col-span-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{alert.student.email}</span>
                </p>
              )}
            </div>
          </div>

          {/* Location & Time */}
          <div className="bg-white rounded-lg p-4 border border-gray-200 dark:bg-slate-800/50 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center dark:bg-red-900/30">
                <MapPin className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">Location & Time</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="text-gray-500 dark:text-gray-400">Location:</span>{' '}
                <span className="font-medium text-gray-900 dark:text-gray-200">{displayLocation}</span>
              </p>
              {alert.address && (
                <p className="text-sm text-gray-500 dark:text-gray-400 pl-1">{alert.address}</p>
              )}
              {alert.location?.building && (
                <p className="text-sm text-gray-500 dark:text-gray-400 pl-1">🏢 {alert.location.building}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="text-gray-500 dark:text-gray-400">Triggered:</span>{' '}
                  <span>{formatDate(alert.triggeredAt)}</span>
                </p>
                <p className="text-xs text-gray-400">({getTimeAgo(alert.triggeredAt)})</p>
              </div>
              {alert.resolvedAt && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="text-gray-500 dark:text-gray-400">Resolved:</span>{' '}
                  <span>{formatDate(alert.resolvedAt)}</span>
                </p>
              )}
            </div>
          </div>

          {/* Assigned Officer */}
          {alert.assigned_officer_name && (
            <div className="bg-white rounded-lg p-4 border border-gray-200 dark:bg-slate-800/50 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center dark:bg-blue-900/30">
                  <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">Assigned Officer</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="text-gray-500 dark:text-gray-400">Officer:</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-gray-200">{alert.assigned_officer_name}</span>
                </p>
                {alert.dispatched_at && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-gray-500 dark:text-gray-400">Dispatched:</span>{' '}
                    <span>{formatDate(alert.dispatched_at)}</span>
                  </p>
                )}
                {alert.dispatch_notes && (
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                    <p className="text-xs text-gray-500 mb-1.5 dark:text-gray-400">Dispatch Notes:</p>
                    <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700 text-sm text-gray-700 dark:text-gray-300 max-h-28 overflow-y-auto whitespace-pre-wrap">
                      {alert.dispatch_notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-slate-700 mt-2">
            <Button variant="outline" className="rounded-lg h-10 px-5 text-sm text-gray-700 border-gray-300 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-700" onClick={onClose}>
              Close
            </Button>
            {getActionButtons()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================
// MAIN ALERTS COMPONENT - CONVERTED TO PURE INERTIA
// ============================================================

const Alerts = () => {
  const { alertsData, emergencyStats } = usePage().props;

  // State
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedAlertForDispatch, setSelectedAlertForDispatch] = useState(null);

  const [globalStats, setGlobalStats] = useState({ active: 0, responding: 0, resolved: 0, total: 0 });

  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [showAddReportModal, setShowAddReportModal] = useState(false);

  const [alertToResolve, setAlertToResolve] = useState(null);
  const [alertForReport, setAlertForReport] = useState(null);

  const [isDispatching, setIsDispatching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [datePreset, setDatePreset] = useState('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [filters, setFilters] = useState({ status: [], locations: [] });

  const [pagination, setPagination] = useState({
    current_page: 1, per_page: 10, total: 0,
    last_page: 1, from: null, to: null,
  });

  const statusOptions = [
    { value: 'active',     label: 'Active' },
    { value: 'responding', label: 'Responding' },
    { value: 'resolved',   label: 'Resolved' },
  ];

  const searchTimeoutRef = useRef(null);

  // Load data from server props
  useEffect(() => {
    if (alertsData) {
      setAlerts(alertsData.data || []);
      setPagination(alertsData.pagination || {
        current_page: 1, per_page: 10, total: 0, last_page: 1, from: null, to: null
      });
      setLoading(false);
    }
    if (emergencyStats) {
      setGlobalStats({
        active: emergencyStats.active || 0,
        responding: emergencyStats.responding || 0,
        resolved: emergencyStats.resolved || 0,
        total: (emergencyStats.active || 0) + (emergencyStats.responding || 0) + (emergencyStats.resolved || 0),
      });
    }
  }, [alertsData, emergencyStats]);

  // Refresh data using Inertia
  const refreshData = () => {
    router.reload({ only: ['alertsData', 'emergencyStats'] });
  };

  // Fetch emergencies with filters using Inertia
  const fetchEmergencies = (page = 1, perPage = pagination.per_page) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('per_page', perPage);
    if (filters.status.length > 0) params.append('status', filters.status.join(','));
    if (filters.locations.length > 0) params.append('locations', filters.locations.join(','));

    router.visit(`/api/emergencies?${params.toString()}`, {
      method: 'get',
      preserveScroll: true,
      preserveState: false,
      only: ['alertsData'],
      onSuccess: (page) => {
        setAlerts(page.props.alertsData?.data || []);
        setPagination(page.props.alertsData?.pagination || {
          current_page: 1, per_page: 10, total: 0, last_page: 1, from: null, to: null
        });
        setLoading(false);
        window.dispatchEvent(new CustomEvent('emergency-updated'));
      },
      onError: () => {
        setLoading(false);
        showToast('Failed to load emergencies', 'error');
      }
    });
  };

  // Delete emergency using Inertia
  const handleDeleteEmergency = async (alert) => {
    const alertId = alert._id || alert.id;
    if (confirm('Are you sure you want to delete this emergency record? This action cannot be undone.')) {
      setIsDeleting(true);
      router.delete(`/api/emergencies/${alertId}`, {
        preserveScroll: true,
        onSuccess: () => {
          showToast('Emergency record deleted successfully', 'success');
          setSelectedAlert(null);
          fetchEmergencies(pagination.current_page, pagination.per_page);
          refreshData();
        },
        onError: (error) => {
          showToast(error.response?.data?.error || 'Failed to delete emergency', 'error');
        },
        onFinish: () => setIsDeleting(false)
      });
    }
  };

  // Revert status using Inertia
  const handleRevertStatus = async (alert, newStatus) => {
    const alertId = alert._id || alert.id;
    setIsReverting(true);
    // Optimistic update
    setAlerts(prev => prev.map(a => (a._id === alertId || a.id === alertId) ? { ...a, status: newStatus } : a));
    if (selectedAlert && (selectedAlert._id === alertId || selectedAlert.id === alertId)) {
      setSelectedAlert({ ...selectedAlert, status: newStatus });
    }

    router.put(`/api/emergencies/${alertId}/revert`, { status: newStatus }, {
      preserveScroll: true,
      onSuccess: () => {
        fetchEmergencies(pagination.current_page, pagination.per_page);
        refreshData();
        setSelectedAlert(null);
      },
      onError: () => {
        fetchEmergencies(pagination.current_page, pagination.per_page);
      },
      onFinish: () => setIsReverting(false)
    });
  };

  // Dispatch officer using Inertia
  const handleDispatchOfficer = async (dispatchData) => {
    if (!selectedAlertForDispatch) return;
    const alertId = selectedAlertForDispatch._id || selectedAlertForDispatch.id;
    setIsDispatching(true);

    router.put(`/api/emergencies/${alertId}/dispatch`, dispatchData, {
      preserveScroll: true,
      onSuccess: () => {
        showToast(`Officer ${dispatchData.officerName} has been dispatched successfully!`, 'success');
        fetchEmergencies(pagination.current_page, pagination.per_page);
        refreshData();
        setShowDispatchModal(false);
        setSelectedAlertForDispatch(null);
      },
      onError: (error) => {
        showToast(error.response?.data?.error || 'Failed to dispatch officer', 'error');
      },
      onFinish: () => setIsDispatching(false)
    });
  };

  // Resolve emergency using Inertia
  const handleConfirmResolve = async () => {
    if (!alertToResolve) return;
    const alertId = alertToResolve._id || alertToResolve.id;
    setIsResolving(true);

    router.put(`/api/emergencies/${alertId}/resolve`, {}, {
      preserveScroll: true,
      onSuccess: () => {
        fetchEmergencies(pagination.current_page, pagination.per_page);
        refreshData();
        setShowConfirmationModal(false);
        setAlertForReport(alertToResolve);
        setAlertToResolve(null);
        setShowDecisionModal(true);
      },
      onError: () => {
        showToast('Failed to mark as resolved', 'error');
      },
      onFinish: () => setIsResolving(false)
    });
  };

  // Save report using Inertia
  const handleSaveReport = async (reportData) => {
    setIsSubmitting(true);
    router.post('/Reports', reportData, {
      preserveScroll: true,
      onSuccess: () => {
        showToast('Report created successfully!', 'success');
        setShowAddReportModal(false);
        setAlertForReport(null);
      },
      onError: (error) => {
        showToast(error.response?.data?.message || error.response?.data?.error || 'Failed to create report', 'error');
      },
      onFinish: () => setIsSubmitting(false)
    });
  };

  // Helpers
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-MY', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getTimeAgo = (dateString) => {
    const diffMs = new Date() - new Date(dateString);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffHours / 24)} days ago`;
  };

  const getFilterCount = () => filters.status.length + filters.locations.length;

  const getDateFilterLabel = () => {
    if (datePreset === 'today') return 'Today';
    if (datePreset === 'week') return 'This Week';
    if (datePreset === 'month') return 'This Month';
    if (customDateFrom && customDateTo) return `${customDateFrom} - ${customDateTo}`;
    if (customDateFrom) return `From ${customDateFrom}`;
    if (customDateTo) return `Until ${customDateTo}`;
    return 'Date Range';
  };

  const hasActiveFilters = getFilterCount() > 0 || datePreset !== 'all' || customDateFrom || customDateTo || searchQuery;

  const getPageNumbers = () => {
    const { last_page: totalPages, current_page: currentPage } = pagination;
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  const toggleFilter = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(v => v !== value)
        : [...prev[filterType], value],
    }));
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setDatePreset('all');
    setCustomDateFrom('');
    setCustomDateTo('');
    setFilters({ status: [], locations: [] });
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.last_page) {
      fetchEmergencies(newPage, pagination.per_page);
    }
  };

  const handlePerPageChange = (newPerPage) => {
    setPagination(prev => ({ ...prev, per_page: newPerPage }));
    fetchEmergencies(1, newPerPage);
  };

  const handleResolveClick = (alert) => {
    setAlertToResolve(alert);
    setShowConfirmationModal(true);
  };

  const handleDecisionYes = () => { setShowDecisionModal(false); setShowAddReportModal(true); };
  const handleDecisionNo  = () => { setShowDecisionModal(false); setAlertForReport(null); showToast('Report creation skipped', 'success'); };

  const handleAction = async (action, alert) => {
    switch (action) {
      case 'dispatch':          setSelectedAlertForDispatch(alert); setShowDispatchModal(true); break;
      case 'resolve':           handleResolveClick(alert); setSelectedAlert(null); break;
      case 'createReport':      setAlertForReport(alert); setShowAddReportModal(true); break;
      case 'revertToResponding': await handleRevertStatus(alert, 'responding'); break;
      case 'revertToActive':    await handleRevertStatus(alert, 'active'); break;
    }
  };

  // Apply filters on change
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchEmergencies(1, pagination.per_page);
    }, 300);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [filters.status, filters.locations, pagination.per_page]);

  useEffect(() => {
    fetchEmergencies();
    const interval = setInterval(() => {
      refreshData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Client-side search + date filtering on the current page
  const filteredAlerts = alerts.filter(alert => {
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const studentName = alert.student?.name?.toLowerCase() || '';
        const matrixNumber = alert.student?.matrixNumber?.toLowerCase() || '';
        const location = alert.address?.toLowerCase() || alert.location?.mahallah?.toLowerCase() || '';
        const determinedLocation = alert.determined_location?.toLowerCase() || '';
        if (!studentName.includes(q) && !matrixNumber.includes(q) && !location.includes(q) && !determinedLocation.includes(q)) return false;
    }

    if (filters.status.length > 0 && !filters.status.includes(alert.status)) return false;

    if (filters.locations.length > 0) {
        if (!filters.locations.includes(alert.determined_location)) return false;
    }

    const alertDate = new Date(alert.triggeredAt);
    alertDate.setHours(0, 0, 0, 0);
    if (datePreset === 'today') {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        if (alertDate.getTime() !== today.getTime()) return false;
    } else if (datePreset === 'week') {
        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7); weekAgo.setHours(0, 0, 0, 0);
        if (alertDate < weekAgo) return false;
    } else if (datePreset === 'month') {
        const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1); monthAgo.setHours(0, 0, 0, 0);
        if (alertDate < monthAgo) return false;
    } else if (customDateFrom || customDateTo) {
        if (customDateFrom) { const from = new Date(customDateFrom); from.setHours(0,0,0,0); if (alertDate < from) return false; }
        if (customDateTo) { const to = new Date(customDateTo); to.setHours(23,59,59,999); if (alertDate > to) return false; }
    }

    return true;
  });

  return (
    <DashboardLayout title="Emergency Alerts" subtitle="Monitor and respond to emergency situations">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={AlertTriangle} label="Active"       value={globalStats.active}    color="red"   />
        <StatCard icon={Radio}         label="Responding"   value={globalStats.responding} color="amber" />
        <StatCard icon={CheckCircle}   label="Resolved"     value={globalStats.resolved}   color="green" />
        <StatCard icon={Clock}         label="Total Alerts" value={globalStats.total}      color="blue"  />
      </div>

      <Card className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border-border">
        <CardContent className="p-6">

          {/* Filter Bar */}
          <div className="flex flex-wrap gap-3 mb-4">

            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search alerts..."
                className="pl-10 bg-gray-50 border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filters Dropdown */}
            <SimpleDropdown
              isOpen={showFilterDropdown}
              onClose={() => setShowFilterDropdown(false)}
              align="left"
              trigger={
                <Button
                  variant={getFilterCount() > 0 ? 'default' : 'outline'}
                  className={`gap-2 rounded-xl relative ${getFilterCount() > 0 ? 'bg-[#D4A853] hover:bg-[#C49A48] text-white' : 'border-gray-200 text-gray-700 hover:bg-gray-50'} dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700`}
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {getFilterCount() > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {getFilterCount()}
                    </span>
                  )}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              }
            >
              <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
                {/* Status Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">Status</Label>
                    {filters.status.length > 0 && (
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, status: [] }))}
                        className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {statusOptions.map(option => (
                      <label key={option.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded dark:hover:bg-slate-700">
                        <input
                          type="checkbox"
                          checked={filters.status.includes(option.value)}
                          onChange={() => toggleFilter('status', option.value)}
                          className="rounded border-gray-300 bg-white dark:border-slate-600 dark:bg-slate-700 text-[#D4A853]"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-slate-700" />

                {/* Locations Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">Locations</Label>
                    {filters.locations.length > 0 && (
                      <button onClick={() => setFilters(prev => ({ ...prev, locations: [] }))} className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="space-y-4">
                    {Object.entries(locationLabels).map(([groupName, locationsGroup]) => (
                      <div key={groupName}>
                        <Label className="text-xs font-semibold text-gray-500 mb-2 block dark:text-gray-400">{groupName}</Label>
                        <div className="space-y-2 pl-2">
                          {Object.entries(locationsGroup).map(([key, label]) => (
                            <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded dark:hover:bg-slate-700">
                              <input
                                type="checkbox"
                                checked={filters.locations.includes(key)}
                                onChange={() => toggleFilter('locations', key)}
                                className="rounded border-gray-300 bg-white dark:border-slate-600 dark:bg-slate-700 text-[#D4A853]"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-slate-700 pt-3">
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => { setFilters({ status: [], locations: [] }); setShowFilterDropdown(false); }}
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"
                  >
                    Clear All Filters
                  </Button>
                </div>
              </div>
            </SimpleDropdown>

            {/* Date Range Dropdown */}
            <SimpleDropdown
              isOpen={showDateDropdown}
              onClose={() => setShowDateDropdown(false)}
              align="right"
              trigger={
                <Button
                  variant={(datePreset !== 'all' || customDateFrom || customDateTo) ? 'default' : 'outline'}
                  className={`gap-2 rounded-xl relative ${(datePreset !== 'all' || customDateFrom || customDateTo) ? 'bg-[#D4A853] hover:bg-[#C49A48] text-white' : 'border-gray-200 text-gray-700 hover:bg-gray-50'} dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700`}
                  onClick={() => setShowDateDropdown(!showDateDropdown)}
                >
                  <Calendar className="w-4 h-4" />
                  {getDateFilterLabel()}
                  {(datePreset !== 'all' || customDateFrom || customDateTo) && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">1</span>
                  )}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              }
            >
              <div className="p-4 min-w-[260px] space-y-4 max-h-[400px] overflow-y-auto">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">Time Period</Label>
                    {(datePreset !== 'all' || customDateFrom || customDateTo) && (
                      <button onClick={() => { setDatePreset('all'); setCustomDateFrom(''); setCustomDateTo(''); setShowDateDropdown(false); }} className="text-xs text-red-500 hover:text-red-700 dark:text-red-400">Clear</button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {[
                      { value: 'today', label: 'Today' },
                      { value: 'week',  label: 'This Week' },
                      { value: 'month', label: 'This Month' },
                      { value: 'all',   label: 'All Time' },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => {
                          const today = new Date();
                          if (value === 'today') {
                            const d = today.toISOString().split('T')[0];
                            setCustomDateFrom(d); setCustomDateTo(d);
                          } else if (value === 'week') {
                            const start = new Date(today); start.setDate(today.getDate() - today.getDay());
                            const end   = new Date(today); end.setDate(today.getDate() + (6 - today.getDay()));
                            setCustomDateFrom(start.toISOString().split('T')[0]);
                            setCustomDateTo(end.toISOString().split('T')[0]);
                          } else if (value === 'month') {
                            const start = new Date(today.getFullYear(), today.getMonth(), 1);
                            const end   = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                            setCustomDateFrom(start.toISOString().split('T')[0]);
                            setCustomDateTo(end.toISOString().split('T')[0]);
                          } else {
                            setCustomDateFrom(''); setCustomDateTo('');
                          }
                          setDatePreset(value);
                          setShowDateDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          datePreset === value
                            ? 'bg-[#D4A853] text-white'
                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-slate-700" />

                <div>
                  <Label className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-200">Custom Range</Label>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block dark:text-gray-400">From</Label>
                      <Input type="date" value={customDateFrom} onChange={(e) => { setCustomDateFrom(e.target.value); setDatePreset('custom'); }} className="bg-gray-50 border-gray-200 rounded-lg text-sm h-9 text-gray-900 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200" />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block dark:text-gray-400">To</Label>
                      <Input type="date" value={customDateTo} onChange={(e) => { setCustomDateTo(e.target.value); setDatePreset('custom'); }} className="bg-gray-50 border-gray-200 rounded-lg text-sm h-9 text-gray-900 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200" />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" className="flex-1 rounded-lg border-gray-200 text-gray-700 dark:border-slate-700 dark:text-gray-300" onClick={() => { setCustomDateFrom(''); setCustomDateTo(''); setDatePreset('all'); setShowDateDropdown(false); }}>Clear</Button>
                      <Button className="flex-1 bg-[#D4A853] hover:bg-[#C49A48] rounded-lg text-white" onClick={() => setShowDateDropdown(false)}>Apply</Button>
                    </div>
                  </div>
                </div>
              </div>
            </SimpleDropdown>

            {hasActiveFilters && (
              <Button variant="ghost" className="gap-2 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30" onClick={clearAllFilters}>
                <X className="w-4 h-4" />Clear All
              </Button>
            )}
          </div>

          {/* Active Filter Tags */}
          {hasActiveFilters && (
            <div className="mb-4 flex flex-wrap gap-2">
              {filters.status.map(s => (
                <Badge key={s} variant="secondary" className="gap-1 px-2 py-1 bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600">
                  {s === 'active' ? 'Active' : s === 'responding' ? 'Responding' : 'Resolved'}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => toggleFilter('status', s)} />
                </Badge>
              ))}
              {filters.locations.map(l => {
                let displayName = l;
                for (const group of Object.values(locationLabels)) {
                  if (group[l]) { displayName = group[l]; break; }
                }
                return (
                  <Badge key={l} variant="secondary" className="gap-1 px-2 py-1 bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600">
                    <MapPin className="w-3 h-3" />
                    {displayName}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => toggleFilter('locations', l)} />
                  </Badge>
                );
              })}
              {(datePreset !== 'all' || customDateFrom || customDateTo) && (
                <Badge variant="secondary" className="gap-1 px-2 py-1 bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600">
                  <Calendar className="w-3 h-3" />{getDateFilterLabel()}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => { setDatePreset('all'); setCustomDateFrom(''); setCustomDateTo(''); }} />
                </Badge>
              )}
              {searchQuery && (
                <Badge variant="secondary" className="gap-1 px-2 py-1 bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600">
                  Search: {searchQuery}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                </Badge>
              )}
            </div>
          )}

          {/* Alerts List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#D4A853]" />
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4 dark:text-green-400" />
              <p className="text-gray-500 dark:text-gray-400">No alerts match your filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map(alert => (
                <AlertCard
                  key={alert._id || alert.id}
                  alert={alert}
                  onClick={setSelectedAlert}
                  onAction={handleAction}
                  onDelete={handleDeleteEmergency}
                  isDispatching={isDispatching}
                  isReverting={isReverting}
                  getTimeAgo={getTimeAgo}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.total > 0 && (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {pagination.from} to {pagination.to} of {pagination.total} alerts
              </p>
              {pagination.last_page > 1 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 mr-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Rows per page:</span>
                    <select
                      value={pagination.per_page}
                      onChange={(e) => handlePerPageChange(parseInt(e.target.value))}
                      className="px-2 py-1 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 text-gray-700 dark:text-gray-300 text-sm"
                    >
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.current_page - 1)} disabled={pagination.current_page === 1 || loading} className="rounded-lg border-gray-200 text-gray-700 dark:border-slate-700 dark:text-gray-300">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex gap-1">
                    {getPageNumbers().map((page, idx) =>
                      page === '...' ? (
                        <span key={idx} className="px-3 py-1 text-sm text-gray-500 dark:text-gray-400">...</span>
                      ) : (
                        <Button
                          key={page}
                          variant={pagination.current_page === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          disabled={loading}
                          className={`rounded-lg min-w-[36px] ${
                            pagination.current_page === page
                              ? 'bg-[#D4A853] hover:bg-[#C49A48] text-white'
                              : 'border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-700'
                          }`}
                        >
                          {page}
                        </Button>
                      )
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page || loading} className="rounded-lg border-gray-200 text-gray-700 dark:border-slate-700 dark:text-gray-300">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AlertDetailModal
        alert={selectedAlert}
        open={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        onAction={handleAction}
        onDelete={handleDeleteEmergency}
        formatDate={formatDate}
        getTimeAgo={getTimeAgo}
        isDispatching={isDispatching}
        isReverting={isReverting}
      />

      <ConfirmationModal
        open={showConfirmationModal}
        onClose={() => { setShowConfirmationModal(false); setAlertToResolve(null); }}
        onConfirm={handleConfirmResolve}
        title="Confirm Resolution"
        description="Are you sure you want to mark this emergency alert as resolved?"
        alert={alertToResolve}
        isProcessing={isResolving}
        confirmText="Yes, Resolve"
        confirmColor="green"
      />

      <DecisionModal
        open={showDecisionModal}
        onClose={() => { setShowDecisionModal(false); setAlertForReport(null); }}
        onYes={handleDecisionYes}
        onNo={handleDecisionNo}
        alert={alertForReport}
        formatDate={formatDate}
      />

      <AddEmergencyReport
        isOpen={showAddReportModal}
        onClose={() => { setShowAddReportModal(false); setAlertForReport(null); }}
        onSave={handleSaveReport}
        emergencyData={alertForReport}
      />

      <DispatchOfficerModal
        open={showDispatchModal}
        onClose={() => { setShowDispatchModal(false); setSelectedAlertForDispatch(null); }}
        onDispatch={handleDispatchOfficer}
        alert={selectedAlertForDispatch}
      />
    </DashboardLayout>
  );
};

export default Alerts;

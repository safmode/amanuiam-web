// resources/js/Components/Header.jsx

import { useState, useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { Bell, Moon, Sun, CheckCheck, BellRing, BellOff, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export const Header = ({ darkMode, toggleDarkMode }) => {
  const { auth } = usePage().props;
  const currentUserId = auth?.admins?._id || auth?.admins?.id;

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const echoRef = useRef(null);
  const channelRef = useRef(null);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handlePreferenceChange = (event) => {
      console.log('Preference changed, refetching notifications...', event.detail);
      // Refetch notifications when preference changes
      fetchNotifications();
    };

    window.addEventListener('notification-preference-changed', handlePreferenceChange);

    return () => {
      window.removeEventListener('notification-preference-changed', handlePreferenceChange);
    };
  }, []);

  // Initialize Echo and subscribe to public channel
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;

    const initEcho = async () => {
      try {
        const echoModule = await import('@/echo');
        const echoClient = echoModule.default;

        if (!isMounted) return;
        echoRef.current = echoClient;
        setIsConnected(true);

        // Listen to PUBLIC channel
        channelRef.current = echoClient.channel('admin-notifications');

        channelRef.current.listen('.notification.received', (data) => {
          console.log('Real-time notification received:', data);

          // Check for duplicate before adding
          setNotifications(prev => {
            const exists = prev.some(n => n._id === data.notification._id);
            if (exists) return prev;

            // Update unread count
            setUnreadCount(prevCount => prevCount + 1);

            return [data.notification, ...prev];
          });

          playNotificationSound();

          if (Notification.permission === 'granted') {
            new Notification(data.notification.title, {
              body: data.notification.message,
              icon: '/images/OSeM.png',
              badge: '/images/OSeM.png',
              silent: false,
            });
          }
        });
      } catch (error) {
        console.error('Failed to initialize Echo:', error);
        setIsConnected(false);
      }
    };

    initEcho();

    return () => {
      isMounted = false;
      if (channelRef.current) {
        channelRef.current.stopListening('.notification.received');
        echoRef.current?.leaveChannel('admin-notifications');
      }
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications');
      const newNotifications = response.data.notifications || [];
      const newUnreadCount = response.data.unread_count || 0;

      // Merge without duplicates (keep newest first)
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n._id));
        const uniqueNew = newNotifications.filter(n => !existingIds.has(n._id));
        return [...uniqueNew, ...prev];
      });

      setUnreadCount(newUnreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get('/api/notifications/unread-count');
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Fallback to oscillator if audio file not available
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 880;
        gainNode.gain.value = 0.2;
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);
        oscillator.stop(audioContext.currentTime + 0.5);
        if (audioContext.state === 'suspended') audioContext.resume();
      });
    } catch (e) {
      console.log('New notification!');
    }
  };

  const markAllAsRead = async () => {
    setIsLoading(true);
    try {
      await axios.put('/api/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(notification =>
          notification._id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification._id);
    }
    setIsOpen(false);

    if (notification.type === 'emergency_alert') {
      router.visit('/Alerts');
    } else if (notification.report_id) {
      router.visit('/Reports');
    }
  };

  const isUnread = (notification) => !notification.is_read;

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'emergency_alert':
        return '🚨';
      case 'new_report':
        return '📋';
      case 'status_change':
        return '📝';
      default:
        return '🔔';
    }
  };

  const getNotificationStyle = (type) => {
    switch(type) {
      case 'emergency_alert':
        return { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-300' };
      case 'new_report':
        return { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300' };
      case 'status_change':
        return { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-300' };
      default:
        return { bg: 'bg-gray-50 dark:bg-gray-800', border: 'border-gray-200 dark:border-gray-700', text: 'text-gray-700 dark:text-gray-300' };
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 transition-all duration-300 shadow-sm">
      <div className="flex items-center justify-end h-16 px-6">
        <div className="flex items-center gap-2">
          {/* Connection Status Indicator */}
          <div className="hidden sm:flex items-center gap-1 mr-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {isConnected ? 'Live' : 'Reconnecting...'}
            </span>
          </div>

          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-amber-500" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            )}
          </Button>

          {/* Notifications Dropdown */}
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-4 px-1 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold animate-pulse shadow-md">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-[380px] max-h-[500px] overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xl p-0 animate-in fade-in-0 zoom-in-95 duration-200"
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-gray-100 dark:border-slate-800 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BellRing className="w-5 h-5 text-[#D4A853]" />
                    <h4 className="font-semibold dark:text-white text-gray-900">
                      Notifications
                    </h4>
                    <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      {notifications.length}
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      disabled={isLoading}
                      className="text-xs text-[#D4A853] hover:text-[#B8943F] hover:bg-[#D4A853]/10 h-auto py-1.5 px-3 rounded-lg transition-all duration-200"
                    >
                      <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
                      Mark all read
                    </Button>
                  )}
                </div>
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto max-h-[400px]">
                {!notifications || notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <BellOff className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No notifications yet</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">New alerts will appear here</p>
                  </div>
                ) : (
                  notifications.map((notification, idx) => {
                    const unread = isUnread(notification);
                    const style = getNotificationStyle(notification.type);
                    return (
                      <div key={notification._id}>
                        <DropdownMenuItem
                          className="p-0 focus:bg-transparent cursor-pointer"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className={`p-4 w-full transition-all duration-200 ${unread ? style.bg : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'} border-l-4 ${unread ? style.border : 'border-transparent'}`}>
                            <div className="flex items-start gap-3">
                              <div className="text-2xl flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <p className={`text-sm font-medium ${unread ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'} truncate`}>
                                    {notification.title}
                                  </p>
                                  <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">
                                    {formatTime(notification.created_at)}
                                  </span>
                                </div>
                                <p className={`text-xs ${unread ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'} line-clamp-2`}>
                                  {notification.message}
                                </p>
                                {notification.report_id && (
                                  <p className="text-xs font-mono text-[#D4A853] mt-1.5">
                                    #{notification.report_id}
                                  </p>
                                )}
                              </div>
                              {unread && (
                                <div className="w-2 h-2 bg-[#D4A853] rounded-full mt-2 flex-shrink-0 shadow-sm" />
                              )}
                            </div>
                          </div>
                        </DropdownMenuItem>
                        {idx < notifications.length - 1 && <DropdownMenuSeparator className="my-0" />}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {notifications && notifications.length > 0 && (
                <div className="sticky bottom-0 bg-gray-50/95 dark:bg-slate-800/95 backdrop-blur-sm p-3 text-center border-t border-gray-100 dark:border-slate-700">
                  <Button
                    variant="link"
                    size="sm"
                    className="text-xs text-[#D4A853] hover:text-[#B8943F] font-medium"
                    onClick={() => {
                      setIsOpen(false);
                      router.visit('/Reports');
                    }}
                  >
                    View all reports
                    <Sparkles className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

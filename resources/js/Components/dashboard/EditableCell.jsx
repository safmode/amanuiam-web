// components/dashboard/EditableCell.jsx
import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { router } from '@inertiajs/react';
import { createPortal } from 'react-dom';

const EditableCell = ({ value, reportId, field, options, optionLabels, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  const getBadgeStyle = () => {
    if (field === 'status') {
      const styles = {
        pending: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
        in_progress: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
        resolved: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
        nfa: 'bg-gray-700 text-white border-gray-700 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-600',
      };
      return styles[selectedValue] || styles.pending;
    }
    if (field === 'urgency') {
      const styles = {
        general: 'border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
        urgent: 'border-red-300 text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
      };
      return styles[selectedValue] || styles.general;
    }
    return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600';
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
            buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsEditing(false);
        }
    };

    if (isEditing) {
        // Add a small delay to ensure DOM is ready
        const positionDropdown = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
            top: rect.bottom,  // Remove + window.scrollY
            left: rect.left,   // Remove + window.scrollX
            });
        }
        };

        positionDropdown();

        // Also reposition on scroll/resize while dropdown is open
        window.addEventListener('scroll', positionDropdown);
        window.addEventListener('resize', positionDropdown);
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
        window.removeEventListener('scroll', positionDropdown);
        window.removeEventListener('resize', positionDropdown);
        document.removeEventListener('mousedown', handleClickOutside);
        };
    }
  }, [isEditing]);

  const handleUpdate = (newValue) => {
    if (newValue === selectedValue) {
      setIsEditing(false);
      return;
    }

    const oldValue = selectedValue;

    // UPDATE UI IMMEDIATELY - NO WAITING
    setSelectedValue(newValue);
    setIsEditing(false);
    setIsUpdating(true);

    // Immediately notify parent to update UI
    if (onUpdate) {
      onUpdate(reportId, field, newValue, oldValue);
    }

    // Send update to server in background
    router.put(`/Reports/${reportId}`, { [field]: newValue }, {
      preserveScroll: true,
      preserveState: true,
      onError: () => {
        // Revert on error
        setSelectedValue(oldValue);
        if (onUpdate) {
          onUpdate(reportId, field, oldValue, newValue);
        }
        alert(`Failed to update ${field}`);
      },
      onFinish: () => {
        setIsUpdating(false);
      }
    });
  };

  const getDisplayValue = () => optionLabels?.[selectedValue] || selectedValue || '—';

  // Update local value when prop changes (for when parent refreshes)
  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  return (
    <>
      <div
        ref={buttonRef}
        onClick={() => !isUpdating && setIsEditing(true)}
        className="inline-block"
      >
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border cursor-pointer transition-all ${getBadgeStyle()} ${!isUpdating ? 'hover:scale-105 hover:shadow-sm' : 'opacity-75'}`}>
          <span className="text-xs font-medium">{getDisplayValue()}</span>
          {!isUpdating && <ChevronDown className="w-3 h-3" />}
          {isUpdating && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
        </div>
      </div>

      {isEditing && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-gray-200 min-w-[160px] dark:bg-slate-800 dark:border-slate-700"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
          }}
        >
          <div className="py-1 max-h-60 overflow-y-auto">
            {Object.entries(options).map(([key, label]) => (
              <button
                key={key}
                onClick={() => handleUpdate(key)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center justify-between dark:hover:bg-slate-700 dark:text-gray-300 ${
                  selectedValue === key ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : ''
                }`}
              >
                <span>{label}</span>
                {selectedValue === key && <Check className="w-3 h-3" />}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default EditableCell;

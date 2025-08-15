
import React, { useEffect, useRef, useState } from 'react';
import { ClockIcon } from './icons/ClockIcon';
import { useAppContext } from '../context/AppContext';

interface SnoozePopoverProps {
  conversationIds: string[];
  onClose: () => void;
  aclass?: string;
}

const SnoozePopover: React.FC<SnoozePopoverProps> = ({ conversationIds, onClose, aclass }) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const { snoozeConversation } = useAppContext();
    const [customDateTime, setCustomDateTime] = useState('');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);
    
    const handleSnooze = (date: Date) => {
        snoozeConversation(conversationIds, date);
        onClose();
    };

    const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCustomDateTime(value);
        if (value) {
            handleSnooze(new Date(value));
        }
    };
    
    const getPreset = (addDays: number, hour: number, minute: number = 0): Date => {
        const date = new Date();
        date.setDate(date.getDate() + addDays);
        date.setHours(hour, minute, 0, 0);
        return date;
    };
    
    const tomorrow = getPreset(1, 8);
    const nextWeek = getPreset(7, 8);
    
    const nextWeekend = new Date();
    const dayOfWeek = nextWeekend.getDay(); 
    const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
    nextWeekend.setDate(nextWeekend.getDate() + (daysUntilSaturday === 0 ? 7 : daysUntilSaturday));
    nextWeekend.setHours(8, 0, 0, 0);

    const PresetButton: React.FC<{label: string, time: string, onClick: () => void}> = ({label, time, onClick}) => (
        <button onClick={onClick} className="w-full text-left flex justify-between items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
            <span>{label}</span>
            <span className="text-gray-500">{time}</span>
        </button>
    );

    return (
        <div ref={popoverRef} className={`absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black dark:ring-gray-600 ring-opacity-5 z-20 ${aclass}`}>
            <div className="py-1">
                <p className="px-4 py-2 text-md font-semibold text-gray-800 dark:text-gray-100">Snooze until...</p>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <PresetButton label="Tomorrow" time={tomorrow.toLocaleDateString([], {weekday: 'long', hour: 'numeric', minute:'2-digit'})} onClick={() => handleSnooze(tomorrow)} />
                <PresetButton label="This weekend" time={nextWeekend.toLocaleDateString([], {weekday: 'long', hour: 'numeric', minute:'2-digit'})} onClick={() => handleSnooze(nextWeekend)} />
                <PresetButton label="Next week" time={nextWeek.toLocaleDateString([], {weekday: 'long', hour: 'numeric', minute:'2-digit'})} onClick={() => handleSnooze(nextWeek)} />
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <div className="p-2">
                    <label htmlFor="custom-date-time" className="flex items-center gap-2 px-2 py-2 text-sm text-gray-700 dark:text-gray-200">
                        <ClockIcon className="w-5 h-5" />
                        Pick date & time
                    </label>
                    <input
                        id="custom-date-time"
                        type="datetime-local"
                        value={customDateTime}
                        onChange={handleCustomDateChange}
                        className="w-full p-2 border rounded-md bg-gray-50 dark:bg-dark-surface text-on-surface dark:text-dark-on-surface dark:border-dark-outline"
                        min={new Date(new Date().getTime() + 5 * 60000).toISOString().slice(0, 16)} // 5 mins from now
                    />
                </div>
            </div>
        </div>
    );
};

export default SnoozePopover;
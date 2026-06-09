/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { PlusCircle, Calendar, Clock, Smile, FileText } from 'lucide-react';
import { CategoryType, CATEGORIES, TimeEntry } from '../types';
import { getCategoryIcon } from './ActiveTimer';

interface ManualFormProps {
  onAddEntry: (entry: Omit<TimeEntry, 'id' | 'timestamp'>) => void;
}

export default function ManualForm({ onAddEntry }: ManualFormProps) {
  const [category, setCategory] = useState<CategoryType>('Manual Testing');
  const [durationValue, setDurationValue] = useState<string>('');
  const [durationType, setDurationType] = useState<'hours' | 'minutes'>('hours');
  const [notes, setNotes] = useState('');
  
  // Format current local date to YYYY-MM-DD
  const getTodayString = () => {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  };
  
  const [date, setDate] = useState(getTodayString());
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    const parsedDuration = parseFloat(durationValue);
    if (isNaN(parsedDuration) || parsedDuration <= 0) {
      alert('Please enter a valid positive duration.');
      return;
    }

    // Convert duration to minutes
    const durationMinutes = durationType === 'hours' 
      ? Math.round(parsedDuration * 60) 
      : Math.round(parsedDuration);

    if (durationMinutes < 1) {
      alert('Duration must aggregate to at least 1 minute.');
      return;
    }

    onAddEntry({
      category,
      durationMinutes,
      date,
      notes: notes.trim() || undefined,
      isTimerBased: false
    });

    // Reset Form fields
    setDurationValue('');
    setNotes('');
    setDate(getTodayString());
    
    // Trigger quick visual success feedback
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  return (
    <div id="manual-form-card" className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800/80 shadow-xs transition-colors duration-300">
      
      {/* Header section */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
          <PlusCircle className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 tracking-tight">Log Manual Activity</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">Log past tasks quickly and effortlessly</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Category list dropdown selector */}
        <div className="space-y-1.5">
          <label htmlFor="manual-category" className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
            Category
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              {getCategoryIcon(category, "w-4 h-4")}
            </span>
            <select
              id="manual-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryType)}
              className="w-full text-sm pl-9 pr-3.5 py-3 bg-slate-50 dark:bg-slate-950/30 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer font-medium"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {/* Custom dropdown tick */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Duration configuration column */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="manual-duration" className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Duration
            </label>
            
            {/* Format Toggles */}
            <div className="flex border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-0.5 rounded-lg text-xs">
              <button
                id="duration-type-hours"
                type="button"
                onClick={() => setDurationType('hours')}
                className={`py-1 px-2.5 rounded-md font-medium transition-all cursor-pointer ${
                  durationType === 'hours'
                    ? 'bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Hours
              </button>
              <button
                id="duration-type-minutes"
                type="button"
                onClick={() => setDurationType('minutes')}
                className={`py-1 px-2.5 rounded-md font-medium transition-all cursor-pointer ${
                  durationType === 'minutes'
                    ? 'bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Minutes
              </button>
            </div>
          </div>

          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              <Clock className="w-4 h-4" />
            </span>
            <input
              id="manual-duration"
              type="number"
              step="any"
              placeholder={durationType === 'hours' ? 'e.g. 1.5' : 'e.g. 90'}
              value={durationValue}
              onChange={(e) => setDurationValue(e.target.value)}
              className="w-full text-sm pl-10 pr-16 py-3 bg-slate-50 dark:bg-slate-950/30 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              required
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 dark:text-slate-500 select-none">
              {durationType === 'hours' ? 'hours' : 'minutes'}
            </span>
          </div>
        </div>

        {/* Date Selector */}
        <div className="space-y-1.5">
          <label htmlFor="manual-date" className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
            Date
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400">
              <Calendar className="w-4 h-4" />
            </span>
            <input
              id="manual-date"
              type="date"
              value={date}
              max={getTodayString()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-sm pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-950/30 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium appearance-none cursor-pointer"
              required
            />
          </div>
        </div>

        {/* Optional Notes Description area */}
        <div className="space-y-1.5">
          <label htmlFor="manual-notes" className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
            Optional Notes / Description
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500">
              <FileText className="w-4 h-4" />
            </span>
            <textarea
              id="manual-notes"
              rows={2}
              placeholder="Provide a quick reference of what was completed..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-950/30 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Success confirmation animation bar */}
        {successMsg && (
          <div className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 rounded-lg p-2.5 flex items-center gap-1.5 justify-center font-medium animate-fadeIn">
            <Smile className="w-4 h-4 text-emerald-500" />
            <span>Activity logged successfully!</span>
          </div>
        )}

        {/* Submit button trigger */}
        <button
          id="log-manual-btn"
          type="submit"
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-505 dark:bg-indigo-650 dark:hover:bg-indigo-600 text-white font-semibold rounded-xl tracking-tight transition-all duration-200 hover:shadow-md cursor-pointer text-sm"
        >
          Add to Workspace Log
        </button>

      </form>
    </div>
  );
}

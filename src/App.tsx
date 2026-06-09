/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Timer, 
  Calendar, 
  RotateCcw, 
  Grid, 
  Sparkles,
  Github
} from 'lucide-react';
import { TimeEntry, TimeFilter } from './types';
import ThemeToggle from './components/ThemeToggle';
import ActiveTimer from './components/ActiveTimer';
import ManualForm from './components/ManualForm';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import ActivityHistory from './components/ActivityHistory';

// Helper to generate dynamic dates relative to today
const getRelativeDateString = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
};

// Seed values to make the dashboards instantly visualization friendly on first load
const createSampleSeedEntries = (): TimeEntry[] => [
  {
    id: 'seed-1',
    category: 'Manual Testing',
    durationMinutes: 185, // ~3 hours
    date: getRelativeDateString(0), // Today
    timestamp: new Date(getRelativeDateString(0) + 'T00:00:00').getTime(),
    notes: 'Testing main authentication routes, registration forms, and sandbox integration endpoints.',
    isTimerBased: false
  },
  {
    id: 'seed-2',
    category: 'Meetings',
    durationMinutes: 90, // 1.5 hours
    date: getRelativeDateString(0), // Today
    timestamp: new Date(getRelativeDateString(0) + 'T00:00:00').getTime(),
    notes: 'Product sync with designer and mock walkthrough of custom telemetry options.',
    isTimerBased: true
  },
  {
    id: 'seed-3',
    category: 'Documentation',
    durationMinutes: 120, // 2 hours
    date: getRelativeDateString(-1), // Yesterday
    timestamp: new Date(getRelativeDateString(-1) + 'T10:00:00').getTime(),
    notes: 'Updating build step documentation and drafting api JSON schema guide.',
    isTimerBased: false
  },
  {
    id: 'seed-4',
    category: 'Support',
    durationMinutes: 60, // 1 hour
    date: getRelativeDateString(-1), // Yesterday
    timestamp: new Date(getRelativeDateString(-1) + 'T14:30:00').getTime(),
    notes: 'Live hot-fix support resolving state issues in CSS nesting dependencies.',
    isTimerBased: true
  },
  {
    id: 'seed-5',
    category: 'Learning / Training',
    durationMinutes: 75, // 1.25 hours
    date: getRelativeDateString(-2), // 2 Days Ago
    timestamp: new Date(getRelativeDateString(-2) + 'T09:00:00').getTime(),
    notes: 'Reviewing Vite v6 migration manuals and researching typescript type optimization benefits.',
    isTimerBased: false
  }
];

export default function App() {
  // Theme controllers
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('time_tracker_dark_mode');
    return saved === 'true';
  });

  // Master entries list
  const [entries, setEntries] = useState<TimeEntry[]>(() => {
    const saved = localStorage.getItem('tracked_activities_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error('Failed to parse logs:', err);
      }
    }
    // Return sample entries if local storage empty to provide beautiful instant metrics
    return createSampleSeedEntries();
  });

  // Shared active filtering tab
  const [activeFilter, setActiveFilter] = useState<TimeFilter>('This Week');

  // Trigger HTML class lists for tailwind modes
  useEffect(() => {
    localStorage.setItem('time_tracker_dark_mode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Sync entries to local storage
  useEffect(() => {
    localStorage.setItem('tracked_activities_v1', JSON.stringify(entries));
  }, [entries]);

  // Callback to insert newly created item
  const handleAddEntry = (newRaw: Omit<TimeEntry, 'id' | 'timestamp'>) => {
    const isToday = newRaw.date === getRelativeDateString(0);
    const calculatedTimestamp = new Date(newRaw.date + 'T00:00:00').getTime() || Date.now();
    
    const prepared: TimeEntry = {
      ...newRaw,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: calculatedTimestamp
    };

    setEntries(prev => [prepared, ...prev]);
    
    // Automatically focus appropriate filter view depending on logged date to give feedback
    if (isToday) {
      setActiveFilter('Today');
    } else {
      setActiveFilter('All Time');
    }
  };

  // Callback to update existing item
  const handleUpdateEntry = (updated: TimeEntry) => {
    setEntries(prev => prev.map(item => item.id === updated.id ? updated : item));
  };

  // Callback to delete item
  const handleDeleteEntry = (id: string) => {
    setEntries(prev => prev.filter(item => item.id !== id));
  };

  // Wipe Slate Clean
  const handleClearSlate = () => {
    if (window.confirm('Wipe complete database? This deletes all your logged activities permanently and creates a blank tracking log.')) {
      setEntries([]);
      localStorage.removeItem('tracked_activities_v1');
    }
  };

  // Re-seed with default entries for playground checks
  const handleReseedSampleData = () => {
    if (window.confirm('This replaces your current list with the preset workspace telemetry logs. Keep current session contents?')) {
      setEntries(createSampleSeedEntries());
    }
  };

  // Calculate quick summary metrics specifically for header feedback
  const headerTotalHoursToday = entries
    .filter(e => e.date === getRelativeDateString(0))
    .reduce((acc, curr) => acc + curr.durationMinutes, 0) / 60;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* 1. Main Navigation Header Bar */}
      <header className="border-b border-slate-150 dark:border-slate-900 bg-white dark:bg-slate-900 transition-colors duration-300 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand logo container */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-sm flex items-center justify-center">
              <Timer className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-100 tracking-tight text-md">Time Tracker</span>
              <span className="hidden sm:inline-block ml-2 text-3xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-400 border border-slate-150 dark:border-slate-800">
                Workspace Tracker
              </span>
            </div>
          </div>

          {/* Quick Header Indicators & Toggle actions */}
          <div className="flex items-center gap-4">
            
            {/* Today's total logged live status */}
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-3xs font-medium text-slate-500 dark:text-slate-400">Today:</span>
              <strong className="text-xs font-bold text-slate-750 dark:text-slate-100 font-mono">
                {headerTotalHoursToday.toFixed(1)}h
              </strong>
            </div>

            {/* Dark Mode switcher button */}
            <ThemeToggle 
              darkMode={darkMode} 
              onToggle={() => setDarkMode(!darkMode)} 
            />

          </div>

        </div>
      </header>

      {/* 2. Main Dashboard Layout Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Intro banner workspace card */}
        <div className="relative overflow-hidden mb-8 p-6 md:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 text-white shadow-md border border-slate-800">
          
          {/* Ambient visual background glow details */}
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -ml-6 -mb-6 w-36 h-36 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-medium text-3xs border border-emerald-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Professional Utilities Pack</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-none">
                Measure what matters.
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                Monitor live stopwatch timers or log custom entries to review category aggregates. Export CSV reports with a single click to present in weekly updates!
              </p>
            </div>

            {/* Utility slate actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              <button
                id="reseed-data-btn"
                onClick={handleReseedSampleData}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-100 font-semibold text-xs tracking-tight transition-all duration-150 border border-slate-700 cursor-pointer"
              >
                Reset to Demo Seed
              </button>
              
              <button
                id="reset-slate-btn"
                onClick={handleClearSlate}
                className="py-2.5 px-4 rounded-xl bg-red-950/40 hover:bg-red-900/30 text-rose-305 hover:text-rose-200 font-semibold text-xs tracking-tight border border-rose-900/30 transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
                title="Wipe database layout"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Wipe Database Slate</span>
              </button>

            </div>

          </div>
        </div>

        {/* 3. Columns Grid Workspace Structure */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column (Timer & Manual entry modules): Span 5 */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Active Stopwatch module */}
            <ActiveTimer onAddEntry={handleAddEntry} />

            {/* Manual Activity logger module */}
            <ManualForm onAddEntry={handleAddEntry} />

          </div>

          {/* Right Column (Reporting, Breakdown graph, Analytics widgets): Span 7 */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Detailed Graphical representation & Filter categories */}
            <AnalyticsDashboard 
              entries={entries}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />

            {/* Activity History listing & search operations */}
            <ActivityHistory 
              entries={entries}
              onUpdateEntry={handleUpdateEntry}
              onDeleteEntry={handleDeleteEntry}
            />

          </div>

        </div>

      </main>

      {/* 4. Elegant Minimal Footer */}
      <footer className="border-t border-slate-150 dark:border-slate-900 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 py-6 mt-16 transition-colors duration-300 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-semibold select-none text-slate-600 dark:text-slate-400 text-3xs sm:text-xs">
            © 2026 Time Tracker · Minimalist productivity framework dashboard
          </p>
          <div className="flex items-center gap-4 text-3xs font-semibold">
            <span className="text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              LocalStorage Database Active
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}

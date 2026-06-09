/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Square, 
  Pause, 
  RotateCcw,
  TestTube, 
  Users, 
  MessageSquare, 
  LifeBuoy, 
  FileText, 
  GraduationCap, 
  HelpCircle,
  Timer
} from 'lucide-react';
import { CategoryType, CATEGORIES, TimeEntry, ActiveTimerState } from '../types';

interface ActiveTimerProps {
  onAddEntry: (entry: Omit<TimeEntry, 'id' | 'timestamp'>) => void;
}

// Icon helper function for categories
export const getCategoryIcon = (category: CategoryType, className = "w-5 h-5") => {
  switch (category) {
    case 'Manual Testing':
      return <TestTube className={className} />;
    case 'Meetings':
      return <Users className={className} />;
    case 'Conversations with Colleagues':
      return <MessageSquare className={className} />;
    case 'Support':
      return <LifeBuoy className={className} />;
    case 'Documentation':
      return <FileText className={className} />;
    case 'Learning / Training':
      return <GraduationCap className={className} />;
    default:
      return <HelpCircle className={className} />;
  }
};

// Pastel colors to make cards look super professional
export const getCategoryColorClasses = (category: CategoryType) => {
  switch (category) {
    case 'Manual Testing':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/20',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-900/50',
        accent: 'bg-emerald-500',
        hover: 'hover:border-emerald-300 dark:hover:border-emerald-800'
      };
    case 'Meetings':
      return {
        bg: 'bg-indigo-50 dark:bg-indigo-950/20',
        text: 'text-indigo-700 dark:text-indigo-300',
        border: 'border-indigo-200 dark:border-indigo-900/50',
        accent: 'bg-indigo-500',
        hover: 'hover:border-indigo-300 dark:hover:border-indigo-800'
      };
    case 'Conversations with Colleagues':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/20',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-900/50',
        accent: 'bg-amber-500',
        hover: 'hover:border-amber-300 dark:hover:border-amber-800'
      };
    case 'Support':
      return {
        bg: 'bg-pink-50 dark:bg-pink-950/20',
        text: 'text-pink-700 dark:text-pink-300',
        border: 'border-pink-200 dark:border-pink-900/50',
        accent: 'bg-pink-500',
        hover: 'hover:border-pink-300 dark:hover:border-pink-800'
      };
    case 'Documentation':
      return {
        bg: 'bg-sky-50 dark:bg-sky-950/20',
        text: 'text-sky-700 dark:text-sky-300',
        border: 'border-sky-200 dark:border-sky-900/50',
        accent: 'bg-sky-500',
        hover: 'hover:border-sky-300 dark:hover:border-sky-800'
      };
    case 'Learning / Training':
      return {
        bg: 'bg-violet-50 dark:bg-violet-950/20',
        text: 'text-violet-700 dark:text-violet-300',
        border: 'border-violet-200 dark:border-violet-900/50',
        accent: 'bg-violet-500',
        hover: 'hover:border-violet-300 dark:hover:border-violet-800'
      };
    default:
      return {
        bg: 'bg-slate-50 dark:bg-slate-950/20',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-800',
        accent: 'bg-slate-500',
        hover: 'hover:border-slate-300 dark:hover:border-slate-700'
      };
  }
};

export default function ActiveTimer({ onAddEntry }: ActiveTimerProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('Manual Testing');
  const [notes, setNotes] = useState('');
  
  // Running timer state
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const trackingDataRef = useRef<{ startTime: number; pausedTimeAccumulated: number }>({
    startTime: 0,
    pausedTimeAccumulated: 0
  });

  // Load active timer from storage if it exists (allows remaining synchronous across sessions!)
  useEffect(() => {
    const savedTimer = localStorage.getItem('active_timer_v1');
    if (savedTimer) {
      try {
        const parsed: ActiveTimerState = JSON.parse(savedTimer);
        setSelectedCategory(parsed.category);
        if (parsed.notes) setNotes(parsed.notes);
        
        setIsActive(true);
        setIsPaused(parsed.isPaused);
        
        const now = Date.now();
        if (parsed.isPaused) {
          // Timer was paused. State elapsed holds accumulated duration.
          const elapsed = Math.floor(parsed.pausedDurationMs / 1000);
          setElapsedSeconds(elapsed);
          trackingDataRef.current = {
            startTime: parsed.startTime,
            pausedTimeAccumulated: parsed.pausedDurationMs
          };
        } else {
          // Timer is active. Calculate difference including gaps.
          const totalElapsedMs = now - parsed.startTime - parsed.pausedDurationMs;
          const elapsed = Math.floor(totalElapsedMs / 1000);
          setElapsedSeconds(Math.max(0, elapsed));
          
          trackingDataRef.current = {
            startTime: parsed.startTime,
            pausedTimeAccumulated: parsed.pausedDurationMs
          };
        }
      } catch (err) {
        console.error('Failed to parse saved timer: ', err);
        localStorage.removeItem('active_timer_v1');
      }
    }
  }, []);

  // Timer tick effect
  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const baseStart = trackingDataRef.current.startTime;
        const pausedGap = trackingDataRef.current.pausedTimeAccumulated;
        const actualSeconds = Math.floor((now - baseStart - pausedGap) / 1000);
        setElapsedSeconds(Math.max(0, actualSeconds));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isPaused]);

  // Persist timer state on change/ticks
  const saveStateToStorage = (active: boolean, paused: boolean, pausedAccum: number, startTime: number) => {
    if (active) {
      const state: ActiveTimerState = {
        startTime: startTime,
        category: selectedCategory,
        notes: notes,
        isPaused: paused,
        pausedDurationMs: pausedAccum,
        lastTickTime: Date.now()
      };
      localStorage.setItem('active_timer_v1', JSON.stringify(state));
    } else {
      localStorage.removeItem('active_timer_v1');
    }
  };

  const handleStart = () => {
    const now = Date.now();
    setIsActive(true);
    setIsPaused(false);
    setElapsedSeconds(0);
    
    trackingDataRef.current = {
      startTime: now,
      pausedTimeAccumulated: 0
    };
    
    saveStateToStorage(true, false, 0, now);
  };

  const handlePauseToggle = () => {
    const now = Date.now();
    if (!isPaused) {
      // Transitioning to PAUSED
      setIsPaused(true);
      saveStateToStorage(
        true, 
        true, 
        trackingDataRef.current.pausedTimeAccumulated, 
        trackingDataRef.current.startTime
      );
    } else {
      // Transitioning to RUNNING
      // We need to adjust 'pausedTimeAccumulated' because the timer was frozen.
      // The gap of freeze is: now - (last update/pause epoch).
      // To simplify: active_timer_v1 has `lastTickTime` which matches our click.
      const savedTimerStr = localStorage.getItem('active_timer_v1');
      let extraPausedMs = 0;
      if (savedTimerStr) {
        try {
          const parsed: ActiveTimerState = JSON.parse(savedTimerStr);
          extraPausedMs = now - parsed.lastTickTime;
        } catch {
          // fallback
        }
      }
      
      const updatedPausedAccum = trackingDataRef.current.pausedTimeAccumulated + extraPausedMs;
      trackingDataRef.current.pausedTimeAccumulated = updatedPausedAccum;
      
      setIsPaused(false);
      saveStateToStorage(
        true, 
        false, 
        updatedPausedAccum, 
        trackingDataRef.current.startTime
      );
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to discard this timer session? All untracked progress of this session will be lost.')) {
      setIsActive(false);
      setIsPaused(false);
      setElapsedSeconds(0);
      saveStateToStorage(false, false, 0, 0);
    }
  };

  const handleStopAndSave = () => {
    if (elapsedSeconds < 2) {
      alert('The tracked session is too short (less than 2 seconds). Please track key tasks of at least 1 minute.');
      return;
    }

    // Convert to minutes with reasonable precision
    const loggedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
    
    const todayStr = new Date().toISOString().split('T')[0];
    
    onAddEntry({
      category: selectedCategory,
      durationMinutes: loggedMinutes,
      date: todayStr,
      notes: notes.trim() || undefined,
      isTimerBased: true
    });

    // Reset stopwatch local trackers
    setIsActive(false);
    setIsPaused(false);
    setElapsedSeconds(0);
    setNotes('');
    saveStateToStorage(false, false, 0, 0);
  };

  // Format Elapsed seconds into nicely spaced display
  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const activeColor = getCategoryColorClasses(selectedCategory);

  return (
    <div id="active-timer-card" className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800/80 shadow-xs transition-colors duration-300">
      
      {/* Header section with pulsating indicator if active */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 tracking-tight">Active Productivity Tracker</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">Track task times dynamically with live reports</p>
          </div>
        </div>
        
        {isActive && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/20 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            {isPaused ? 'Paused' : 'Recording'}
          </div>
        )}
      </div>

      {/* Main stopwatch screen */}
      {isActive ? (
        <div className="flex flex-col items-center justify-center py-6 px-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/40 my-4 text-center">
          
          <span className={`text-xs uppercase tracking-widest font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 ${activeColor.bg} ${activeColor.text}`}>
            {getCategoryIcon(selectedCategory, "w-3 h-3")}
            {selectedCategory}
          </span>

          <div id="active-timer-display" className="font-mono text-4xl sm:text-5xl font-semibold text-slate-800 dark:text-slate-100 tracking-tight my-4 select-none">
            {formatTime(elapsedSeconds)}
          </div>

          {notes ? (
            <p className="text-sm italic text-slate-500 dark:text-slate-400 mb-5 max-w-xs break-words">
              &ldquo;{notes}&rdquo;
            </p>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic mb-5">
              No notes entered for this session
            </p>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-3 w-full max-w-sm">
            
            {/* Pause/Resume Toggle */}
            <button
              id="pause-timer-btn"
              onClick={handlePauseToggle}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-sm transition-all duration-250 hover:shadow-xs cursor-pointer"
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4 fill-emerald-500 text-emerald-500 dark:fill-emerald-400 dark:text-emerald-400" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 text-amber-500" />
                  <span>Pause</span>
                </>
              )}
            </button>

            {/* Stop and Save Button */}
            <button
              id="stop-timer-btn"
              onClick={handleStopAndSave}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 font-medium text-sm transition-all duration-250 shadow-sm hover:shadow-md cursor-pointer"
            >
              <Square className="w-4 h-4 fill-white text-white" />
              <span>Stop &amp; Save</span>
            </button>

            {/* Cancel/Discard */}
            <button
              id="cancel-timer-btn"
              onClick={handleReset}
              className="p-3 rounded-xl border border-rose-100 dark:border-rose-950/50 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
              title="Discard timer session"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

        </div>
      ) : (
        /* Configuration list before start */
        <div className="space-y-4">
          
          {/* Notes description input */}
          <div className="space-y-1.5">
            <label htmlFor="timer-notes" className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              What are you working on right now? (optional)
            </label>
            <input
              id="timer-notes"
              type="text"
              placeholder="e.g. testing registration flow bug fixes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm py-2.5 px-3.5 bg-slate-50 dark:bg-slate-950/30 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder-slate-400"
            />
          </div>

          {/* Interactive Tiles Selector instead of dull dropdown menus */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              Select category
            </label>
            <div id="category-tiles-grid" className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const color = getCategoryColorClasses(cat);
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    id={`cat-tile-${cat.replace(/\s+/g, '-').toLowerCase()}`}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-200 group relative overflow-hidden cursor-pointer ${
                      isSelected 
                        ? `${color.bg} ${color.border} ring-1 ring-emerald-500/30` 
                        : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {/* Visual left Indicator bar for active selection */}
                    {isSelected && (
                      <div className={`absolute top-0 left-0 bottom-0 w-1 ${color.accent}`} />
                    )}
                    
                    <div className={`p-1.5 rounded-lg transition-colors ${
                      isSelected 
                        ? 'bg-white dark:bg-slate-900 shadow-xs' 
                        : 'bg-slate-50 dark:bg-slate-950'
                    }`}>
                      {getCategoryIcon(cat, `w-4 h-4 ${isSelected ? color.text : 'text-slate-500 dark:text-slate-400'}`)}
                    </div>
                    
                    <span className={`text-xs font-medium truncate ${
                      isSelected 
                        ? 'text-slate-800 dark:text-slate-100 font-semibold' 
                        : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      {cat}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timer Launcher Action Button */}
          <button
            id="start-timer-btn"
            onClick={handleStart}
            className="w-full inline-flex items-center justify-center gap-2.5 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl tracking-tight transition-all duration-200 hover:shadow-md cursor-pointer text-sm"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Launch Track Timer</span>
          </button>

        </div>
      )}
    </div>
  );
}

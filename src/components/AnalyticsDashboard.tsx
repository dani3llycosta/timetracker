/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { 
  TrendingUp, 
  Clock, 
  Briefcase, 
  CalendarRange, 
  Activity as ActivityIcon,
  Flame
} from 'lucide-react';
import { TimeEntry, CategoryType, CATEGORIES, TimeFilter } from '../types';
import { getCategoryIcon, getCategoryColorClasses } from './ActiveTimer';

interface AnalyticsDashboardProps {
  entries: TimeEntry[];
  activeFilter: TimeFilter;
  onFilterChange: (filter: TimeFilter) => void;
}

// Helpers to identify dates
export const getTodayString = () => {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
};

export const isDateInCurrentWeek = (dateStr: string): boolean => {
  const entryDate = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const day = today.getDay();
  // Monday as start of week index (Sunday:0-6. Let's map Sunday=0 to 7 to subtract properly)
  const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1);
  
  const startOfWeek = new Date(today);
  startOfWeek.setDate(diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return entryDate >= startOfWeek && entryDate <= endOfWeek;
};

export const isDateToday = (dateStr: string): boolean => {
  return dateStr === getTodayString();
};

export default function AnalyticsDashboard({ 
  entries, 
  activeFilter, 
  onFilterChange 
}: AnalyticsDashboardProps) {

  // 1. Filter entries based on active tab Selection
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      if (activeFilter === 'Today') {
        return isDateToday(entry.date);
      } else if (activeFilter === 'This Week') {
        return isDateInCurrentWeek(entry.date);
      }
      return true; // 'All Time'
    });
  }, [entries, activeFilter]);

  // 2. Compute metrics across selections
  const { totalMinutes, totalWorkDaysCount, categoryHours } = useMemo(() => {
    let minutesAcc = 0;
    const workingDays = new Set<string>();
    const catMinutes: Record<CategoryType, number> = {
      'Manual Testing': 0,
      'Meetings': 0,
      'Conversations with Colleagues': 0,
      'Support': 0,
      'Documentation': 0,
      'Learning / Training': 0,
      'Other': 0,
    };

    filteredEntries.forEach(entry => {
      minutesAcc += entry.durationMinutes;
      workingDays.add(entry.date);
      if (entry.category in catMinutes) {
        catMinutes[entry.category] += entry.durationMinutes;
      } else {
        catMinutes[entry.category] = entry.durationMinutes;
      }
    });

    return {
      totalMinutes: minutesAcc,
      totalWorkDaysCount: workingDays.size,
      categoryHours: catMinutes
    };
  }, [filteredEntries]);

  const totalHours = totalMinutes / 60;

  // Convert minutes into hours for categories and compute ratios
  const categoryStats = useMemo(() => {
    return CATEGORIES.map(cat => {
      const mins = categoryHours[cat] || 0;
      const hrs = mins / 60;
      const percentage = totalMinutes > 0 ? (mins / totalMinutes) * 100 : 0;
      return {
        category: cat,
        minutes: mins,
        hours: hrs,
        percentage: Math.round(percentage * 10) / 10
      };
    })
    .filter(stat => stat.minutes > 0) // Only display active categories for clean aesthetics
    .sort((a, b) => b.minutes - a.minutes); // Sort highest time investment first
  }, [categoryHours, totalMinutes]);

  // Main Focus Category metric
  const mainFocusCategory = useMemo(() => {
    if (categoryStats.length === 0) return null;
    return categoryStats[0]; // first element after sorted desc
  }, [categoryStats]);

  // Streak Tracker logic: count consecutive logged days ending with today or yesterday
  const productivityStreak = useMemo(() => {
    const dates = Array.from(new Set(entries.map(e => e.date))).sort();
    if (dates.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    const todayStr = getTodayString();
    
    // Yesterday YYYY-MM-DD
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    // Has logged today or yesterday to preserve active streak
    const hasToday = dates.includes(todayStr);
    const hasYesterday = dates.includes(yesterdayStr);

    if (!hasToday && !hasYesterday) return 0;

    // Start backwards from the most recent logged date
    let currentCheckDate = hasToday ? today : yesterday;
    
    while (true) {
      const year = currentCheckDate.getFullYear();
      const month = String(currentCheckDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentCheckDate.getDate()).padStart(2, '0');
      const checkStr = `${year}-${month}-${day}`;

      if (dates.includes(checkStr)) {
        streak++;
        // Check previous day
        currentCheckDate.setDate(currentCheckDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [entries]);

  // Format decimal hours nicely (e.g. 1.5h, 45m or single digits)
  const formatHrs = (hrs: number) => {
    if (hrs === 0) return '0h';
    return `${Math.round(hrs * 10) / 10}h`;
  };

  // Static target of 40h per week goal
  const weeklyTargetHours = 40;
  const progressRatio = Math.min(100, Math.round((totalHours / weeklyTargetHours) * 100));

  return (
    <div className="space-y-6">
      
      {/* 1. Filter Bar & Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Activity Analytics</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">Real-time reports based on selected filters</p>
        </div>

        {/* Dynamic segmented control pill bar */}
        <div className="flex border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-1 rounded-2xl shadow-xs">
          {(['Today', 'This Week', 'All Time'] as TimeFilter[]).map((filter) => (
            <button
              key={filter}
              id={`filter-pill-${filter.toLowerCase().replace(/\s+/g, '-')}`}
              type="button"
              onClick={() => onFilterChange(filter)}
              className={`py-1.5 px-4 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-200 ${
                activeFilter === filter
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Key Performance Indicators Layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* KPI 1: Duration hours */}
        <div className="bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Tracked Time</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight block">
              {formatHrs(totalHours)}
            </span>
            <span className="text-3xs text-slate-400 dark:text-slate-500 font-medium">
              {totalMinutes} minutes categorized
            </span>
          </div>
        </div>

        {/* KPI 2: Logs Count */}
        <div className="bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Total Entries</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600">
              <ActivityIcon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight block">
              {filteredEntries.length}
            </span>
            <span className="text-3xs text-slate-400 dark:text-slate-500 font-medium">
              Over {totalWorkDaysCount || 1} logging {totalWorkDaysCount === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>

        {/* KPI 3: Streak Count */}
        <div className="bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Daily Streak</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-500">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight block">
              {productivityStreak} {productivityStreak === 1 ? 'day' : 'days'}
            </span>
            <span className="text-3xs text-slate-400 dark:text-slate-500 font-medium">
              Keep the momentum going!
            </span>
          </div>
        </div>

        {/* KPI 4: Main Focus Category */}
        <div className="bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Core Focus</span>
            <div className="p-1.5 rounded-lg bg-pink-50 dark:bg-pink-950/20 text-pink-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate block">
              {mainFocusCategory ? mainFocusCategory.category : 'No tasks logged'}
            </span>
            <span className="text-3xs text-slate-400 dark:text-slate-500 font-medium">
              {mainFocusCategory ? `${mainFocusCategory.percentage}% of workspace activities` : 'Start logs to report info'}
            </span>
          </div>
        </div>

      </div>

      {/* 3. Detailed Weekly Progress Goals & Dynamic Breakdown charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visual Percentages List Card (Weekly Report Requirement) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 lg:col-span-2 transition-colors">
          
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 tracking-tight text-sm">Workspace Activity Weights</h3>
              <p className="text-3xs text-slate-400">Ratios spent per work category during filtered term</p>
            </div>
            <CalendarRange className="w-4 h-4 text-slate-400" />
          </div>

          {categoryStats.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Briefcase className="w-10 h-10 text-slate-200 dark:text-slate-800 mb-2" />
              <p className="text-xs text-slate-400 font-medium">No activity items discovered in this range.</p>
              <p className="text-3xs text-slate-400/80 mt-1">Start timer or log activity, and reports will print percentages dynamically.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categoryStats.map((stat, idx) => {
                const color = getCategoryColorClasses(stat.category);
                
                // Animated delays or simply layouts
                return (
                  <div key={stat.category} className="space-y-1.5 group select-none">
                    
                    {/* Bar descriptors label */}
                    <div className="flex items-center justify-between text-xs font-semibold">
                      
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${color.bg} ${color.text}`}>
                          {getCategoryIcon(stat.category, "w-3.5 h-3.5")}
                        </div>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {stat.category}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-slate-800 dark:text-slate-100 font-bold block">
                          {formatHrs(stat.hours)}
                        </span>
                        <span className="text-3xs text-slate-400 dark:text-slate-500 font-semibold md:group-hover:text-emerald-500 transition-colors">
                          {stat.percentage}% weight
                        </span>
                      </div>

                    </div>

                    {/* Progress Indicator Track */}
                    <div className="h-2 w-full bg-slate-50 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-100/50 dark:border-slate-800/10">
                      <div 
                        className={`h-full rounded-full ${color.accent} transition-all duration-500`}
                        style={{ width: `${stat.percentage}%` }}
                      />
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Threshold Metrics Goals progress widget */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Productive Hours Target</h3>
              <span className="text-3xs uppercase font-bold tracking-wider text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-md">
                Weekly Target
              </span>
            </div>
            
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed mb-4">
              Visualize how close you are to completing your standard <span className="font-semibold text-slate-600 dark:text-slate-300">40-hour work week limit</span> based on logged entries.
            </p>
            
            {/* Round Percentage visualization clock circle */}
            <div className="relative w-28 h-28 mx-auto my-3 flex items-center justify-center">
              
              {/* Outer stroke shadow ring */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  className="stroke-emerald-500 dark:stroke-emerald-400 transition-all duration-500"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 48}
                  strokeDashoffset={2 * Math.PI * 48 * (1 - progressRatio / 100)}
                  strokeLinecap="round"
                />
              </svg>
              
              {/* Core inner numeric text */}
              <div className="absolute flex flex-col items-center">
                <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100 leading-none">
                  {progressRatio}%
                </span>
                <span className="text-3xs font-semibold text-slate-400 dark:text-slate-500 mt-1">
                  of 40h goal
                </span>
              </div>

            </div>
          </div>

          <div id="target-hours-remaining" className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-400 dark:text-slate-500">
            {totalHours >= weeklyTargetHours ? (
              <span className="text-emerald-500 font-bold">🎉 Weekly hours target accomplished!</span>
            ) : (
              <span>
                You need <strong className="text-slate-600 dark:text-slate-300 font-bold">{Math.max(0, Math.round((weeklyTargetHours - totalHours) * 10) / 10)}h</strong> more to reach weekly cap.
              </span>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}

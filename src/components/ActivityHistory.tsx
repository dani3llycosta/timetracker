/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { 
  Download, 
  Trash2, 
  Edit2, 
  Search, 
  Check, 
  X, 
  Filter, 
  Undo,
  Calendar,
  Clock, 
  FileText,
  HelpCircle,
  Clock3
} from 'lucide-react';
import { TimeEntry, CategoryType, CATEGORIES } from '../types';
import { getCategoryIcon, getCategoryColorClasses } from './ActiveTimer';

interface ActivityHistoryProps {
  entries: TimeEntry[];
  onUpdateEntry: (updated: TimeEntry) => void;
  onDeleteEntry: (id: string) => void;
}

export default function ActivityHistory({ 
  entries, 
  onUpdateEntry, 
  onDeleteEntry 
}: ActivityHistoryProps) {
  
  // Searching & filtering state controllers
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('All');
  
  // Inline edit registers
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState<CategoryType>('Manual Testing');
  const [editDurationVal, setEditDurationVal] = useState<string>('');
  const [editDurationType, setEditDurationType] = useState<'hours' | 'minutes'>('hours');
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // CSV Report Generator
  const handleCSVExport = () => {
    if (entries.length === 0) {
      alert('Your log is currently empty. There is no session activity data to export yet.');
      return;
    }
    
    const delimiter = ',';
    const headers = ['ID', 'Date', 'Category', 'Duration (Minutes)', 'Duration (Hours)', 'Tracking Method', 'Notes / Projects'];
    
    const rows = entries.map(entry => [
      entry.id,
      entry.date,
      `"${entry.category.replace(/"/g, '""')}"`,
      entry.durationMinutes,
      (entry.durationMinutes / 60).toFixed(2),
      entry.isTimerBased ? 'Timer Stopwatch' : 'Manual Entry',
      entry.notes ? `"${entry.notes.replace(/"/g, '""')}"` : ''
    ]);
    
    const csvContent = [headers.join(delimiter), ...rows.map(r => r.join(delimiter))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `work_activities_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Turn inline row on edit state
  const startEditing = (entry: TimeEntry) => {
    setEditingId(entry.id);
    setEditCategory(entry.category);
    
    // Choose unit representation based on hours or whole fractions
    if (entry.durationMinutes % 15 === 0) {
      setEditDurationVal((entry.durationMinutes / 60).toString());
      setEditDurationType('hours');
    } else {
      setEditDurationVal(entry.durationMinutes.toString());
      setEditDurationType('minutes');
    }
    setEditDate(entry.date);
    setEditNotes(entry.notes || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveInlineEdit = (id: string, isTimerBased: boolean) => {
    const rawVal = parseFloat(editDurationVal);
    if (isNaN(rawVal) || rawVal <= 0) {
      alert('Please provide a positive duration.');
      return;
    }

    const durationMinutes = editDurationType === 'hours' 
      ? Math.round(rawVal * 60) 
      : Math.round(rawVal);

    if (durationMinutes < 1) {
      alert('Duration must scale to at least 1 minute.');
      return;
    }

    onUpdateEntry({
      id,
      category: editCategory,
      durationMinutes,
      date: editDate,
      timestamp: new Date(editDate + 'T00:00:00').getTime() || Date.now(),
      notes: editNotes.trim() || undefined,
      isTimerBased
    });

    setEditingId(null);
  };

  // Filter lists based on Search criteria and Category dropdowns
  const processedEntries = useMemo(() => {
    return entries.filter(entry => {
      // Free form lookup text
      const matchesSearch = searchQuery.trim() === '' || 
        (entry.notes && entry.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        entry.category.toLowerCase().includes(searchQuery.toLowerCase());
        
      // Category tag filtering
      const matchesCategory = selectedCatFilter === 'All' || entry.category === selectedCatFilter;
      
      return matchesSearch && matchesCategory;
    });
  }, [entries, searchQuery, selectedCatFilter]);

  const formatHrsAndMins = (mins: number) => {
    const hrs = mins / 60;
    if (mins < 60) {
      return `${mins}m`;
    }
    const fixedHours = Math.round(hrs * 10) / 10;
    return `${fixedHours}h (${mins}m)`;
  };

  return (
    <div id="activity-history-card" className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800/80 shadow-xs transition-colors">
      
      {/* Search filters, and Export trigger header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm tracking-tight">Logged Activity History</h3>
          <p className="text-3xs text-slate-400">Total {processedEntries.length} items logged</p>
        </div>

        {/* Action Button: CSV Export */}
        <button
          id="export-csv-btn"
          onClick={handleCSVExport}
          className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-150 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold tracking-tight transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Productivity CSV</span>
        </button>
      </div>

      {/* Filter and Search Box Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-6 bg-slate-50 dark:bg-slate-950/30 p-3 rounded-2xl border border-slate-100/50 dark:border-slate-900/30">
        
        {/* Full Text Notes Search inputs */}
        <div className="relative sm:col-span-7">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input
            id="history-search-input"
            type="text"
            placeholder="Search notes or activity labels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8.5 pr-3 py-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder-slate-400"
          />
        </div>

        {/* Dropdown Category Filter tag */}
        <div className="relative sm:col-span-5">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Filter className="w-3.5 h-3.5" />
          </span>
          <select
            id="history-category-filter"
            value={selectedCatFilter}
            onChange={(e) => setSelectedCatFilter(e.target.value)}
            className="w-full text-xs pl-8.5 pr-8 py-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer font-medium"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
            <svg className="fill-current h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>

      </div>

      {/* Main Table or Grid of logged entries list */}
      {processedEntries.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <Clock3 className="w-12 h-12 text-slate-200 dark:text-slate-800 mb-2" />
          <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">No activity logs meet active filters.</p>
          <p className="text-3xs text-slate-400/80 mt-1">Clear searching text or log some minutes above.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse select-none">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-3xs uppercase font-extrabold tracking-wider">
                <th className="py-3 px-2 font-bold">Category</th>
                <th className="py-3 px-2 font-bold">Duration</th>
                <th className="py-3 px-2 font-bold">Date</th>
                <th className="py-3 px-2 max-w-xs font-bold">Notes / Description</th>
                <th className="py-3 px-2 text-right font-bold">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/40">
              {processedEntries.map((entry) => {
                const color = getCategoryColorClasses(entry.category);
                const isEditingThis = editingId === entry.id;

                if (isEditingThis) {
                  return (
                    <tr key={entry.id} className="bg-slate-50/50 dark:bg-slate-950/20">
                      
                      {/* Edit Category select */}
                      <td className="py-3 px-2">
                        <select
                          id="edit-entry-category"
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value as CategoryType)}
                          className="text-xs p-1.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </td>

                      {/* Edit Duration input */}
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1">
                          <input
                            id="edit-entry-duration"
                            type="number"
                            step="any"
                            value={editDurationVal}
                            onChange={(e) => setEditDurationVal(e.target.value)}
                            className="w-14 text-xs p-1.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg outline-none font-bold"
                          />
                          <select
                            id="edit-entry-duration-unit"
                            value={editDurationType}
                            onChange={(e) => setEditDurationType(e.target.value as 'hours' | 'minutes')}
                            className="text-3xs p-1 bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800 rounded-lg outline-none font-semibold"
                          >
                            <option value="hours">hrs</option>
                            <option value="minutes">mins</option>
                          </select>
                        </div>
                      </td>

                      {/* Edit Date datepicker */}
                      <td className="py-3 px-2">
                        <input
                          id="edit-entry-date"
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="text-xs p-1.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
                        />
                      </td>

                      {/* Edit Notes description input */}
                      <td className="py-3 px-2 max-w-xs">
                        <input
                          id="edit-entry-notes"
                          type="text"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          className="w-full text-xs p-1.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
                          placeholder="Optional notes..."
                        />
                      </td>

                      {/* Editing actions buttons */}
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`save-edit-${entry.id}`}
                            onClick={() => saveInlineEdit(entry.id, entry.isTimerBased)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-900/30 transition-colors"
                            title="Save changes"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`cancel-edit-${entry.id}`}
                            onClick={cancelEditing}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                            title="Cancel editing"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                }

                // Normal row display
                return (
                  <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors group">
                    
                    {/* Category column */}
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2 font-medium">
                        <span className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${color.bg} ${color.text}`}>
                          {getCategoryIcon(entry.category, "w-3.5 h-3.5")}
                          {entry.category}
                        </span>
                      </div>
                    </td>

                    {/* Duration column */}
                    <td className="py-3 px-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                        {formatHrsAndMins(entry.durationMinutes)}
                      </span>
                    </td>

                    {/* Date column */}
                    <td className="py-3 px-2 text-3xs font-semibold text-slate-400 dark:text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-450" />
                        {entry.date}
                      </span>
                    </td>

                    {/* Notes column */}
                    <td className="py-3 px-2 max-w-xs">
                      {entry.notes ? (
                        <span className="text-xs text-slate-600 dark:text-slate-300 truncate block break-words" title={entry.notes}>
                          {entry.notes}
                        </span>
                      ) : (
                        <span className="text-3xs text-slate-300 dark:text-slate-650 italic">
                          No notes entered
                        </span>
                      )}
                    </td>

                    {/* Controls Column */}
                    <td className="py-3 px-2 text-right">
                      <div className="flex items-center justify-end gap-1 px-1 opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        
                        {/* Edit Button trigger */}
                        <button
                          id={`edit-btn-${entry.id}`}
                          onClick={() => startEditing(entry)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-150 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800 text-slate-550 dark:text-slate-400 rounded-lg transition-colors cursor-pointer"
                          title="Edit log details"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        
                        {/* Delete row trigger */}
                        <button
                          id={`delete-btn-${entry.id}`}
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this tracked entry permanently?')) {
                              onDeleteEntry(entry.id);
                            }
                          }}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-500 rounded-lg transition-colors border border-rose-100/30 cursor-pointer"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>

                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}

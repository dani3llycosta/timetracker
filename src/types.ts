/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CategoryType =
  | 'Manual Testing'
  | 'Meetings'
  | 'Conversations with Colleagues'
  | 'Support'
  | 'Documentation'
  | 'Learning / Training'
  | 'Other';

export const CATEGORIES: CategoryType[] = [
  'Manual Testing',
  'Meetings',
  'Conversations with Colleagues',
  'Support',
  'Documentation',
  'Learning / Training',
  'Other',
];

export interface TimeEntry {
  id: string;
  category: CategoryType;
  durationMinutes: number; // stored in minutes
  date: string; // ISO Date String 'YYYY-MM-DD'
  timestamp: number; // millisecond epoch
  notes?: string;
  isTimerBased: boolean;
}

export interface ActiveTimerState {
  startTime: number; // millisecond timestamp of timer start
  category: CategoryType;
  notes?: string;
  isPaused: boolean;
  pausedDurationMs: number; // total locked-in elapsed duration before current pause state
  lastTickTime: number; // last recorded absolute millisecond timestamp for tracking accumulation
}

export type TimeFilter = 'Today' | 'This Week' | 'All Time';

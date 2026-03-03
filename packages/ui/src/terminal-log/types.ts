export type LogLevel = 'info' | 'success' | 'error' | 'warn';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
}

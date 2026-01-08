
export enum TaskStatus {
  PLANNED = '未開始',
  IN_PROGRESS = '施工中',
  COMPLETED = '已完工',
  DELAYED = '進度落後'
}

export interface ConstructionTask {
  id: string;
  name: string;
  startDate: string;
  duration: number; // Total planned days
  progress: number; // 0 to 100
  category: string;
  manager: string;
  dependencies?: string[]; // IDs of tasks that must be completed before this one starts
}

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  delayedTasks: number;
  overallProgress: number;
}

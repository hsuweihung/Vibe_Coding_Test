
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  LayoutDashboard, 
  ListTodo, 
  Sparkles,
  Info,
  BarChart3,
  X,
  User,
  Link as LinkIcon,
  ArrowRight,
  Briefcase
} from 'lucide-react';
import { ConstructionTask, TaskStatus, ProjectStats } from './types';
import { analyzeSchedule } from './services/geminiService';

// Mock Data with Dependencies
const INITIAL_TASKS: ConstructionTask[] = [
  { id: '1', name: '地基開挖工程', startDate: '2023-10-01', duration: 15, progress: 100, category: '土木', manager: '陳大文', dependencies: [] },
  { id: '2', name: '鋼筋綁紮與模板', startDate: '2023-10-18', duration: 20, progress: 80, category: '結構', manager: '張小明', dependencies: ['1'] },
  { id: '3', name: '混凝土灌漿', startDate: '2023-11-10', duration: 10, progress: 20, category: '結構', manager: '李志豪', dependencies: ['2'] },
  { id: '4', name: '機電管線配置', startDate: '2023-11-15', duration: 12, progress: 0, category: '水電', manager: '王建國', dependencies: ['2'] },
  { id: '5', name: '外牆貼磚工程', startDate: '2023-12-01', duration: 25, progress: 0, category: '裝修', manager: '林美玲', dependencies: ['3'] },
];

const AddTaskModal: React.FC<{ 
  existingTasks: ConstructionTask[]; 
  onClose: () => void; 
  onAdd: (task: ConstructionTask) => void 
}> = ({ existingTasks, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [duration, setDuration] = useState(1);
  const [category, setCategory] = useState('結構');
  const [manager, setManager] = useState('');
  const [selectedDeps, setSelectedDeps] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !manager) return;

    const newTask: ConstructionTask = {
      id: Date.now().toString(),
      name,
      startDate,
      duration: Number(duration),
      progress: 0,
      category,
      manager,
      dependencies: selectedDeps
    };
    onAdd(newTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-6 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">新增施工項目</h2>
          <button onClick={onClose} className="bg-gray-100 p-2 rounded-full text-gray-400 active:scale-90">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">項目名稱</label>
            <input 
              required
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              placeholder="例如：室內裝修工程"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">開始日期</label>
              <input 
                required
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">預計天數</label>
              <input 
                required
                type="number" 
                min="1"
                value={duration} 
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-gray-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">分類</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="結構">結構</option>
                <option value="土木">土木</option>
                <option value="水電">水電</option>
                <option value="裝修">裝修</option>
                <option value="景觀">景觀</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">負責人</label>
              <input 
                required
                type="text" 
                value={manager} 
                onChange={(e) => setManager(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="姓名"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">前置項目 (相依性)</label>
            <div className="bg-gray-50 rounded-xl p-3 max-h-32 overflow-y-auto border border-gray-100">
              {existingTasks.map(t => (
                <label key={t.id} className="flex items-center space-x-2 py-1 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedDeps.includes(t.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedDeps([...selectedDeps, t.id]);
                      else setSelectedDeps(selectedDeps.filter(id => id !== t.id));
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{t.name}</span>
                </label>
              ))}
              {existingTasks.length === 0 && <p className="text-xs text-gray-400 italic">目前無其他項目</p>}
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold active:scale-95 shadow-lg shadow-blue-200 mt-2 transition-all"
          >
            確認新增
          </button>
        </form>
      </div>
    </div>
  );
};

interface GanttChartProps {
  tasks: ConstructionTask[];
  onTaskClick: (task: ConstructionTask) => void;
}

const GanttChart: React.FC<GanttChartProps> = ({ tasks, onTaskClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { minDate, totalDays } = useMemo(() => {
    if (tasks.length === 0) return { minDate: new Date(), totalDays: 30 };
    const dates = tasks.flatMap(t => {
      const start = new Date(t.startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + t.duration);
      return [start, end];
    });
    const min = new Date(Math.min(...dates.map(d => d.getTime())));
    const max = new Date(Math.max(...dates.map(d => d.getTime())));
    max.setDate(max.getDate() + 10);
    const diffDays = Math.ceil((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24));
    return { minDate: min, totalDays: Math.max(diffDays, 1) };
  }, [tasks]);

  const formatDate = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`;

  const renderDependencyLines = () => {
    return tasks.flatMap(task => {
      if (!task.dependencies) return [];
      
      return task.dependencies.map(depId => {
        const parentTask = tasks.find(t => t.id === depId);
        if (!parentTask) return null;

        const parentStart = new Date(parentTask.startDate);
        const parentOffset = Math.ceil((parentStart.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
        const parentEndPos = ((parentOffset + parentTask.duration) / totalDays) * 100;
        
        const childStart = new Date(task.startDate);
        const childOffset = Math.ceil((childStart.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
        const childStartPos = (childOffset / totalDays) * 100;

        const parentTaskIndex = tasks.indexOf(parentTask);
        const childTaskIndex = tasks.indexOf(task);

        const y1 = parentTaskIndex * 56 + 40; 
        const y2 = childTaskIndex * 56 + 40;

        return (
          <path
            key={`${depId}-${task.id}`}
            d={`M ${parentEndPos}% ${y1} L ${parentEndPos + 1}% ${y1} L ${parentEndPos + 1}% ${y2} L ${childStartPos}% ${y2}`}
            fill="none"
            stroke="#94A3B8"
            strokeWidth="1.5"
            strokeDasharray="4 2"
            markerEnd="url(#arrowhead)"
          />
        );
      });
    });
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 overflow-x-auto relative">
      <div className="min-w-[700px] relative" ref={containerRef}>
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-60">
          <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orientation="auto">
              <polygon points="0 0, 6 2, 0 4" fill="#94A3B8" />
            </marker>
          </defs>
          <g transform="translate(128, 48)">{renderDependencyLines()}</g>
        </svg>

        <div className="flex border-b border-gray-100 pb-2 mb-4">
          <div className="w-32 shrink-0 font-bold text-xs text-gray-400 uppercase">施工項目</div>
          <div className="flex-1 relative h-6">
            {[...Array(7)].map((_, i) => {
              const date = new Date(minDate);
              date.setDate(date.getDate() + (i * Math.floor(totalDays / 6)));
              const left = (i / 6) * 100;
              return (
                <div key={i} className="absolute text-[10px] text-gray-400 font-medium whitespace-nowrap" style={{ left: `${left}%` }}>
                  {formatDate(date)}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6 relative z-20">
          {tasks.map((task) => {
            const startDate = new Date(task.startDate);
            const offsetDays = Math.ceil((startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
            const leftPercent = (offsetDays / totalDays) * 100;
            const widthPercent = (task.duration / totalDays) * 100;

            return (
              <div key={task.id} className="flex items-center group cursor-pointer h-8" onClick={() => onTaskClick(task)}>
                <div className="w-32 shrink-0 pr-2">
                  <p className="text-xs font-bold text-gray-700 truncate group-hover:text-blue-600 transition-colors">
                    {task.name}
                  </p>
                </div>
                <div className="flex-1 relative h-full bg-gray-50/50 rounded-lg overflow-hidden border border-gray-100/50 group-hover:bg-blue-50 transition-colors">
                  <div 
                    className="absolute top-1 bottom-1 rounded-md shadow-sm flex items-center overflow-hidden transition-all duration-500 group-active:scale-[0.98]"
                    style={{ 
                      left: `${leftPercent}%`, 
                      width: `${widthPercent}%`,
                      backgroundColor: task.progress === 100 ? '#DEF7EC' : task.progress > 0 ? '#E1EFFE' : '#F3F4F6',
                      border: `1px solid ${task.progress === 100 ? '#31C48D' : task.progress > 0 ? '#3F83F8' : '#D1D5DB'}`
                    }}
                  >
                    <div 
                      className="absolute left-0 top-0 bottom-0 transition-all duration-1000"
                      style={{ 
                        width: `${task.progress}%`,
                        backgroundColor: task.progress === 100 ? '#31C48D' : '#3F83F8',
                        opacity: 0.8
                      }}
                    />
                    <span className="relative z-10 ml-1 text-[8px] font-bold text-white drop-shadow-sm">
                      {task.progress}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {tasks.length === 0 && <p className="text-center text-gray-400 py-10 text-sm">目前無施工項目</p>}
        </div>
      </div>
      <div className="mt-8 flex items-center space-x-4 text-[10px]">
        <div className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded-sm mr-1"></div>已完工</div>
        <div className="flex items-center"><div className="w-3 h-3 bg-blue-500 rounded-sm mr-1"></div>進行中</div>
        <div className="flex items-center text-gray-400 font-medium">
          <span className="border-b border-dashed border-gray-400 w-6 mr-1 h-0"></span> 相依路徑
        </div>
      </div>
    </div>
  );
};

const TaskDetailModal: React.FC<{ task: ConstructionTask; allTasks: ConstructionTask[]; onClose: () => void }> = ({ task, allTasks, onClose }) => {
  const daysWorked = Math.floor(task.duration * (task.progress / 100));
  const daysLeft = task.duration - daysWorked;
  
  const predecessors = allTasks.filter(t => task.dependencies?.includes(t.id));
  const successors = allTasks.filter(t => t.dependencies?.includes(task.id));

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-start mb-6">
          <div>
             <div className="flex items-center space-x-2 mb-1">
               <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                 {task.category}
               </span>
               <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  task.progress === 100 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
               }`}>
                 {task.progress === 100 ? '已完工' : '施工中'}
               </span>
             </div>
             <h2 className="text-2xl font-bold text-gray-900">{task.name}</h2>
          </div>
          <button onClick={onClose} className="bg-gray-100 p-2 rounded-full text-gray-400 active:scale-90">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex justify-between items-end mb-2">
               <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">目前進度</p>
               <p className="text-2xl font-black text-blue-600">{task.progress}%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full" 
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center">
              <LinkIcon size={14} className="mr-1" />
              工序關聯分析
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-[10px] text-gray-500 font-bold mb-2">前置項目 (Pre)</p>
                {predecessors.length > 0 ? (
                  <div className="space-y-1">
                    {predecessors.map(p => (
                      <div key={p.id} className="flex items-center text-xs font-medium text-gray-700">
                        <ArrowRight size={10} className="mr-1 text-blue-500" />
                        {p.name}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-400 italic">無前置要求</p>
                )}
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-[10px] text-gray-500 font-bold mb-2">後續項目 (Next)</p>
                {successors.length > 0 ? (
                  <div className="space-y-1">
                    {successors.map(s => (
                      <div key={s.id} className="flex items-center text-xs font-medium text-gray-700">
                        <ArrowRight size={10} className="mr-1 text-orange-500" />
                        {s.name}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-400 italic">無後續影響</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-2xl p-4">
            <div className="text-center">
              <p className="text-[10px] text-gray-500 uppercase font-bold">預計工期</p>
              <p className="text-lg font-black text-gray-800">{task.duration} <span className="text-xs font-normal">天</span></p>
            </div>
            <div className="text-center border-x border-gray-200">
              <p className="text-[10px] text-gray-500 uppercase font-bold">已施作</p>
              <p className="text-lg font-black text-blue-600">{daysWorked} <span className="text-xs font-normal">天</span></p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-500 uppercase font-bold">剩餘</p>
              <p className="text-lg font-black text-orange-600">{daysLeft} <span className="text-xs font-normal">天</span></p>
            </div>
          </div>

          <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold active:scale-95 shadow-lg shadow-blue-200">
            更新進度日誌
          </button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [tasks, setTasks] = useState<ConstructionTask[]>(INITIAL_TASKS);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'gantt' | 'ai'>('dashboard');
  const [selectedTask, setSelectedTask] = useState<ConstructionTask | null>(null);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const stats = useMemo<ProjectStats>(() => {
    const total = tasks.length;
    if (total === 0) return { totalTasks: 0, completedTasks: 0, inProgressTasks: 0, delayedTasks: 0, overallProgress: 0 };
    const completed = tasks.filter(t => t.progress === 100).length;
    const inProgress = tasks.filter(t => t.progress > 0 && t.progress < 100).length;
    const delayed = tasks.filter(t => t.progress > 0 && t.progress < 40).length;
    const overall = tasks.reduce((acc, t) => acc + t.progress, 0) / total;
    return { totalTasks: total, completedTasks: completed, inProgressTasks: inProgress, delayedTasks: delayed, overallProgress: Math.round(overall) };
  }, [tasks]);

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzeSchedule(tasks);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const getTaskStatus = (task: ConstructionTask): TaskStatus => {
    if (task.progress === 100) return TaskStatus.COMPLETED;
    if (task.progress === 0) return TaskStatus.PLANNED;
    if (task.progress < 40) return TaskStatus.DELAYED;
    return TaskStatus.IN_PROGRESS;
  };

  const handleAddTask = (newTask: ConstructionTask) => {
    setTasks([...tasks, newTask]);
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return '項目概覽';
      case 'list': return '施工清單';
      case 'gantt': return '施工甘特圖';
      case 'ai': return 'AI 智庫';
      default: return 'SiteMaster Pro';
    }
  };

  return (
    <div className="min-h-screen pb-24 max-w-md mx-auto bg-[#F2F2F7] shadow-2xl relative overflow-hidden">
      <header className="ios-blur sticky top-0 z-50 px-5 pt-12 pb-4 border-b border-gray-200">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-black transition-all">
              {getPageTitle()}
            </h1>
            <p className="text-gray-500 text-sm font-medium">工地：台北信義建案 A1</p>
          </div>
          <button 
            onClick={() => setIsAddTaskModalOpen(true)}
            className="bg-blue-600 text-white p-2 rounded-full active:scale-95 shadow-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={24} />
          </button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {activeTab === 'dashboard' && (
          <>
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">總體進度</h2>
                <span className="text-3xl font-bold text-blue-600">{stats.overallProgress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${stats.overallProgress}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-blue-50 p-3 rounded-xl">
                  <p className="text-xs text-blue-600 font-bold uppercase">進行中</p>
                  <p className="text-2xl font-bold text-blue-800">{stats.inProgressTasks}</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-xl">
                  <p className="text-xs text-orange-600 font-bold uppercase">落後項目</p>
                  <p className="text-2xl font-bold text-orange-800">{stats.delayedTasks}</p>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white p-4 rounded-2xl shadow-sm flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded-lg"><CheckCircle2 className="text-green-600" size={20} /></div>
                  <div>
                    <p className="text-xs text-gray-500">已完工</p>
                    <p className="text-lg font-bold">{stats.completedTasks}</p>
                  </div>
               </div>
               <div className="bg-white p-4 rounded-2xl shadow-sm flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg"><Calendar className="text-blue-600" size={20} /></div>
                  <div>
                    <p className="text-xs text-gray-500">總項目</p>
                    <p className="text-lg font-bold">{stats.totalTasks}</p>
                  </div>
               </div>
            </div>

            <button 
              onClick={() => setActiveTab('ai')}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-2xl shadow-lg flex items-center justify-between group active:scale-[0.98]"
            >
              <div className="flex items-center space-x-3 text-white">
                <Sparkles size={24} className="animate-pulse" />
                <div className="text-left">
                  <p className="font-bold">生成 AI 排程診斷</p>
                  <p className="text-xs opacity-80">分析工序相依性與進度風險</p>
                </div>
              </div>
              <ChevronRight className="text-white opacity-50 group-hover:translate-x-1" />
            </button>
          </>
        )}

        {activeTab === 'list' && (
          <div className="space-y-4">
            {tasks.map(task => {
              const status = getTaskStatus(task);
              const daysWorked = Math.floor(task.duration * (task.progress / 100));
              const daysLeft = task.duration - daysWorked;
              
              return (
                <div 
                  key={task.id} 
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.99] cursor-pointer"
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        status === TaskStatus.COMPLETED ? 'bg-green-100 text-green-700' :
                        status === TaskStatus.DELAYED ? 'bg-red-100 text-red-700' :
                        status === TaskStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {status}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 mt-1">{task.name}</h3>
                    </div>
                    <p className="text-blue-600 font-bold">{task.progress}%</p>
                  </div>
                  
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                    <div 
                      className={`h-2 rounded-full transition-all duration-700 ${
                        status === TaskStatus.DELAYED ? 'bg-red-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t pt-3">
                    <div className="text-center">
                      <p className="text-[10px] text-gray-500 uppercase">預計工期</p>
                      <p className="text-sm font-bold">{task.duration} 天</p>
                    </div>
                    <div className="text-center border-x">
                      <p className="text-[10px] text-gray-500 uppercase">已施作</p>
                      <p className="text-sm font-bold text-blue-600">{daysWorked} 天</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-500 uppercase">剩餘</p>
                      <p className="text-sm font-bold text-orange-600">{daysLeft} 天</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {tasks.length === 0 && (
              <div className="text-center py-20">
                <Briefcase className="mx-auto text-gray-200 mb-4" size={48} />
                <p className="text-gray-400 text-sm">點擊右上方按鈕新增第一個施工項目</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'gantt' && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-2xl flex items-center space-x-3 border border-blue-100">
              <Calendar className="text-blue-600" size={20} />
              <p className="text-xs text-blue-800 leading-relaxed font-medium">
                虛線連結顯示項目的相依關係。後續項目需等待前置項目完工後方可順暢銜接。
              </p>
            </div>
            <GanttChart tasks={tasks} onTaskClick={(task) => setSelectedTask(task)} />
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-6">
            {!aiAnalysis ? (
              <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-gray-100">
                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="text-indigo-600" size={32} />
                </div>
                <h2 className="text-xl font-bold mb-2">智慧工期與連鎖反應診斷</h2>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                  點擊下方按鈕，AI 將分析當前所有項目的「前置/後續」關係，為您提供關鍵路徑上的瓶頸預測。
                </p>
                <button 
                  onClick={handleAIAnalysis}
                  disabled={isAnalyzing}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      <span>AI 分析中...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      <span>分析工序相依性</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold flex items-center text-indigo-700">
                    <Info size={20} className="mr-2" />
                    AI 智慧診斷結果
                  </h2>
                  <button onClick={() => setAiAnalysis(null)} className="text-xs text-gray-400">清除</button>
                </div>
                <div className="prose prose-sm prose-indigo text-gray-700 leading-relaxed whitespace-pre-line">
                  {aiAnalysis}
                </div>
                <div className="mt-8 pt-4 border-t flex items-center justify-between">
                  <p className="text-[10px] text-gray-400 italic">由 Gemini 3 Pro 驅動</p>
                  <button 
                    onClick={handleAIAnalysis}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    重新生成建議
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask} 
          allTasks={tasks}
          onClose={() => setSelectedTask(null)} 
        />
      )}

      {/* Add Task Modal */}
      {isAddTaskModalOpen && (
        <AddTaskModal 
          existingTasks={tasks} 
          onClose={() => setIsAddTaskModalOpen(false)} 
          onAdd={handleAddTask} 
        />
      )}

      {/* iOS Tab Bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md ios-blur border-t border-gray-200 px-6 pt-3 pb-8 flex justify-between items-center z-50">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center space-y-1 transition-all ${activeTab === 'dashboard' ? 'text-blue-600 scale-110' : 'text-gray-400'}`}
        >
          <LayoutDashboard size={24} />
          <span className="text-[10px] font-medium">概覽</span>
        </button>
        <button 
          onClick={() => setActiveTab('list')}
          className={`flex flex-col items-center space-y-1 transition-all ${activeTab === 'list' ? 'text-blue-600 scale-110' : 'text-gray-400'}`}
        >
          <ListTodo size={24} />
          <span className="text-[10px] font-medium">排程</span>
        </button>
        <button 
          onClick={() => setActiveTab('gantt')}
          className={`flex flex-col items-center space-y-1 transition-all ${activeTab === 'gantt' ? 'text-blue-600 scale-110' : 'text-gray-400'}`}
        >
          <BarChart3 size={24} />
          <span className="text-[10px] font-medium">甘特圖</span>
        </button>
        <button 
          onClick={() => setActiveTab('ai')}
          className={`flex flex-col items-center space-y-1 transition-all ${activeTab === 'ai' ? 'text-blue-600 scale-110' : 'text-gray-400'}`}
        >
          <Sparkles size={24} />
          <span className="text-[10px] font-medium">AI 建議</span>
        </button>
      </nav>
    </div>
  );
};

export default App;

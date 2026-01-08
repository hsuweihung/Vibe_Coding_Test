
import React, { useState, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  SafeAreaView,
  Dimensions,
  Platform
} from 'react-native';
import { 
  Plus, 
  LayoutDashboard, 
  ListTodo, 
  BarChart3, 
  Sparkles, 
  X, 
  Clock, 
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronRight,
  Info,
  Link as LinkIcon,
  ArrowRight
} from 'lucide-react';
import { ConstructionTask, TaskStatus, ProjectStats } from './types';
import { analyzeSchedule } from './services/geminiService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const INITIAL_TASKS: ConstructionTask[] = [
  { id: '1', name: '地基開挖工程', startDate: '2023-10-01', duration: 15, progress: 100, category: '土木', manager: '陳大文', dependencies: [] },
  { id: '2', name: '鋼筋綁紮與模板', startDate: '2023-10-18', duration: 20, progress: 80, category: '結構', manager: '張小明', dependencies: ['1'] },
  { id: '3', name: '混凝土灌漿', startDate: '2023-11-10', duration: 10, progress: 20, category: '結構', manager: '李志豪', dependencies: ['2'] },
  { id: '4', name: '機電管線配置', startDate: '2023-11-15', duration: 12, progress: 0, category: '水電', manager: '王建國', dependencies: ['2'] },
  { id: '5', name: '外牆貼磚工程', startDate: '2023-12-01', duration: 25, progress: 0, category: '裝修', manager: '林美玲', dependencies: ['3'] },
];

// --- Sub-components ---

const GanttChart = ({ tasks, onTaskClick }: { tasks: ConstructionTask[], onTaskClick: (t: ConstructionTask) => void }) => {
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

  const chartWidth = Math.max(SCREEN_WIDTH * 1.5, 700);

  const renderLines = () => tasks.flatMap(task => (task.dependencies || []).map(depId => {
    const parent = tasks.find(t => t.id === depId);
    if (!parent) return null;
    const parentIdx = tasks.indexOf(parent);
    const childIdx = tasks.indexOf(task);
    const pEnd = ((Math.ceil((new Date(parent.startDate).getTime() - minDate.getTime()) / 86400000) + parent.duration) / totalDays) * 100;
    const cStart = (Math.ceil((new Date(task.startDate).getTime() - minDate.getTime()) / 86400000) / totalDays) * 100;
    const y1 = parentIdx * 56 + 28;
    const y2 = childIdx * 56 + 28;
    return (
      <path key={`${depId}-${task.id}`} d={`M ${pEnd}% ${y1} L ${pEnd + 0.5}% ${y1} L ${pEnd + 0.5}% ${y2} L ${cStart}% ${y2}`} 
        fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="4 2" />
    );
  }));

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ganttContainer}>
      <View style={{ width: chartWidth, padding: 16 }}>
        <View style={styles.ganttHeader}>
          <Text style={styles.ganttTitleLabel}>施工項目</Text>
          <View style={styles.ganttTimeline}>
            {[...Array(6)].map((_, i) => (
              <Text key={i} style={styles.ganttDateText}>
                {new Date(minDate.getTime() + (i * Math.floor(totalDays/5) * 86400000)).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
              </Text>
            ))}
          </View>
        </View>

        <View style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', width: '100%', height: '100%', left: 120 }}>
            {renderLines()}
          </svg>
          {tasks.map((task) => {
            const left = (Math.ceil((new Date(task.startDate).getTime() - minDate.getTime()) / 86400000) / totalDays) * 100;
            const width = (task.duration / totalDays) * 100;
            return (
              <TouchableOpacity key={task.id} onPress={() => onTaskClick(task)} style={styles.ganttRow}>
                <Text style={styles.ganttRowLabel} numberOfLines={1}>{task.name}</Text>
                <View style={styles.ganttBarTrack}>
                   <View style={[styles.ganttBar, { left: `${left}%`, width: `${width}%`, backgroundColor: task.progress === 100 ? '#31C48D' : '#3F83F8' }]}>
                     <View style={[styles.ganttProgress, { width: `${task.progress}%` }]} />
                   </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
};

// --- Main App ---

export default function App() {
  const [tasks, setTasks] = useState<ConstructionTask[]>(INITIAL_TASKS);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTask, setSelectedTask] = useState<ConstructionTask | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const stats = useMemo(() => {
    const total = tasks.length || 1;
    const completed = tasks.filter(t => t.progress === 100).length;
    const progress = Math.round(tasks.reduce((acc, t) => acc + t.progress, 0) / total);
    return { total, completed, progress };
  }, [tasks]);

  const runAi = async () => {
    setLoadingAi(true);
    const res = await analyzeSchedule(tasks);
    setAiResult(res);
    setLoadingAi(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <ScrollView style={styles.content}>
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>總體進度</Text>
                <Text style={styles.progressText}>{stats.progress}%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${stats.progress}%` }]} />
              </View>
              <View style={styles.statsGrid}>
                <View style={[styles.statBox, { backgroundColor: '#E1EFFE' }]}>
                  <Text style={styles.statLabel}>已完工</Text>
                  <Text style={styles.statValue}>{stats.completed}</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: '#F3F4F6' }]}>
                  <Text style={styles.statLabel}>總項目</Text>
                  <Text style={styles.statValue}>{stats.total}</Text>
                </View>
              </View>
            </section>
            <TouchableOpacity onPress={() => setActiveTab('ai')} style={styles.aiButton}>
              <Sparkles color="white" size={24} />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.aiButtonText}>AI 智慧診斷</Text>
                <Text style={styles.aiButtonSub}>分析關鍵路徑與相依風險</Text>
              </View>
              <ChevronRight color="rgba(255,255,255,0.5)" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          </ScrollView>
        );
      case 'list':
        return (
          <ScrollView style={styles.content}>
            {tasks.map(task => (
              <TouchableOpacity key={task.id} style={styles.taskItem} onPress={() => setSelectedTask(task)}>
                <View style={styles.rowBetween}>
                  <View>
                    <Text style={styles.taskCategory}>{task.category}</Text>
                    <Text style={styles.taskName}>{task.name}</Text>
                  </View>
                  <Text style={styles.taskProgressPercent}>{task.progress}%</Text>
                </View>
                <View style={styles.miniProgressBar}>
                  <View style={[styles.miniProgressBarFill, { width: `${task.progress}%`, backgroundColor: task.progress === 100 ? '#31C48D' : '#3F83F8' }]} />
                </View>
                <View style={styles.taskFooter}>
                  <Clock size={12} color="#9CA3AF" />
                  <Text style={styles.taskFooterText}>{task.startDate} • {task.manager}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        );
      case 'gantt':
        return (
          <View style={styles.content}>
            <GanttChart tasks={tasks} onTaskClick={setSelectedTask} />
          </View>
        );
      case 'ai':
        return (
          <ScrollView style={styles.content}>
            {!aiResult ? (
              <View style={styles.aiEmptyState}>
                <View style={styles.aiIconCircle}><Sparkles color="#4F46E5" size={40} /></View>
                <Text style={styles.aiEmptyTitle}>智慧工期分析</Text>
                <Text style={styles.aiEmptyDesc}>Gemini 將分析您的排程邏輯，找出潛在的延誤風險與優化契機。</Text>
                <TouchableOpacity onPress={runAi} disabled={loadingAi} style={styles.primaryButton}>
                  {loadingAi ? <Text style={styles.primaryButtonText}>分析中...</Text> : <Text style={styles.primaryButtonText}>開始分析</Text>}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.aiResultCard}>
                <View style={styles.rowBetween}>
                  <Text style={styles.aiResultTitle}>診斷報告</Text>
                  <TouchableOpacity onPress={() => setAiResult(null)}><Text style={{ color: '#9CA3AF', fontSize: 12 }}>清除</Text></TouchableOpacity>
                </View>
                <Text style={styles.aiResultBody}>{aiResult}</Text>
              </View>
            )}
          </ScrollView>
        );
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{activeTab === 'dashboard' ? '項目概覽' : activeTab === 'list' ? '施工清單' : activeTab === 'gantt' ? '甘特圖' : 'AI 建議'}</Text>
          <Text style={styles.headerSub}>台北信義建案 A1</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setIsAdding(true)}>
          <Plus color="white" size={24} />
        </TouchableOpacity>
      </View>

      {renderContent()}

      <View style={styles.tabBar}>
        <TouchableOpacity onPress={() => setActiveTab('dashboard')} style={styles.tabItem}>
          <LayoutDashboard size={24} color={activeTab === 'dashboard' ? '#007AFF' : '#8E8E93'} />
          <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.tabLabelActive]}>概覽</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('list')} style={styles.tabItem}>
          <ListTodo size={24} color={activeTab === 'list' ? '#007AFF' : '#8E8E93'} />
          <Text style={[styles.tabLabel, activeTab === 'list' && styles.tabLabelActive]}>清單</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('gantt')} style={styles.tabItem}>
          <BarChart3 size={24} color={activeTab === 'gantt' ? '#007AFF' : '#8E8E93'} />
          <Text style={[styles.tabLabel, activeTab === 'gantt' && styles.tabLabelActive]}>甘特圖</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('ai')} style={styles.tabItem}>
          <Sparkles size={24} color={activeTab === 'ai' ? '#007AFF' : '#8E8E93'} />
          <Text style={[styles.tabLabel, activeTab === 'ai' && styles.tabLabelActive]}>AI</Text>
        </TouchableOpacity>
      </View>

      {/* Task Modal */}
      {selectedTask && (
        <Modal transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedTask.name}</Text>
                <TouchableOpacity onPress={() => setSelectedTask(null)} style={styles.modalClose}>
                  <X size={20} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                 <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>進度</Text>
                    <Text style={styles.modalValueLarge}>{selectedTask.progress}%</Text>
                 </View>
                 <View style={styles.modalInfoGrid}>
                    <View style={styles.modalInfoItem}>
                      <Text style={styles.modalLabel}>工期</Text>
                      <Text style={styles.modalValue}>{selectedTask.duration} 天</Text>
                    </View>
                    <View style={styles.modalInfoItem}>
                      <Text style={styles.modalLabel}>負責人</Text>
                      <Text style={styles.modalValue}>{selectedTask.manager}</Text>
                    </View>
                 </View>
              </ScrollView>
              <TouchableOpacity style={styles.primaryButton} onPress={() => setSelectedTask(null)}>
                <Text style={styles.primaryButtonText}>關閉</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { 
    paddingHorizontal: 20, 
    paddingTop: 40, 
    paddingBottom: 15, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA'
  },
  headerTitle: { fontSize: 32, fontWeight: '700', color: '#000' },
  headerSub: { fontSize: 14, color: '#8E8E93', fontWeight: '500' },
  addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  content: { flex: 1, padding: 16 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 10 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  progressText: { fontSize: 24, fontWeight: '800', color: '#007AFF' },
  progressBarBg: { height: 8, backgroundColor: '#E5E5EA', borderRadius: 4, marginVertical: 15 },
  progressBarFill: { height: 8, backgroundColor: '#007AFF', borderRadius: 4 },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statBox: { flex: 1, borderRadius: 12, padding: 12 },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#1C1C1E' },
  aiButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#5856D6', borderRadius: 20, padding: 20, shadowColor: '#5856D6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  aiButtonText: { color: '#FFF', fontWeight: '700', fontSize: 17 },
  aiButtonSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  tabBar: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.9)', borderTopWidth: 1, borderTopColor: '#E5E5EA', paddingBottom: 30, paddingTop: 10 },
  tabItem: { flex: 1, alignItems: 'center' },
  tabLabel: { fontSize: 10, color: '#8E8E93', marginTop: 4 },
  tabLabelActive: { color: '#007AFF' },
  taskItem: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#007AFF' },
  taskCategory: { fontSize: 10, color: '#007AFF', fontWeight: '800', textTransform: 'uppercase' },
  taskName: { fontSize: 17, fontWeight: '700', color: '#1C1C1E', marginTop: 2 },
  taskProgressPercent: { fontSize: 17, fontWeight: '800', color: '#31C48D' },
  miniProgressBar: { height: 4, backgroundColor: '#F2F2F7', borderRadius: 2, marginVertical: 10 },
  miniProgressBarFill: { height: 4, borderRadius: 2 },
  taskFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  taskFooterText: { fontSize: 12, color: '#9CA3AF' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, minHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: '800' },
  modalClose: { padding: 8, backgroundColor: '#F2F2F7', borderRadius: 20 },
  modalLabel: { fontSize: 12, fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase' },
  modalValueLarge: { fontSize: 40, fontWeight: '900', color: '#007AFF' },
  modalInfoGrid: { flexDirection: 'row', gap: 16, marginTop: 20 },
  modalInfoItem: { flex: 1, backgroundColor: '#F2F2F7', borderRadius: 16, padding: 16 },
  modalValue: { fontSize: 17, fontWeight: '700', marginTop: 4 },
  primaryButton: { backgroundColor: '#007AFF', borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 20 },
  primaryButtonText: { color: '#FFF', fontWeight: '700', fontSize: 17 },
  ganttContainer: { flex: 1, backgroundColor: '#FFF', borderRadius: 20 },
  ganttHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F2F2F7', paddingBottom: 8, marginBottom: 12 },
  ganttTitleLabel: { width: 120, fontSize: 12, color: '#8E8E93', fontWeight: '700' },
  ganttTimeline: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  ganttDateText: { fontSize: 10, color: '#8E8E93' },
  ganttRow: { flexDirection: 'row', height: 40, alignItems: 'center', marginBottom: 16 },
  ganttRowLabel: { width: 120, fontSize: 12, fontWeight: '600', color: '#1C1C1E' },
  ganttBarTrack: { flex: 1, height: '100%', backgroundColor: '#F2F2F7', borderRadius: 8, position: 'relative' },
  ganttBar: { position: 'absolute', top: 4, bottom: 4, borderRadius: 6, overflow: 'hidden' },
  ganttProgress: { height: '100%', backgroundColor: 'rgba(255,255,255,0.3)' },
  aiEmptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 },
  aiIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  aiEmptyTitle: { fontSize: 22, fontWeight: '800', color: '#1C1C1E' },
  aiEmptyDesc: { fontSize: 14, color: '#8E8E93', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  aiResultCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 20 },
  aiResultTitle: { fontSize: 18, fontWeight: '700', color: '#4F46E5', marginBottom: 12 },
  aiResultBody: { fontSize: 15, color: '#374151', lineHeight: 24 }
});

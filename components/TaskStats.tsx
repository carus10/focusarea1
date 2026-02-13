import React, { useMemo } from 'react';
import { Task, TaskCategory, TaskPriority } from '../types';
import { calculateTaskStatistics } from '../utils/taskStats';
import Icon from './Icon';

interface TaskStatsProps {
  tasks: Task[];
  categories: TaskCategory[];
}

const TaskStats: React.FC<TaskStatsProps> = ({ tasks, categories }) => {
  const stats = useMemo(() => calculateTaskStatistics(tasks, categories), [tasks, categories]);

  const priorityColors: Record<TaskPriority, string> = {
    urgent: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-gray-500',
  };

  const priorityLabels: Record<TaskPriority, string> = {
    urgent: 'Acil',
    high: 'Yüksek',
    medium: 'Orta',
    low: 'Düşük',
  };

  const getCategoryColor = (categoryName: string): string => {
    if (categoryName === 'Kategorisiz') return '#6b7280';
    const category = categories.find(c => c.name === categoryName);
    return category?.color || '#6b7280';
  };

  const maxPriorityCount = Math.max(...Object.values(stats.priorityDistribution), 1);
  const maxCategoryCount = Math.max(...Object.values(stats.categoryDistribution), 1);

  return (
    <div className="space-y-2">
      {/* Summary Row */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-blue-500/10 p-2 rounded-lg border border-blue-500/20 text-center">
          <p className="text-lg font-bold text-blue-400">{stats.total}</p>
          <p className="text-[10px] text-gray-400">Toplam</p>
        </div>
        <div className="bg-green-500/10 p-2 rounded-lg border border-green-500/20 text-center">
          <p className="text-lg font-bold text-green-400">{stats.completed}</p>
          <p className="text-[10px] text-gray-400">Tamamlanan</p>
        </div>
        <div className="bg-orange-500/10 p-2 rounded-lg border border-orange-500/20 text-center">
          <p className="text-lg font-bold text-orange-400">{stats.active}</p>
          <p className="text-[10px] text-gray-400">Aktif</p>
        </div>
        <div className="bg-purple-500/10 p-2 rounded-lg border border-purple-500/20 text-center">
          <p className="text-lg font-bold text-purple-400">{stats.completionRate}%</p>
          <p className="text-[10px] text-gray-400">Oran</p>
        </div>
      </div>

      {/* Due Date Stats */}
      {(stats.overdueTasks > 0 || stats.dueTodayTasks > 0 || stats.dueTomorrowTasks > 0) && (
        <div className="flex gap-2">
          {stats.overdueTasks > 0 && (
            <div className="flex-1 text-center p-1.5 bg-red-500/10 rounded-lg border border-red-500/20">
              <p className="text-sm font-bold text-red-400">{stats.overdueTasks}</p>
              <p className="text-[10px] text-gray-400">Gecikmiş</p>
            </div>
          )}
          {stats.dueTodayTasks > 0 && (
            <div className="flex-1 text-center p-1.5 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <p className="text-sm font-bold text-yellow-400">{stats.dueTodayTasks}</p>
              <p className="text-[10px] text-gray-400">Bugün</p>
            </div>
          )}
          {stats.dueTomorrowTasks > 0 && (
            <div className="flex-1 text-center p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <p className="text-sm font-bold text-blue-400">{stats.dueTomorrowTasks}</p>
              <p className="text-[10px] text-gray-400">Yarın</p>
            </div>
          )}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-2">
        {/* Priority Distribution */}
        <div className="bg-white/5 p-2 rounded-lg border border-white/10">
          <h3 className="text-xs font-semibold mb-2">Öncelik Dağılımı</h3>
          <div className="space-y-1.5">
            {(Object.entries(stats.priorityDistribution) as [TaskPriority, number][]).map(([priority, count]) => (
              <div key={priority}>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[10px] text-gray-400">{priorityLabels[priority]}</span>
                  <span className="text-[10px] font-bold text-gray-300">{count}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full ${priorityColors[priority]} transition-all duration-500`}
                    style={{ width: `${(count / maxPriorityCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white/5 p-2 rounded-lg border border-white/10">
          <h3 className="text-xs font-semibold mb-2">Kategori Dağılımı</h3>
          <div className="space-y-1.5">
            {Object.entries(stats.categoryDistribution)
              .filter(([_, count]) => count > 0)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([categoryName, count]) => (
                <div key={categoryName}>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[10px] text-gray-400 truncate">{categoryName}</span>
                    <span className="text-[10px] font-bold text-gray-300">{count}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${(count / maxCategoryCount) * 100}%`,
                        backgroundColor: getCategoryColor(categoryName)
                      }}
                    />
                  </div>
                </div>
              ))}
            {Object.values(stats.categoryDistribution).every(count => count === 0) && (
              <p className="text-center text-xs text-gray-400 py-2">Henüz kategorili görev yok</p>
            )}
          </div>
        </div>
      </div>

      {/* Average Completion Time */}
      {stats.averageCompletionTime !== null && (
        <div className="bg-white/5 p-2 rounded-lg border border-white/10 flex items-center justify-between">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Icon name="Target" className="w-3.5 h-3.5 text-primary" />
            Ort. Tamamlanma Süresi
          </span>
          <span className="text-sm font-bold text-primary">{stats.averageCompletionTime} gün</span>
        </div>
      )}
    </div>
  );
};

export default React.memo(TaskStats);

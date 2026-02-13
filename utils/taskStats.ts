import { Task, TaskPriority, TaskCategory } from '../types';

/**
 * Görev istatistikleri için interface
 */
export interface TaskStatistics {
  total: number;
  completed: number;
  active: number;
  completionRate: number;
  priorityDistribution: Record<TaskPriority, number>;
  categoryDistribution: Record<string, number>;
  averageCompletionTime: number | null; // in days
  overdueTasks: number;
  dueTodayTasks: number;
  dueTomorrowTasks: number;
}

/**
 * Toplam görev sayısını hesaplar
 */
export function getTotalTaskCount(tasks: Task[]): number {
  return tasks.length;
}

/**
 * Tamamlanan görev sayısını hesaplar
 */
export function getCompletedTaskCount(tasks: Task[]): number {
  return tasks.filter(task => task.completed).length;
}

/**
 * Aktif (tamamlanmamış) görev sayısını hesaplar
 */
export function getActiveTaskCount(tasks: Task[]): number {
  return tasks.filter(task => !task.completed).length;
}

/**
 * Tamamlanma oranını hesaplar (0-100 arası yüzde)
 */
export function getCompletionRate(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  const completed = getCompletedTaskCount(tasks);
  return Math.round((completed / tasks.length) * 100);
}

/**
 * Öncelik dağılımını hesaplar
 */
export function getPriorityDistribution(tasks: Task[]): Record<TaskPriority, number> {
  const distribution: Record<TaskPriority, number> = {
    urgent: 0,
    high: 0,
    medium: 0,
    low: 0
  };

  tasks.forEach(task => {
    if (!task.completed) {
      distribution[task.priority]++;
    }
  });

  return distribution;
}

/**
 * Kategori dağılımını hesaplar
 * @param tasks - Görev listesi
 * @param categories - Kategori listesi
 * @returns Kategori ID'sine göre görev sayısı
 */
export function getCategoryDistribution(
  tasks: Task[], 
  categories: TaskCategory[]
): Record<string, number> {
  const distribution: Record<string, number> = {};
  
  // Initialize with category names
  categories.forEach(cat => {
    distribution[cat.name] = 0;
  });
  
  // Add "Kategorisiz" for tasks without category
  distribution['Kategorisiz'] = 0;

  tasks.forEach(task => {
    if (!task.completed) {
      if (task.category) {
        const category = categories.find(c => c.id === task.category);
        if (category) {
          distribution[category.name]++;
        }
      } else {
        distribution['Kategorisiz']++;
      }
    }
  });

  return distribution;
}

/**
 * Ortalama tamamlanma süresini hesaplar (gün cinsinden)
 * Sadece dueDate'i olan ve tamamlanan görevler için hesaplanır
 */
export function getAverageCompletionTime(tasks: Task[]): number | null {
  const completedTasksWithDueDate = tasks.filter(
    task => task.completed && task.dueDate && task.completedAt
  );

  if (completedTasksWithDueDate.length === 0) return null;

  const totalDays = completedTasksWithDueDate.reduce((sum, task) => {
    const createdAt = parseInt(task.id); // Task ID is timestamp
    const completedAt = task.completedAt!;
    const days = (completedAt - createdAt) / (1000 * 60 * 60 * 24);
    return sum + days;
  }, 0);

  return Math.round(totalDays / completedTasksWithDueDate.length);
}

/**
 * Süresi geçmiş görev sayısını hesaplar
 */
export function getOverdueTaskCount(tasks: Task[]): number {
  const now = Date.now();
  return tasks.filter(
    task => !task.completed && task.dueDate && task.dueDate < now
  ).length;
}

/**
 * Bugün bitiş tarihi olan görev sayısını hesaplar
 */
export function getDueTodayTaskCount(tasks: Task[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return tasks.filter(task => {
    if (task.completed || !task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate >= today && dueDate < tomorrow;
  }).length;
}

/**
 * Yarın bitiş tarihi olan görev sayısını hesaplar
 */
export function getDueTomorrowTaskCount(tasks: Task[]): number {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

  return tasks.filter(task => {
    if (task.completed || !task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate >= tomorrow && dueDate < dayAfterTomorrow;
  }).length;
}

/**
 * Tüm görev istatistiklerini hesaplar
 */
export function calculateTaskStatistics(
  tasks: Task[], 
  categories: TaskCategory[]
): TaskStatistics {
  return {
    total: getTotalTaskCount(tasks),
    completed: getCompletedTaskCount(tasks),
    active: getActiveTaskCount(tasks),
    completionRate: getCompletionRate(tasks),
    priorityDistribution: getPriorityDistribution(tasks),
    categoryDistribution: getCategoryDistribution(tasks, categories),
    averageCompletionTime: getAverageCompletionTime(tasks),
    overdueTasks: getOverdueTaskCount(tasks),
    dueTodayTasks: getDueTodayTaskCount(tasks),
    dueTomorrowTasks: getDueTomorrowTaskCount(tasks),
  };
}

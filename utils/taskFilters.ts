import { Task, TaskPriority } from '../types';

export type SortOption = 'priority' | 'dueDate' | 'alphabetical' | 'createdDate';

/**
 * Görev listesinde metin araması yapar
 * @param tasks - Aranacak görev listesi
 * @param query - Arama sorgusu
 * @returns Filtrelenmiş görev listesi
 */
export function searchTasks(tasks: Task[], query: string): Task[] {
  if (!query.trim()) return tasks;
  
  const lowerQuery = query.toLowerCase();
  return tasks.filter(task => 
    task.text.toLowerCase().includes(lowerQuery) ||
    task.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Görevleri önceliğe göre filtreler
 * @param tasks - Filtrelenecek görev listesi
 * @param priorities - Seçili öncelikler
 * @returns Filtrelenmiş görev listesi
 */
export function filterByPriority(tasks: Task[], priorities: TaskPriority[]): Task[] {
  if (priorities.length === 0) return tasks;
  return tasks.filter(task => priorities.includes(task.priority));
}

/**
 * Görevleri kategoriye göre filtreler
 * @param tasks - Filtrelenecek görev listesi
 * @param categoryIds - Seçili kategori ID'leri
 * @returns Filtrelenmiş görev listesi
 */
export function filterByCategory(tasks: Task[], categoryIds: string[]): Task[] {
  if (categoryIds.length === 0) return tasks;
  return tasks.filter(task => task.category && categoryIds.includes(task.category));
}

/**
 * Görevleri etiketlere göre filtreler
 * @param tasks - Filtrelenecek görev listesi
 * @param tags - Seçili etiketler
 * @returns Filtrelenmiş görev listesi
 */
export function filterByTags(tasks: Task[], tags: string[]): Task[] {
  if (tags.length === 0) return tasks;
  return tasks.filter(task => 
    tags.some(tag => task.tags.includes(tag))
  );
}

/**
 * Görevleri duruma göre filtreler
 * @param tasks - Filtrelenecek görev listesi
 * @param status - 'all' | 'active' | 'completed'
 * @returns Filtrelenmiş görev listesi
 */
export function filterByStatus(tasks: Task[], status: 'all' | 'active' | 'completed'): Task[] {
  if (status === 'all') return tasks;
  if (status === 'active') return tasks.filter(task => !task.completed);
  return tasks.filter(task => task.completed);
}

/**
 * Görevleri sıralar
 * @param tasks - Sıralanacak görev listesi
 * @param sortBy - Sıralama kriteri
 * @returns Sıralanmış görev listesi
 */
export function sortTasks(tasks: Task[], sortBy: SortOption): Task[] {
  const sorted = [...tasks];
  
  switch (sortBy) {
    case 'priority':
      const priorityOrder: Record<TaskPriority, number> = {
        urgent: 0,
        high: 1,
        medium: 2,
        low: 3
      };
      return sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    case 'dueDate':
      return sorted.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate - b.dueDate;
      });
    
    case 'alphabetical':
      return sorted.sort((a, b) => a.text.localeCompare(b.text, 'tr-TR'));
    
    case 'createdDate':
      return sorted.sort((a, b) => {
        const aTime = parseInt(a.id);
        const bTime = parseInt(b.id);
        return bTime - aTime; // En yeni önce
      });
    
    default:
      return sorted;
  }
}

/**
 * Tüm filtreleri uygular
 * @param tasks - Filtrelenecek görev listesi
 * @param filters - Filtre seçenekleri
 * @returns Filtrelenmiş ve sıralanmış görev listesi
 */
export function applyAllFilters(
  tasks: Task[],
  filters: {
    searchQuery?: string;
    priorities?: TaskPriority[];
    categoryIds?: string[];
    tags?: string[];
    status?: 'all' | 'active' | 'completed';
    sortBy?: SortOption;
  }
): Task[] {
  let filtered = tasks;
  
  if (filters.searchQuery) {
    filtered = searchTasks(filtered, filters.searchQuery);
  }
  
  if (filters.priorities && filters.priorities.length > 0) {
    filtered = filterByPriority(filtered, filters.priorities);
  }
  
  if (filters.categoryIds && filters.categoryIds.length > 0) {
    filtered = filterByCategory(filtered, filters.categoryIds);
  }
  
  if (filters.tags && filters.tags.length > 0) {
    filtered = filterByTags(filtered, filters.tags);
  }
  
  if (filters.status) {
    filtered = filterByStatus(filtered, filters.status);
  }
  
  if (filters.sortBy) {
    filtered = sortTasks(filtered, filters.sortBy);
  }
  
  return filtered;
}

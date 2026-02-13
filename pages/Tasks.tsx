import React, { useState, useContext, useMemo, Suspense, lazy } from 'react';
import { DataContext } from '../context/DataContext.tsx';
import { Task, TaskPriority } from '../types.ts';
import Icon from '../components/Icon.tsx';
import { applyAllFilters, SortOption } from '../utils/taskFilters.ts';

// Lazy load heavy stats component
const TaskStats = lazy(() => import('../components/TaskStats.tsx'));

const Tasks: React.FC = () => {
  const { 
    tasks, 
    addTask, 
    updateTask, 
    toggleTask, 
    deleteTask, 
    clearCompletedTasks,
    taskCategories,
    addTaskCategory,
    deleteTaskCategory
  } = useContext(DataContext);

  // Add/Edit Task Form State
  const [newTaskText, setNewTaskText] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority>('medium');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [dueDate, setDueDate] = useState<string>('');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState<string>('');
  
  // Edit Mode State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  
  // Category Management Modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6');

  // Statistics Section
  const [showStats, setShowStats] = useState(false);

  // Filter and Search State (Task 27)
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriorities, setFilterPriorities] = useState<TaskPriority[]>([]);
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('createdDate');
  const [showFilters, setShowFilters] = useState(false);

  const priorityColors: Record<TaskPriority, string> = {
    urgent: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
    low: 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30',
  };

  const priorityLabels: Record<TaskPriority, string> = {
    urgent: 'Acil',
    high: 'Yüksek',
    medium: 'Orta',
    low: 'Düşük',
  };

  const sortLabels: Record<SortOption, string> = {
    priority: 'Öncelik',
    dueDate: 'Bitiş Tarihi',
    alphabetical: 'Alfabetik',
    createdDate: 'Oluşturma Tarihi'
  };


  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      if (editingTaskId) {
        updateTask(editingTaskId, {
          text: newTaskText.trim(),
          priority: selectedPriority,
          category: selectedCategory,
          tags: selectedTags,
          dueDate: dueDate ? new Date(dueDate).getTime() : null,
          estimatedPomodoros: estimatedPomodoros ? parseInt(estimatedPomodoros) : null,
        });
        setEditingTaskId(null);
      } else {
        addTask(newTaskText.trim());
        setTimeout(() => {
          const newTask = tasks.find(t => t.text === newTaskText.trim() && !t.completed);
          if (newTask) {
            updateTask(newTask.id, {
              priority: selectedPriority,
              category: selectedCategory,
              tags: selectedTags,
              dueDate: dueDate ? new Date(dueDate).getTime() : null,
              estimatedPomodoros: estimatedPomodoros ? parseInt(estimatedPomodoros) : null,
            });
          }
        }, 100);
      }
      
      setNewTaskText('');
      setSelectedPriority('medium');
      setSelectedCategory(null);
      setSelectedTags([]);
      setTagInput('');
      setDueDate('');
      setEstimatedPomodoros('');
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setNewTaskText(task.text);
    setSelectedPriority(task.priority);
    setSelectedCategory(task.category);
    setSelectedTags(task.tags);
    setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    setEstimatedPomodoros(task.estimatedPomodoros ? String(task.estimatedPomodoros) : '');
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setNewTaskText('');
    setSelectedPriority('medium');
    setSelectedCategory(null);
    setSelectedTags([]);
    setTagInput('');
    setDueDate('');
    setEstimatedPomodoros('');
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !selectedTags.includes(tagInput.trim())) {
      setSelectedTags([...selectedTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      addTaskCategory(newCategoryName.trim(), newCategoryColor);
      setNewCategoryName('');
      setNewCategoryColor('#3b82f6');
    }
  };

  const togglePriorityFilter = (priority: TaskPriority) => {
    setFilterPriorities(prev => 
      prev.includes(priority) ? prev.filter(p => p !== priority) : [...prev, priority]
    );
  };

  const toggleCategoryFilter = (categoryId: string) => {
    setFilterCategories(prev => 
      prev.includes(categoryId) ? prev.filter(c => c !== categoryId) : [...prev, categoryId]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterPriorities([]);
    setFilterCategories([]);
    setFilterTags([]);
    setFilterStatus('all');
    setSortBy('createdDate');
  };

  // Get all unique tags from tasks
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach(task => task.tags.forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [tasks]);

  // Apply filters
  const filteredTasks = useMemo(() => {
    return applyAllFilters(tasks, {
      searchQuery,
      priorities: filterPriorities,
      categoryIds: filterCategories,
      tags: filterTags,
      status: filterStatus,
      sortBy
    });
  }, [tasks, searchQuery, filterPriorities, filterCategories, filterTags, filterStatus, sortBy]);

  const activeTasks = useMemo(() => filteredTasks.filter(t => !t.completed), [filteredTasks]);
  
  const completedTasks = useMemo(() => 
    filteredTasks.filter(t => t.completed).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0)), 
    [filteredTasks]
  );

  const groupedCompletedTasks = useMemo(() => {
    return completedTasks.reduce((acc, task) => {
      if (!task.completedAt) return acc;
      const date = new Date(task.completedAt).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(task);
      return acc;
    }, {} as Record<string, Task[]>);
  }, [completedTasks]);

  const getCategoryById = (categoryId: string | null) => {
    if (!categoryId) return null;
    return taskCategories.find(c => c.id === categoryId);
  };

  const formatDueDate = (timestamp: number | null) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Bugün';
    if (date.toDateString() === tomorrow.toDateString()) return 'Yarın';
    
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const isOverdue = (timestamp: number | null) => {
    if (!timestamp) return false;
    return timestamp < Date.now();
  };

  const activeFilterCount = filterPriorities.length + filterCategories.length + filterTags.length + (filterStatus !== 'all' ? 1 : 0);


  return (
    <div className="h-full flex flex-col gap-1.5">
      {/* Header Row */}
      <div className="flex items-center gap-1.5">
        <h1 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-400 shrink-0">
          Görevler
        </h1>
        <div className="relative shrink-0">
          <Icon name="Search" className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ara..."
            className="w-[120px] pl-7 pr-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-gray-100 placeholder-gray-500 focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`shrink-0 px-2 py-1 rounded text-xs font-medium inline-flex items-center gap-1 ${
            showFilters || activeFilterCount > 0
              ? 'bg-primary text-white'
              : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
          }`}
        >
          <Icon name="Filter" className="w-3 h-3" />
          Filtrele
          {activeFilterCount > 0 && (
            <span className="ml-0.5 px-1 bg-white/20 rounded-full text-[10px] font-bold">{activeFilterCount}</span>
          )}
        </button>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="shrink-0 px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-gray-200 focus:ring-1 focus:ring-primary cursor-pointer"
        >
          {Object.entries(sortLabels).map(([value, label]) => (
            <option key={value} value={value} className="bg-gray-800 text-gray-100">{label}</option>
          ))}
        </select>
        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          <button
            onClick={() => setShowStats(!showStats)}
            className={`px-2 py-1 rounded text-xs font-medium inline-flex items-center gap-1 ${
              showStats
                ? 'bg-primary text-white'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
            }`}
          >
            <Icon name="BarChart" className="w-3 h-3" />
            İstatistikler
          </button>
          <button
            onClick={() => setShowCategoryModal(true)}
            className="px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded text-xs font-medium inline-flex items-center gap-1"
          >
            <Icon name="Settings" className="w-3 h-3" />
            Kategoriler
          </button>
        </div>
      </div>

      {/* Statistics Section */}
      {showStats && (
        <Suspense fallback={<div className="h-32 bg-white/5 rounded-lg animate-pulse" />}>
          <TaskStats tasks={tasks} categories={taskCategories} />
        </Suspense>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white/5 backdrop-blur-xl p-2.5 rounded-lg border border-white/10 space-y-2">
            <div>
              <label className="text-[10px] font-semibold text-gray-400 mb-1 block uppercase tracking-wider">Öncelik</label>
              <div className="flex flex-wrap gap-1">
                {(['urgent', 'high', 'medium', 'low'] as TaskPriority[]).map(priority => (
                  <button
                    key={priority}
                    onClick={() => togglePriorityFilter(priority)}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                      filterPriorities.includes(priority)
                        ? `${priorityColors[priority]} border`
                        : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-transparent'
                    }`}
                  >
                    {priorityLabels[priority]}
                  </button>
                ))}
              </div>
            </div>

            {taskCategories.length > 0 && (
              <div>
                <label className="text-[10px] font-semibold text-gray-400 mb-1 block uppercase tracking-wider">Kategori</label>
                <div className="flex flex-wrap gap-1">
                  {taskCategories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategoryFilter(cat.id)}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-all border ${
                        filterCategories.includes(cat.id)
                          ? 'text-white border-white/30'
                          : 'bg-white/5 hover:bg-white/10 text-gray-300 border-transparent'
                      }`}
                      style={filterCategories.includes(cat.id) ? { backgroundColor: cat.color } : {}}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] font-semibold text-gray-400 mb-1 block uppercase tracking-wider">Durum</label>
              <div className="flex gap-1">
                {[
                  { value: 'all', label: 'Tümü' },
                  { value: 'active', label: 'Aktif' },
                  { value: 'completed', label: 'Tamamlanan' }
                ].map(status => (
                  <button
                    key={status.value}
                    onClick={() => setFilterStatus(status.value as any)}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                      filterStatus === status.value
                        ? 'bg-primary text-white'
                        : 'bg-white/5 hover:bg-white/10 text-gray-300'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="pt-1">
                <button
                  onClick={clearAllFilters}
                  className="text-[11px] text-red-400 hover:text-red-300 font-medium flex items-center gap-1"
                >
                  <Icon name="X" className="w-3 h-3" />
                  Tüm Filtreleri Temizle
                </button>
              </div>
            )}
        </div>
      )}

      {/* Add/Edit Task Form */}
      <div className="bg-white/5 p-2 rounded-lg border border-white/10">
        <form onSubmit={handleAddTask} className="space-y-1.5">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Yeni bir görev ekle..."
            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-gray-100 placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary"
          />

          <div className="flex gap-1.5 flex-wrap">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value as TaskPriority)}
              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-gray-200 focus:ring-1 focus:ring-primary cursor-pointer flex-1 min-w-[80px]"
            >
              <option value="low" className="bg-gray-800 text-gray-100">Düşük</option>
              <option value="medium" className="bg-gray-800 text-gray-100">Orta</option>
              <option value="high" className="bg-gray-800 text-gray-100">Yüksek</option>
              <option value="urgent" className="bg-gray-800 text-gray-100">Acil</option>
            </select>

            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-gray-200 focus:ring-1 focus:ring-primary cursor-pointer flex-1 min-w-[80px]"
            >
              <option value="" className="bg-gray-800 text-gray-100">Kategori</option>
              {taskCategories.map(cat => (
                <option key={cat.id} value={cat.id} className="bg-gray-800 text-gray-100">{cat.name}</option>
              ))}
            </select>

            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-gray-200 focus:ring-1 focus:ring-primary cursor-pointer flex-1 min-w-[90px]"
            />

            <input
              type="number"
              min="1"
              value={estimatedPomodoros}
              onChange={(e) => setEstimatedPomodoros(e.target.value)}
              placeholder="🍅"
              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-gray-200 placeholder-gray-400 focus:ring-1 focus:ring-primary w-[60px]"
            />
          </div>

          <div className="flex gap-1.5">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="Etiket (Enter)"
              className="flex-grow bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-gray-200 placeholder-gray-400 focus:ring-1 focus:ring-primary"
            />
            <button type="button" onClick={handleAddTag} className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded">
              <Icon name="Plus" className="w-3 h-3 text-gray-300" />
            </button>
          </div>

          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedTags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs">
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:bg-primary/20 rounded-full">
                    <Icon name="X" className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-1.5">
            <button 
              type="submit" 
              className="flex-grow bg-primary text-white py-1 rounded hover:bg-primary-hover font-semibold text-xs flex items-center justify-center gap-1"
            >
              <Icon name={editingTaskId ? "Check" : "Plus"} className="w-3 h-3" />
              {editingTaskId ? 'Güncelle' : 'Ekle'}
            </button>
            {editingTaskId && (
              <button type="button" onClick={handleCancelEdit} className="px-3 bg-white/10 hover:bg-white/15 text-gray-300 py-1 rounded font-semibold text-xs">
                İptal
              </button>
            )}
          </div>
        </form>
      </div>


      {/* Task Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 flex-grow overflow-y-auto min-h-0">
        {/* Active Tasks */}
        <div className="bg-white/5 p-2 rounded-lg border border-white/10 flex flex-col min-h-0">
          <h2 className="text-xs font-semibold mb-1.5 text-gray-200">Aktif Görevler ({activeTasks.length})</h2>
          <ul className="space-y-2 overflow-y-auto flex-grow">
            {activeTasks.length > 0 ? activeTasks.map(task => {
              const category = getCategoryById(task.category);
              const dueDateStr = formatDueDate(task.dueDate);
              const overdue = isOverdue(task.dueDate);
              
              return (
                <li key={task.id} className="p-2 rounded-lg bg-white/5 group hover:bg-white/10 transition-colors">
                  <div className="flex items-start gap-3">
                    <input 
                      type="checkbox" 
                      checked={task.completed} 
                      onChange={() => toggleTask(task.id)} 
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mt-0.5 flex-shrink-0" 
                    />
                    <div className="flex-grow min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-sm font-medium">{task.text}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button
                            onClick={() => handleEditTask(task)}
                            className="p-1 hover:bg-primary/20 rounded-full text-primary"
                          >
                            <Icon name="Edit" className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="p-1 hover:bg-red-500/20 rounded-full text-red-500"
                          >
                            <Icon name="Trash2" className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5 items-center text-xs">
                        <span className={`px-2 py-0.5 rounded-md border ${priorityColors[task.priority]}`}>
                          {priorityLabels[task.priority]}
                        </span>
                        
                        {category && (
                          <span 
                            className="px-2 py-0.5 rounded-md text-white"
                            style={{ backgroundColor: category.color }}
                          >
                            {category.name}
                          </span>
                        )}
                        
                        {dueDateStr && (
                          <span className={`px-2 py-0.5 rounded-md flex items-center gap-1 ${
                            overdue 
                              ? 'bg-red-500/20 text-red-600 dark:text-red-400' 
                              : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                          }`}>
                            <Icon name="Calendar" className="w-3 h-3" />
                            {dueDateStr}
                          </span>
                        )}
                        
                        {task.estimatedPomodoros && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center gap-1">
                            <Icon name="Target" className="w-3 h-3" />
                            {task.estimatedPomodoros}
                          </span>
                        )}
                      </div>
                      
                      {task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {task.tags.map(tag => (
                            <span key={tag} className="px-1.5 py-0.5 bg-gray-500/10 dark:bg-white/5 rounded text-xs text-gray-600 dark:text-gray-400">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            }) : (
              <p className="text-center text-sm text-gray-400 py-4">
                {searchQuery || activeFilterCount > 0 ? 'Filtrelerinize uygun görev bulunamadı.' : 'Harika! Hiç aktif görevin yok.'}
              </p>
            )}
          </ul>
        </div>

        {/* Completed Tasks */}
        <div className="bg-white/5 p-2 rounded-lg border border-white/10 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-1.5">
            <h2 className="text-xs font-semibold text-gray-200">Tamamlanan ({completedTasks.length})</h2>
            {completedTasks.length > 0 && (
              <button 
                onClick={clearCompletedTasks} 
                className="text-[11px] font-medium text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <Icon name="Trash2" className="w-3 h-3" />
                Geçmişi Temizle
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-grow">
            {Object.keys(groupedCompletedTasks).length > 0 ? Object.entries(groupedCompletedTasks).map(([date, tasksInGroup]) => (
              <div key={date} className="mb-4">
                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{date}</h3>
                <ul className="space-y-2">
                  {tasksInGroup.map(task => {
                    const category = getCategoryById(task.category);
                    
                    return (
                      <li key={task.id} className="p-2 rounded-md bg-gray-500/5 dark:bg-white/5 group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-grow min-w-0">
                            <input 
                              type="checkbox" 
                              checked={task.completed} 
                              onChange={() => toggleTask(task.id)} 
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary flex-shrink-0" 
                            />
                            <div className="min-w-0 flex-grow">
                              <span className="text-sm line-through text-gray-500 dark:text-gray-400 block truncate">
                                {task.text}
                              </span>
                              {category && (
                                <span 
                                  className="inline-block px-1.5 py-0.5 rounded text-xs text-white mt-1"
                                  style={{ backgroundColor: category.color }}
                                >
                                  {category.name}
                                </span>
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={() => deleteTask(task.id)} 
                            className="p-1 hover:bg-red-500/20 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          >
                            <Icon name="Trash2" className="w-4 h-4" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )) : (
              <p className="text-center text-sm text-gray-400 py-4">
                {searchQuery || activeFilterCount > 0 ? 'Filtrelerinize uygun tamamlanmış görev bulunamadı.' : 'Henüz hiç görev tamamlamadın.'}
              </p>
            )}
          </div>
        </div>
      </div>


      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl shadow-2xl max-w-sm w-full p-4 border border-white/10">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-bold text-gray-100">Kategori Yönetimi</h2>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="p-1 hover:bg-white/10 rounded-full text-gray-400"
              >
                <Icon name="X" className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-3 p-2.5 bg-white/5 rounded-lg">
              <h3 className="text-xs font-semibold mb-2 text-gray-300">Yeni Kategori Ekle</h3>
              <div className="flex gap-1.5 mb-1.5">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Kategori adı"
                  className="flex-grow bg-white/5 border border-white/10 rounded-lg p-1.5 text-xs text-gray-100 placeholder-gray-400"
                />
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="w-9 h-8 rounded-lg cursor-pointer"
                />
              </div>
              <button
                onClick={handleAddCategory}
                className="w-full bg-primary text-white p-1.5 rounded-lg hover:bg-primary-hover text-xs font-semibold"
              >
                Ekle
              </button>
            </div>

            <div>
              <h3 className="text-xs font-semibold mb-2 text-gray-300">Mevcut Kategoriler</h3>
              <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                {taskCategories.map(cat => (
                  <li key={cat.id} className="flex items-center justify-between p-1.5 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-xs text-gray-200">{cat.name}</span>
                    </div>
                    <button
                      onClick={() => deleteTaskCategory(cat.id)}
                      className="p-1 hover:bg-red-500/20 rounded-full text-red-500"
                    >
                      <Icon name="Trash2" className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;

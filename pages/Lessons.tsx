

import React, { useState, useContext, useMemo } from 'react';
import { DataContext } from '../context/DataContext.tsx';
import { Lesson } from '../types.ts';
import Icon from '../components/Icon.tsx';
import Modal from '../components/Modal.tsx';

// --- Child Components ---

interface LessonCardProps {
    lesson: Lesson;
    onUpdate: (id: string, updates: Partial<Lesson>) => void;
    onDelete: (id: string) => void;
}

const LessonCard: React.FC<LessonCardProps> = ({ lesson, onUpdate, onDelete }) => {
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState('');

    const handleOpenNoteModal = () => {
        setEditingNote(lesson.noteContent);
        setIsNoteModalOpen(true);
    };

    const handleSaveNote = () => {
        onUpdate(lesson.id, { noteContent: editingNote });
        setIsNoteModalOpen(false);
    };
    
    return (
        <>
            <div className="bg-light-card/60 dark:bg-dark-card/50 backdrop-blur-2xl rounded-2xl shadow-lg border border-white/20 dark:border-white/10 p-4 flex flex-col justify-between transition-transform transform hover:-translate-y-1">
                <div>
                    <div className="flex items-center mb-2">
                        <Icon name={lesson.type === 'youtube' ? 'Youtube' : 'BookOpen'} className="w-5 h-5 mr-2 text-primary shrink-0" />
                        <h3 className="font-bold text-lg truncate" title={lesson.title}>{lesson.title}</h3>
                    </div>
                    <a href={lesson.url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-primary truncate block">
                        {lesson.url}
                    </a>
                </div>
                <div className="mt-4">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-gray-500">Progress</span>
                        <span className="text-xs font-bold text-primary">{lesson.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-500/10 dark:bg-white/5 rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: `${lesson.progress}%` }}></div>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={lesson.progress}
                        onChange={(e) => onUpdate(lesson.id, { progress: parseInt(e.target.value) })}
                        className="w-full h-1 mt-2 bg-transparent cursor-pointer"
                        aria-label="Lesson progress"
                    />
                </div>
                <div className="flex justify-end items-center space-x-2 mt-2 pt-2 border-t border-white/20 dark:border-white/10">
                    <button
                        onClick={handleOpenNoteModal}
                        className="p-2 text-gray-500 dark:text-gray-300 hover:text-primary hover:bg-primary/20 rounded-full transition-colors"
                        title="Edit Lesson Note"
                    >
                        <Icon name="FileText" className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => onDelete(lesson.id)} 
                        className="p-2 text-gray-500 dark:text-gray-300 hover:text-red-500 hover:bg-red-500/20 rounded-full transition-colors" 
                        title="Delete Lesson"
                    >
                        <Icon name="Trash2" className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <Modal isOpen={isNoteModalOpen} onClose={() => setIsNoteModalOpen(false)} title={`Note for: ${lesson.title}`}>
                <div className="space-y-4">
                    <textarea 
                        value={editingNote}
                        onChange={(e) => setEditingNote(e.target.value)}
                        rows={10}
                        className="w-full bg-gray-500/10 dark:bg-white/5 border-transparent rounded-md p-2 focus:ring-primary focus:border-primary"
                        placeholder="Track your progress, key points, etc."
                    />
                    <div className="flex justify-end">
                        <button onClick={handleSaveNote} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover">Save Note</button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

// --- Main Component ---

const Lessons: React.FC = () => {
    const { lessons, addLesson, updateLesson, deleteLesson } = useContext(DataContext);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newLesson, setNewLesson] = useState<Omit<Lesson, 'id' | 'progress'>>({ type: 'youtube', title: '', url: '', noteContent: '' });
    const [searchTerm, setSearchTerm] = useState('');

    const handleOpenModal = () => {
        setNewLesson({ type: 'youtube', title: '', url: '', noteContent: '' });
        setIsAddModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsAddModalOpen(false);
    };

    const handleAddLesson = () => {
        if (!newLesson.title.trim() || !newLesson.url.trim()) {
            alert("Please fill in the title and URL.");
            return;
        }
        // A simple URL validation
        try {
            new URL(newLesson.url.trim());
        } catch (_) {
            alert("Please enter a valid URL.");
            return;
        }
        
        addLesson({ 
            ...newLesson,
            title: newLesson.title.trim(),
            url: newLesson.url.trim(),
            noteContent: newLesson.noteContent.trim(),
            progress: 0
        });
        handleCloseModal();
    };
    
    const handleInputChange = (field: keyof typeof newLesson, value: string) => {
        setNewLesson(prev => ({ ...prev, [field]: value }));
    };

    const filteredLessons = useMemo(() => {
        if (!searchTerm) return lessons;
        return lessons.filter(lesson => 
            lesson.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [lessons, searchTerm]);

    return (
        <div className="relative h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 shrink-0">
                <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-400 dark:to-violet-300">Lessons & Courses</h1>
                <div className="relative w-full sm:w-auto sm:max-w-xs">
                    <Icon name="Search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search lessons..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-500/10 dark:bg-white/5 border-transparent rounded-lg py-2 pl-9 pr-3 text-sm focus:ring-primary focus:border-primary"
                    />
                </div>
            </div>
            
            {/* Content Area */}
            <div className="flex-grow overflow-y-auto -mr-4 pr-4">
                {lessons.length === 0 ? (
                     <div className="text-center py-16 flex flex-col items-center justify-center h-full text-gray-400">
                        <Icon name="BookOpen" className="w-16 h-16 mx-auto opacity-50" />
                        <p className="mt-4 text-lg font-medium">Your lesson library is empty.</p>
                        <p className="text-sm mt-1">Click the '+' button to start tracking your learning journey.</p>
                    </div>
                ) : filteredLessons.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredLessons.map(lesson => (
                            <LessonCard 
                                key={lesson.id} 
                                lesson={lesson} 
                                onUpdate={updateLesson} 
                                onDelete={deleteLesson} 
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <p className="text-gray-400">No lessons found matching your search.</p>
                    </div>
                )}
            </div>

            {/* Floating Action Button */}
            <button
                onClick={handleOpenModal}
                className="absolute bottom-6 right-6 bg-primary text-white p-4 rounded-full font-semibold hover:bg-primary-hover shadow-lg shadow-primary/40 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg focus:ring-primary"
                aria-label="Add New Lesson"
            >
                <Icon name="Plus" className="w-6 h-6" />
            </button>

            {/* Add Lesson Modal */}
            <Modal isOpen={isAddModalOpen} onClose={handleCloseModal} title="Add New Lesson">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                        <select
                            value={newLesson.type}
                            onChange={(e) => handleInputChange('type', e.target.value as 'youtube' | 'udemy')}
                            className="block w-full bg-gray-500/10 dark:bg-white/5 border-transparent rounded-md shadow-sm p-2"
                        >
                            <option value="youtube">YouTube Playlist</option>
                            <option value="udemy">Udemy Course</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                        <input type="text" value={newLesson.title} onChange={e => handleInputChange('title', e.target.value)} className="block w-full bg-gray-500/10 dark:bg-white/5 border-transparent rounded-md shadow-sm p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL</label>
                        <input type="url" value={newLesson.url} onChange={e => handleInputChange('url', e.target.value)} className="block w-full bg-gray-500/10 dark:bg-white/5 border-transparent rounded-md shadow-sm p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Note <span className="text-gray-400">(Optional & Lesson-Specific)</span>
                        </label>
                        <textarea
                            value={newLesson.noteContent}
                            onChange={e => handleInputChange('noteContent', e.target.value)}
                            rows={3}
                            placeholder="Add a brief note about this lesson..."
                            className="block w-full bg-gray-500/10 dark:bg-white/5 border-transparent rounded-md shadow-sm p-2 text-sm"
                        />
                    </div>
                    <div className="flex justify-end pt-2">
                        <button onClick={handleAddLesson} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover">Add Lesson</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Lessons;
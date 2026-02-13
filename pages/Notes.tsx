import React, { useState, useContext, useEffect, useMemo, useRef } from 'react';
import { DataContext } from '../context/DataContext.tsx';
import { Folder, Note } from '../types.ts';
import Icon from '../components/Icon.tsx';
import Modal from '../components/Modal.tsx';

const timeUnits: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
  { unit: 'year', seconds: 31536000 },
  { unit: 'month', seconds: 2592000 },
  { unit: 'week', seconds: 604800 },
  { unit: 'day', seconds: 86400 },
  { unit: 'hour', seconds: 3600 },
  { unit: 'minute', seconds: 60 },
];

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

const formatTimeAgo = (timestamp: number) => {
  const secondsAgo = Math.round((timestamp - Date.now()) / 1000);

  if (Math.abs(secondsAgo) < 60) return 'Just now';

  for (const { unit, seconds } of timeUnits) {
    const interval = Math.round(secondsAgo / seconds);
    if (Math.abs(interval) >= 1) {
      return rtf.format(interval, unit);
    }
  }
  return new Date(timestamp).toLocaleDateString();
};


const FolderList: React.FC<{
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
}> = ({ selectedFolderId, onSelectFolder }) => {
  const { folders, addFolder, updateFolder, deleteFolder } = useContext(DataContext);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);

  const handleAddFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim());
      setNewFolderName('');
    }
  };
  
  const handleUpdateFolder = () => {
    if (editingFolder && editingFolder.name.trim()) {
        updateFolder(editingFolder.id, editingFolder.name.trim());
        setEditingFolder(null);
    }
  }

  return (
    <div className="h-full p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Folders</h2>
      </div>
      <form onSubmit={handleAddFolder} className="flex mb-4">
        <input
          type="text"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          placeholder="New folder..."
          className="flex-grow bg-gray-500/10 dark:bg-white/5 border-transparent rounded-l-md p-2 text-sm focus:ring-primary focus:border-primary"
        />
        <button type="submit" className="bg-primary text-white p-2 rounded-r-md hover:bg-primary-hover">
          <Icon name="Plus" className="w-4 h-4" />
        </button>
      </form>
      <ul className="space-y-1 overflow-y-auto">
        <li
            onClick={() => onSelectFolder(null)}
            className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${
            !selectedFolderId ? 'bg-primary/20 text-primary' : 'hover:bg-gray-500/10 dark:hover:bg-white/10'
            }`}
        >
            <Icon name="BookOpen" className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">All Notes</span>
        </li>
        {folders.map(folder => (
          <li
            key={folder.id}
            onClick={() => onSelectFolder(folder.id)}
            className={`group flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
              selectedFolderId === folder.id ? 'bg-primary/20 text-primary' : 'hover:bg-gray-500/10 dark:hover:bg-white/10'
            }`}
          >
            <div className="flex items-center truncate">
              <Icon name="Folder" className="w-4 h-4 mr-2" />
              {editingFolder?.id === folder.id ? (
                 <input
                    type="text"
                    value={editingFolder.name}
                    onChange={(e) => setEditingFolder({ ...editingFolder, name: e.target.value })}
                    onBlur={handleUpdateFolder}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateFolder()}
                    autoFocus
                    className="bg-transparent w-full text-sm font-medium outline-none"
                  />
              ) : (
                <span className="text-sm font-medium truncate">{folder.name}</span>
              )}
            </div>
            <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
                 <button onClick={(e) => { e.stopPropagation(); setEditingFolder(folder); }} className="p-1 hover:bg-gray-500/20 dark:hover:bg-white/20 rounded"><Icon name="Edit" className="w-3 h-3" /></button>
                 <button onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }} className="p-1 hover:bg-red-500/20 rounded"><Icon name="Trash2" className="w-3 h-3 text-red-500" /></button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};


const NoteList: React.FC<{
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  onAddNote: () => void;
  onDeleteNote: (id: string) => void;
}> = ({ notes, selectedNoteId, onSelectNote, onAddNote, onDeleteNote }) => (
    <div className="h-full p-4 flex flex-col">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-semibold">Notes</h2>
      <button onClick={onAddNote} className="p-2 text-primary hover:bg-primary/20 rounded-full">
        <Icon name="FilePlus" className="w-5 h-5" />
      </button>
    </div>
    <div className="overflow-y-auto pr-2 flex-grow">
      {notes.length > 0 ? (
        <ul className="space-y-2">
          {notes.map(note => (
            <li
              key={note.id}
              onClick={() => onSelectNote(note.id)}
              className={`group p-3 rounded-lg cursor-pointer transition-all duration-200 relative border-l-4 flex justify-between items-center ${
                selectedNoteId === note.id 
                  ? 'bg-primary/20 border-primary' 
                  : 'border-transparent hover:bg-gray-500/10 dark:hover:bg-white/10'
              }`}
            >
              <div className="flex-grow pr-2 overflow-hidden">
                <h3 className="font-semibold truncate text-gray-800 dark:text-gray-100">{note.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">{note.content.substring(0, 80) || 'No content'}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{formatTimeAgo(note.updatedAt)}</p>
              </div>
              <button 
                  onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNote(note.id);
                  }}
                  className="p-1.5 hover:bg-red-500/20 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2"
                  aria-label="Delete note"
              >
                  <Icon name="Trash2" className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-4">
          <Icon name="FileText" className="w-12 h-12 mx-auto opacity-50" />
          <p className="mt-2 text-sm font-medium">No notes here.</p>
          <p className="text-xs mt-1">Click the <Icon name="FilePlus" className="inline w-3 h-3 mx-1"/> button to create one.</p>
        </div>
      )}
    </div>
  </div>
);

const NoteEditor: React.FC<{
    note: Note | null;
    onDelete: (id: string) => void;
    onBack: () => void;
}> = ({ note, onDelete, onBack }) => {
    const { updateNote, moveNote, folders } = useContext(DataContext);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    
    useEffect(() => {
        if (note) {
            setTitle(note.title);
            setContent(note.content);
        }
    }, [note]);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
        if(note) updateNote(note.id, e.target.value, content);
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        if(note) updateNote(note.id, title, e.target.value);
    };

    const handleMoveNote = (targetFolderId: string | null) => {
        if(note) moveNote(note.id, targetFolderId);
        setIsMoveModalOpen(false);
    };
    
    if (!note) {
        return (
            <div className="h-full p-4 flex flex-col items-center justify-center text-center text-gray-400">
                <Icon name="Eye" className="w-12 h-12 mx-auto opacity-50" />
                <p className="mt-2 text-sm font-medium">Select a note to view or edit</p>
                <p className="text-xs mt-1">Or create a new one in the notes panel.</p>
            </div>
        );
    }

    return (
    <div className="h-full p-4 flex flex-col">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/20 dark:border-white/10">
          <div className="flex items-center flex-grow min-w-0">
            <button onClick={onBack} className="md:hidden p-2 -ml-2 mr-2 text-gray-400 hover:text-primary transition-colors" aria-label="Back to notes list">
                <Icon name="ChevronLeft" className="w-5 h-5" />
            </button>
            <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                placeholder="Note Title"
                className="w-full text-xl font-bold bg-transparent focus:outline-none"
            />
          </div>
          <div className="flex items-center space-x-2 pl-2 shrink-0">
            <button onClick={() => setIsMoveModalOpen(true)} className="p-2 hover:bg-gray-500/10 dark:hover:bg-white/10 rounded-full"><Icon name="Move" className="w-4 h-4" /></button>
            <button onClick={() => onDelete(note.id)} className="p-2 hover:bg-red-500/20 rounded-full"><Icon name="Trash2" className="w-4 h-4 text-red-500" /></button>
          </div>
        </div>
        <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="Start writing..."
            className="flex-grow w-full bg-transparent resize-none focus:outline-none text-gray-700 dark:text-gray-300 leading-relaxed"
        />
        <Modal isOpen={isMoveModalOpen} onClose={() => setIsMoveModalOpen(false)} title="Move Note to...">
            <ul className="space-y-2">
                {folders.map(f => (
                    <li key={f.id} onClick={() => handleMoveNote(f.id)} className="p-2 hover:bg-gray-500/10 dark:hover:bg-white/10 rounded-md cursor-pointer">{f.name}</li>
                ))}
                <li onClick={() => handleMoveNote(null)} className="p-2 hover:bg-gray-500/10 dark:hover:bg-white/10 rounded-md cursor-pointer text-gray-500">_Uncategorized</li>
            </ul>
        </Modal>
    </div>
  );
};

const Notes: React.FC = () => {
  const { notes, addNote, deleteNote: contextDeleteNote } = useContext(DataContext);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'lists' | 'editor'>('lists');
  
  const filteredNotes = useMemo(() => {
    return notes
      .filter(note => selectedFolderId === null || note.folderId === selectedFolderId)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, selectedFolderId]);

  const selectedNote = useMemo(() => {
    return notes.find(note => note.id === selectedNoteId) ?? null;
  }, [notes, selectedNoteId]);

  const handleSelectNote = (id: string) => {
    setSelectedNoteId(id);
    setMobileView('editor');
  };
  
  const handleBackFromEditor = () => {
    setMobileView('lists');
  };

  const handleAddNote = () => {
    const newNote = addNote({
      folderId: selectedFolderId,
      title: 'Untitled Note',
      content: ''
    });
    setSelectedNoteId(newNote.id);
    setMobileView('editor');
  }

  const handleDeleteNote = (id: string) => {
    const isDeletingSelectedNote = selectedNoteId === id;
    const notesInCurrentView = filteredNotes.filter(n => n.id !== id);
    
    contextDeleteNote(id);
    
    if (isDeletingSelectedNote) {
        if (notesInCurrentView.length > 0) {
            setSelectedNoteId(notesInCurrentView[0].id);
        } else {
            setSelectedNoteId(null);
            setMobileView('lists');
        }
    }
  }
  
  useEffect(() => {
    if(filteredNotes.length > 0) {
        if(!filteredNotes.find(n => n.id === selectedNoteId)){
            setSelectedNoteId(filteredNotes[0].id);
        }
    } else {
        setSelectedNoteId(null);
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFolderId, notes]);

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-400 dark:to-violet-300">Notes</h1>
      <div className="flex-grow flex h-[calc(100%-60px)] bg-light-card/60 dark:bg-dark-card/50 backdrop-blur-2xl rounded-2xl shadow-lg border border-white/20 dark:border-white/10 overflow-hidden">
        <div className={`basis-1/2 md:basis-1/4 lg:basis-1/5 border-r border-white/20 dark:border-white/10 ${mobileView === 'editor' ? 'hidden md:flex' : 'flex'}`}>
          <FolderList selectedFolderId={selectedFolderId} onSelectFolder={setSelectedFolderId} />
        </div>
        <div className={`basis-1/2 md:basis-1/4 lg:basis-2/5 border-r border-white/20 dark:border-white/10 ${mobileView === 'editor' ? 'hidden md:block' : 'block'}`}>
          <NoteList notes={filteredNotes} selectedNoteId={selectedNoteId} onSelectNote={handleSelectNote} onAddNote={handleAddNote} onDeleteNote={handleDeleteNote}/>
        </div>
        <div className={`w-full md:w-auto md:basis-1/2 lg:basis-2/5 ${mobileView === 'lists' ? 'hidden' : 'block'} md:block`}>
          <NoteEditor note={selectedNote} onDelete={handleDeleteNote} onBack={handleBackFromEditor} />
        </div>
      </div>
    </div>
  );
};

export default Notes;
import React, { useContext, useState } from 'react';
import { DataContext } from '../context/DataContext.tsx';
import { SavedPlaylist } from '../types.ts';
import Icon from '../components/Icon.tsx';
import Modal from '../components/Modal.tsx';

const MusicPlaylists: React.FC = () => {
    const { savedPlaylists, playPlaylist, updateSavedPlaylist, deleteSavedPlaylist } = useContext(DataContext);
    const [editingPlaylist, setEditingPlaylist] = useState<SavedPlaylist | null>(null);
    const [newName, setNewName] = useState('');

    const handleEditClick = (playlist: SavedPlaylist) => {
        setEditingPlaylist(playlist);
        setNewName(playlist.name);
    };

    const handleSaveEdit = () => {
        if (editingPlaylist && newName.trim()) {
            updateSavedPlaylist(editingPlaylist.id, newName.trim());
            setEditingPlaylist(null);
            setNewName('');
        }
    };

    const handleCloseModal = () => {
        setEditingPlaylist(null);
        setNewName('');
    }

    return (
        <div className="h-full overflow-y-auto -mr-4 pr-4">
            <h1 className="text-2xl sm:text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-400 dark:to-violet-300">My Music</h1>
            
            {savedPlaylists.length === 0 ? (
                 <div className="text-center py-16 bg-light-card/60 dark:bg-dark-card/50 backdrop-blur-2xl rounded-2xl border border-white/20 dark:border-white/10">
                    <Icon name="Music" className="w-16 h-16 mx-auto text-gray-400" />
                    <p className="mt-4 text-gray-400">No saved playlists yet.</p>
                    <p className="text-sm text-gray-500">Go to the Music Player on the Dashboard to save a playlist.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {savedPlaylists.map(playlist => (
                        <div key={playlist.id} className="bg-light-card/60 dark:bg-dark-card/50 backdrop-blur-2xl rounded-2xl shadow-lg border border-white/20 dark:border-white/10 p-4 flex flex-col justify-between transition-transform transform hover:-translate-y-1">
                            <div>
                                <h3 className="font-bold text-lg truncate mb-1">{playlist.name}</h3>
                                <p className="text-xs text-gray-400 truncate" title={playlist.url}>{playlist.url}</p>
                            </div>
                            <div className="flex justify-end items-center space-x-2 mt-4 pt-2 border-t border-white/20 dark:border-white/10">
                                <button
                                    onClick={() => handleEditClick(playlist)}
                                    className="p-2 text-gray-500 dark:text-gray-300 hover:text-primary hover:bg-primary/20 rounded-full transition-colors"
                                    title="Edit Name"
                                >
                                    <Icon name="Edit" className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => deleteSavedPlaylist(playlist.id)} 
                                    className="p-2 text-gray-500 dark:text-gray-300 hover:text-red-500 hover:bg-red-500/20 rounded-full transition-colors" 
                                    title="Delete Playlist"
                                >
                                    <Icon name="Trash2" className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => playPlaylist(playlist)}
                                    className="flex items-center bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-hover shadow-md shadow-primary/40 text-sm"
                                >
                                    <Icon name="Play" className="w-4 h-4 mr-2" />
                                    Play
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={!!editingPlaylist} onClose={handleCloseModal} title="Edit Playlist Name">
                 <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Playlist Name</label>
                        <input 
                            type="text" 
                            value={newName} 
                            onChange={e => setNewName(e.target.value)} 
                            className="mt-1 block w-full bg-gray-500/10 dark:bg-white/5 border-transparent rounded-md shadow-sm p-2" 
                        />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button onClick={handleCloseModal} className="bg-gray-500/20 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-500/30">Cancel</button>
                        <button onClick={handleSaveEdit} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover">Save</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default MusicPlaylists;
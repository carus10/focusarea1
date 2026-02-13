

import React, { useContext, useRef, useState } from 'react';
import { DataContext } from '../context/DataContext.tsx';
import Icon from '../components/Icon.tsx';
import Modal from '../components/Modal.tsx';
import { PostPomodoroCategories, PostPomodoroCategory, PomodoroProfile, PRESET_POMODORO_PROFILES } from '../types.ts';

const Settings: React.FC = () => {
    const {
        setBackground,
        setBackgroundColor,
        backgroundBlur,
        setBackgroundBlur,
        backgroundOpacity,
        setBackgroundOpacity,
        motivationalVideos,
        addMotivationalVideo,
        deleteMotivationalVideo,
        postPomodoroVideos,
        addPostPomodoroVideo,
        deletePostPomodoroVideo,
        isFlowModeEnabled,
        setIsFlowModeEnabled,
        pomodoroProfiles,
        activeProfileId,
        addProfile,
        updateProfile,
        deleteProfile,
        setActiveProfileId,
    } = useContext(DataContext);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const colorInputRef = useRef<HTMLInputElement>(null);
    const [newMotivationVideoUrl, setNewMotivationVideoUrl] = useState('');
    const [newRewardVideoUrl, setNewRewardVideoUrl] = useState('');
    const [activeRewardCategory, setActiveRewardCategory] = useState<PostPomodoroCategory>(PostPomodoroCategories[0]);

    // Pomodoro Profile Modal State
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState<PomodoroProfile | null>(null);
    const [profileForm, setProfileForm] = useState({
        name: '',
        focus: 25,
        shortBreak: 5,
        longBreak: 15,
        longBreakInterval: 4,
    });

    const presetProfileIds = PRESET_POMODORO_PROFILES.map(p => p.id);

    const openCreateProfileModal = () => {
        setEditingProfile(null);
        setProfileForm({ name: '', focus: 25, shortBreak: 5, longBreak: 15, longBreakInterval: 4 });
        setIsProfileModalOpen(true);
    };

    const openEditProfileModal = (profile: PomodoroProfile) => {
        setEditingProfile(profile);
        setProfileForm({
            name: profile.name,
            focus: profile.focus,
            shortBreak: profile.shortBreak,
            longBreak: profile.longBreak,
            longBreakInterval: profile.longBreakInterval,
        });
        setIsProfileModalOpen(true);
    };

    const handleProfileFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!profileForm.name.trim()) return;

        if (editingProfile) {
            updateProfile(editingProfile.id, {
                name: profileForm.name.trim(),
                focus: profileForm.focus,
                shortBreak: profileForm.shortBreak,
                longBreak: profileForm.longBreak,
                longBreakInterval: profileForm.longBreakInterval,
            });
        } else {
            addProfile({
                name: profileForm.name.trim(),
                focus: profileForm.focus,
                shortBreak: profileForm.shortBreak,
                longBreak: profileForm.longBreak,
                longBreakInterval: profileForm.longBreakInterval,
            });
        }
        setIsProfileModalOpen(false);
    };

    const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setBackground(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddMotivationVideo = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMotivationVideoUrl.trim() && (newMotivationVideoUrl.startsWith('http://') || newMotivationVideoUrl.startsWith('https://'))) {
            addMotivationalVideo(newMotivationVideoUrl.trim());
            setNewMotivationVideoUrl('');
        } else {
            alert("Please enter a valid URL.");
        }
    };
    
    const handleAddRewardVideo = (e: React.FormEvent) => {
        e.preventDefault();
        if (newRewardVideoUrl.trim() && (newRewardVideoUrl.startsWith('http://') || newRewardVideoUrl.startsWith('https://'))) {
            addPostPomodoroVideo(activeRewardCategory, newRewardVideoUrl.trim());
            setNewRewardVideoUrl('');
        } else {
            alert("Please enter a valid URL.");
        }
    };


    return (
        <div className="h-full overflow-y-auto pb-10">
            <h1 className="text-2xl sm:text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-400 dark:to-violet-300">Settings</h1>
            <div className="space-y-8 max-w-4xl mx-auto">
                {/* Background Settings Card */}
                <div className="bg-light-card/60 dark:bg-dark-card/50 backdrop-blur-2xl p-6 rounded-2xl shadow-lg border border-white/20 dark:border-white/10">
                    <h2 className="text-xl font-bold mb-4">Background</h2>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex-grow text-sm flex items-center justify-center p-2 rounded-md bg-primary/20 text-primary hover:bg-primary hover:text-white transition-colors"
                            >
                                <Icon name="UploadCloud" className="h-4 w-4 mr-2" /> Upload Image
                            </button>
                            <button onClick={() => colorInputRef.current?.click()} className="p-2 rounded-md bg-primary/20 text-primary hover:bg-primary hover:text-white transition-colors">
                                <Icon name="Palette" className="h-4 w-4" />
                            </button>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleBgUpload} className="hidden" accept="image/*" />
                        <input type="color" ref={colorInputRef} onChange={(e) => setBackgroundColor(e.target.value)} className="hidden" />

                        <div className="text-sm">
                            <label htmlFor="blur" className="block mb-1 font-medium">Blur</label>
                            <input id="blur" type="range" min="0" max="40" value={backgroundBlur} onChange={(e) => setBackgroundBlur(Number(e.target.value))} className="w-full" />
                        </div>
                        <div className="text-sm">
                            <label htmlFor="opacity" className="block mb-1 font-medium">Brightness</label>
                            <input id="opacity" type="range" min="10" max="100" value={backgroundOpacity} onChange={(e) => setBackgroundOpacity(Number(e.target.value))} className="w-full" />
                        </div>
                    </div>
                </div>

                {/* Flow Mode Settings Card */}
                <div className="bg-light-card/60 dark:bg-dark-card/50 backdrop-blur-2xl p-6 rounded-2xl shadow-lg border border-white/20 dark:border-white/10">
                    <h2 className="text-xl font-bold mb-4">Akış Modu</h2>
                    <div className="flex justify-between items-center">
                        <label htmlFor="flow-mode-toggle" className="font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                            Akış Modu Bonusu
                        </label>
                        <button
                            id="flow-mode-toggle"
                            role="switch"
                            aria-checked={isFlowModeEnabled}
                            onClick={() => setIsFlowModeEnabled(!isFlowModeEnabled)}
                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                                isFlowModeEnabled ? 'bg-primary' : 'bg-gray-500/30'
                            }`}
                        >
                            <span
                                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                                    isFlowModeEnabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                        Etkinleştirildiğinde, bir odaklanma seansı sırasında rastgele bir "Akış Bonusu" verilebilir. Bu bonus, derin konsantrasyonunuzu sürdürmenize yardımcı olmak için zamanlayıcınıza 10 dakika ekler.
                    </p>
                </div>
                
                {/* Pomodoro Profiles Card */}
                <div className="bg-light-card/60 dark:bg-dark-card/50 backdrop-blur-2xl p-6 rounded-2xl shadow-lg border border-white/20 dark:border-white/10">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Pomodoro Profilleri</h2>
                        <button
                            onClick={openCreateProfileModal}
                            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors font-semibold"
                        >
                            <Icon name="Plus" className="w-4 h-4" /> Yeni Profil
                        </button>
                    </div>
                    <div className="space-y-2">
                        {pomodoroProfiles.map(profile => {
                            const isActive = profile.id === activeProfileId;
                            const isPreset = presetProfileIds.includes(profile.id);
                            return (
                                <div
                                    key={profile.id}
                                    onClick={() => setActiveProfileId(profile.id)}
                                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                                        isActive
                                            ? 'bg-primary/20 border-2 border-primary shadow-md'
                                            : 'bg-gray-500/5 dark:bg-white/5 border-2 border-transparent hover:bg-gray-500/10 dark:hover:bg-white/10'
                                    }`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-semibold ${isActive ? 'text-primary' : ''}`}>
                                                {profile.name}
                                            </span>
                                            {isActive && (
                                                <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                                                    Aktif
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex gap-3">
                                            <span>Odak: {profile.focus}dk</span>
                                            <span>Kısa Mola: {profile.shortBreak}dk</span>
                                            <span>Uzun Mola: {profile.longBreak}dk</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 ml-2">
                                        {!isPreset && (
                                            <>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openEditProfileModal(profile); }}
                                                    className="p-1.5 hover:bg-primary/20 rounded-lg text-gray-500 hover:text-primary transition-colors"
                                                    title="Düzenle"
                                                >
                                                    <Icon name="Edit" className="w-4 h-4" />
                                                </button>
                                                {!isActive && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); deleteProfile(profile.id); }}
                                                        className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-500 hover:text-red-500 transition-colors"
                                                        title="Sil"
                                                    >
                                                        <Icon name="Trash2" className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {pomodoroProfiles.length === 0 && (
                            <p className="text-center text-sm text-gray-400 py-4">Henüz profil eklenmedi.</p>
                        )}
                    </div>
                </div>

                {/* Profile Create/Edit Modal */}
                <Modal
                    isOpen={isProfileModalOpen}
                    onClose={() => setIsProfileModalOpen(false)}
                    title={editingProfile ? 'Profili Düzenle' : 'Yeni Profil Oluştur'}
                >
                    <form onSubmit={handleProfileFormSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Profil Adı</label>
                            <input
                                type="text"
                                value={profileForm.name}
                                onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Profil adı girin"
                                className="w-full bg-gray-500/10 dark:bg-white/5 border-transparent rounded-lg p-2.5 text-sm focus:ring-primary focus:border-primary"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium mb-1">Odak (dk)</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={180}
                                    value={profileForm.focus}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, focus: Number(e.target.value) }))}
                                    className="w-full bg-gray-500/10 dark:bg-white/5 border-transparent rounded-lg p-2.5 text-sm focus:ring-primary focus:border-primary"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Kısa Mola (dk)</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={60}
                                    value={profileForm.shortBreak}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, shortBreak: Number(e.target.value) }))}
                                    className="w-full bg-gray-500/10 dark:bg-white/5 border-transparent rounded-lg p-2.5 text-sm focus:ring-primary focus:border-primary"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Uzun Mola (dk)</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={60}
                                    value={profileForm.longBreak}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, longBreak: Number(e.target.value) }))}
                                    className="w-full bg-gray-500/10 dark:bg-white/5 border-transparent rounded-lg p-2.5 text-sm focus:ring-primary focus:border-primary"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Uzun Mola Aralığı</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={profileForm.longBreakInterval}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, longBreakInterval: Number(e.target.value) }))}
                                    className="w-full bg-gray-500/10 dark:bg-white/5 border-transparent rounded-lg p-2.5 text-sm focus:ring-primary focus:border-primary"
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsProfileModalOpen(false)}
                                className="px-4 py-2 text-sm rounded-lg bg-gray-500/10 hover:bg-gray-500/20 transition-colors font-medium"
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors font-semibold"
                            >
                                {editingProfile ? 'Kaydet' : 'Oluştur'}
                            </button>
                        </div>
                    </form>
                </Modal>

                {/* Pomodoro Reward Videos Card */}
                 <div className="bg-light-card/60 dark:bg-dark-card/50 backdrop-blur-2xl p-6 rounded-2xl shadow-lg border border-white/20 dark:border-white/10">
                    <h2 className="text-xl font-bold mb-2">Pomodoro Sonu Ödülleri</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Her odaklanma seansı sonunda size rastgele gösterilecek YouTube videoları ekleyin.</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4 border-b border-white/20 dark:border-white/10 pb-4">
                        {PostPomodoroCategories.map(cat => (
                            <button 
                                key={cat} 
                                onClick={() => setActiveRewardCategory(cat)}
                                className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${activeRewardCategory === cat ? 'bg-primary text-white' : 'bg-gray-500/10 hover:bg-gray-500/20'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleAddRewardVideo} className="flex gap-2 mb-4">
                        <input
                            type="url"
                            value={newRewardVideoUrl}
                            onChange={(e) => setNewRewardVideoUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="flex-grow bg-gray-500/10 dark:bg-white/5 border-transparent rounded-md p-2 text-sm focus:ring-primary focus:border-primary"
                        />
                        <button type="submit" className="bg-primary text-white p-2 rounded-md hover:bg-primary-hover px-4 font-semibold">
                            Ekle
                        </button>
                    </form>
                    <ul className="space-y-2 max-h-60 overflow-y-auto">
                        {postPomodoroVideos[activeRewardCategory]?.map(video => (
                            <li key={video.id} className="flex items-center justify-between p-2 rounded-md bg-gray-500/5 dark:bg-white/5">
                                <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate flex-1 mr-4">
                                    {video.url}
                                </a>
                                <button onClick={() => deletePostPomodoroVideo(activeRewardCategory, video.id)} className="p-1 hover:bg-red-500/20 rounded-full text-red-500">
                                    <Icon name="Trash2" className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                         {(!postPomodoroVideos[activeRewardCategory] || postPomodoroVideos[activeRewardCategory].length === 0) && <p className="text-center text-sm text-gray-400 py-4">Bu kategoriye henüz video eklenmedi.</p>}
                    </ul>
                </div>

                {/* Motivational Videos Card */}
                <div className="bg-light-card/60 dark:bg-dark-card/50 backdrop-blur-2xl p-6 rounded-2xl shadow-lg border border-white/20 dark:border-white/10">
                    <h2 className="text-xl font-bold mb-4">Pomodoro Öncesi Motivasyon Videoları</h2>
                     <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Bir odaklanma seansı başlamadan önce size rastgele önerilecek YouTube video bağlantıları ekleyin.</p>
                    <form onSubmit={handleAddMotivationVideo} className="flex gap-2 mb-4">
                        <input
                            type="url"
                            value={newMotivationVideoUrl}
                            onChange={(e) => setNewMotivationVideoUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="flex-grow bg-gray-500/10 dark:bg-white/5 border-transparent rounded-md p-2 text-sm focus:ring-primary focus:border-primary"
                        />
                        <button type="submit" className="bg-primary text-white p-2 rounded-md hover:bg-primary-hover px-4 font-semibold">
                            Ekle
                        </button>
                    </form>
                    <ul className="space-y-2 max-h-60 overflow-y-auto">
                        {motivationalVideos.map(video => (
                            <li key={video.id} className="flex items-center justify-between p-2 rounded-md bg-gray-500/5 dark:bg-white/5">
                                <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate flex-1 mr-4">
                                    {video.url}
                                </a>
                                <button onClick={() => deleteMotivationalVideo(video.id)} className="p-1 hover:bg-red-500/20 rounded-full text-red-500">
                                    <Icon name="Trash2" className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                         {motivationalVideos.length === 0 && <p className="text-center text-sm text-gray-400 py-4">Henüz video eklenmedi.</p>}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Settings;
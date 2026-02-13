
import React, { useContext, useState, useMemo, useEffect, useRef } from 'react';
import { DataContext } from '../context/DataContext.tsx';
import { CollectionCard } from '../types.ts';
import Icon from '../components/Icon.tsx';
import Modal from '../components/Modal.tsx';

const rarityColorMap = {
    Common: 'text-slate-400',
    Rare: 'text-cyan-400',
    Epic: 'text-purple-400',
    Legendary: 'text-amber-500',
    Icon: 'text-emerald-400'
}

const rarityBorderMap = {
    Common: 'border-slate-400/30 hover:border-slate-400/60',
    Rare: 'border-cyan-400/30 hover:border-cyan-400/60',
    Epic: 'border-purple-400/30 hover:border-purple-400/60',
    Legendary: 'border-amber-500/30 hover:border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.15)]',
    Icon: 'border-emerald-400/30 hover:border-emerald-400/60 shadow-[0_0_20px_rgba(52,211,153,0.2)]'
};

// --- Image Cropper Component ---
const ImageCropper: React.FC<{
    imageSrc: string;
    onCropComplete: (croppedDataUrl: string) => void;
    onCancel: () => void;
}> = ({ imageSrc, onCropComplete, onCancel }) => {
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
    
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Constants for Preview and Output
    const PREVIEW_WIDTH = 300;
    const PREVIEW_HEIGHT = 400;
    const OUTPUT_SCALE = 4; // Output will be 1200x1600 (High Quality)

    useEffect(() => {
        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
            // Calculate "Cover" dimensions for the preview container
            const containerRatio = PREVIEW_WIDTH / PREVIEW_HEIGHT;
            const imgRatio = img.width / img.height;

            let renderWidth, renderHeight;

            if (imgRatio > containerRatio) {
                // Image is wider than container -> Match height
                renderHeight = PREVIEW_HEIGHT;
                renderWidth = renderHeight * imgRatio;
            } else {
                // Image is taller than container -> Match width
                renderWidth = PREVIEW_WIDTH;
                renderHeight = renderWidth / imgRatio;
            }

            setImgDimensions({
                width: renderWidth,
                height: renderHeight
            });
            // Reset position on new image load
            setOffset({ x: 0, y: 0 });
            setZoom(1);
        };
    }, [imageSrc]);

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        
        // Prevent default to stop scrolling on touch devices
        if ('touches' in e) {
           // e.preventDefault(); 
        }

        setOffset({
            x: clientX - dragStart.x,
            y: clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleCrop = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set High Resolution Dimensions
        canvas.width = PREVIEW_WIDTH * OUTPUT_SCALE;
        canvas.height = PREVIEW_HEIGHT * OUTPUT_SCALE;

        if (ctx && imgDimensions.width > 0) {
            // Enable high quality scaling
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Fill background
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // --- Coordinate System Mapping ---
            // We map the CSS transform exactly to the Canvas transform.
            // The canvas is OUTPUT_SCALE times larger than the preview div.
            
            // 1. Move origin to the center of the canvas
            ctx.translate(canvas.width / 2, canvas.height / 2);

            // 2. Apply the offset (Pan) multiplied by scale
            ctx.translate(offset.x * OUTPUT_SCALE, offset.y * OUTPUT_SCALE);

            // 3. Apply Zoom
            ctx.scale(zoom, zoom);

            // 4. Draw the image
            // The image size on canvas needs to be scaled up from the preview size by OUTPUT_SCALE
            const drawWidth = imgDimensions.width * OUTPUT_SCALE;
            const drawHeight = imgDimensions.height * OUTPUT_SCALE;

            const originalImg = new Image();
            originalImg.src = imageSrc;
            
            // Draw centered relative to the current origin (which is now center + offset)
            ctx.drawImage(
                originalImg,
                -drawWidth / 2,
                -drawHeight / 2,
                drawWidth,
                drawHeight
            );

            // Get high quality JPEG
            onCropComplete(canvas.toDataURL('image/jpeg', 0.95));
        }
    };

    return (
        <div className="flex flex-col items-center space-y-6 select-none">
            <p className="text-gray-400 text-xs text-center animate-pulse">Fotoğrafı sürükleyerek konumlandırın.</p>
            
            {/* Preview Area */}
            <div 
                className="relative overflow-hidden rounded-xl border-4 border-primary shadow-2xl bg-black cursor-move touch-none"
                style={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
            >
                {/* Reference Grid (Rule of Thirds) */}
                <div className="absolute inset-0 z-10 pointer-events-none opacity-30 border border-white/20 grid grid-cols-3 grid-rows-3">
                    <div className="border-r border-b border-white/20"></div>
                    <div className="border-r border-b border-white/20"></div>
                    <div className="border-b border-white/20"></div>
                    <div className="border-r border-b border-white/20"></div>
                    <div className="border-r border-b border-white/20"></div>
                    <div className="border-b border-white/20"></div>
                    <div className="border-r border-white/20"></div>
                    <div className="border-r border-white/20"></div>
                    <div></div>
                </div>

                <img 
                    src={imageSrc} 
                    alt="Crop target" 
                    className="absolute max-w-none pointer-events-none will-change-transform"
                    style={{
                        width: imgDimensions.width,
                        height: imgDimensions.height,
                        // Center Logic + Offset + Zoom
                        // Important: The sequence matches the canvas transformations logic
                        left: '50%',
                        top: '50%',
                        transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                        transformOrigin: 'center' 
                    }}
                    draggable={false}
                />
            </div>

            {/* Controls */}
            <div className="w-full max-w-md space-y-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-400 font-bold">
                        <span className="flex items-center"><Icon name="Search" className="w-3 h-3 mr-1"/> YAKINLAŞTIR</span>
                        <span>{zoom.toFixed(2)}x</span>
                    </div>
                    <input 
                        type="range" 
                        min="0.5" 
                        max="3" 
                        step="0.01" 
                        value={zoom} 
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        className="w-full accent-primary h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
                
                <div className="flex justify-center space-x-4">
                     <button onClick={() => { setZoom(1); setOffset({x:0,y:0}); }} className="text-xs text-gray-500 hover:text-white transition-colors flex items-center">
                        <Icon name="RefreshCw" className="w-3 h-3 mr-1"/> Sıfırla
                     </button>
                </div>
            </div>

            <div className="flex space-x-3 w-full max-w-md">
                <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-gray-500/20 hover:bg-gray-500/30 text-sm font-bold text-gray-300 transition-colors">
                    İptal
                </button>
                <button onClick={handleCrop} className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary-hover hover:to-purple-500 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all transform hover:scale-[1.02]">
                    <Icon name="Check" className="w-4 h-4 inline mr-2"/> Kırp ve Kaydet
                </button>
            </div>
        </div>
    );
};


const Card: React.FC<{ 
    card: CollectionCard; 
    isUnlocked: boolean; 
    onClick: () => void; 
    isAdmin?: boolean;
    onEdit?: (e: React.MouseEvent) => void;
}> = ({ card, isUnlocked, onClick, isAdmin, onEdit }) => {
    const borderClass = isUnlocked ? rarityBorderMap[card.rarity] : 'border-white/5';
    
    return (
        <div
            className={`group relative aspect-[3/4] rounded-xl border-2 transition-all duration-300 overflow-hidden cursor-pointer ${borderClass} ${isUnlocked ? 'hover:-translate-y-2 hover:shadow-2xl' : 'opacity-80'}`}
            onClick={onClick}
        >
            {/* Background Image */}
            <div 
                className="absolute inset-0 bg-dark-surface transition-all duration-500"
                style={{ 
                    backgroundImage: `url(${card.imageData})`,
                    backgroundSize: 'cover', // Ensures cropped image fills the card
                    backgroundPosition: 'center',
                    filter: isUnlocked ? 'none' : 'blur(12px) grayscale(100%)',
                    transform: isUnlocked ? 'scale(1)' : 'scale(1.1)'
                }}
            ></div>

            {/* Overlay Gradient for Text readability */}
            <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent ${isUnlocked ? 'opacity-80' : 'opacity-90'}`}></div>
            
            {/* Content */}
            <div className="absolute inset-0 p-4 flex flex-col justify-between">
                {/* Top Status Icon */}
                <div className="flex justify-end space-x-2">
                    {isAdmin && (
                        <button 
                            onClick={onEdit}
                            className="bg-blue-500/80 hover:bg-blue-500 text-white p-1.5 rounded-full backdrop-blur-md border border-white/10 z-20 transition-colors shadow-lg"
                            title="Düzenle"
                        >
                            <Icon name="Edit" className="w-3 h-3" />
                        </button>
                    )}
                    {isUnlocked ? (
                        <div className="bg-black/40 backdrop-blur-md p-1.5 rounded-full border border-white/10">
                           <Icon name="Check" className="w-3 h-3 text-green-400" /> 
                        </div>
                    ) : (
                         <div className="bg-black/40 backdrop-blur-md p-1.5 rounded-full border border-white/10">
                           <Icon name="Lock" className="w-3 h-3 text-white/50" /> 
                        </div>
                    )}
                </div>

                {/* Bottom Text */}
                <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${rarityColorMap[card.rarity]}`}>
                        {card.rarity}
                    </span>
                    <h3 className={`font-bold leading-tight text-white ${isUnlocked ? 'text-lg' : 'text-sm text-gray-400'}`}>
                        {isUnlocked ? card.name : '???'}
                    </h3>
                    
                    {!isUnlocked && (
                        <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-center">
                             {card.unlockMethod === 'op' ? (
                                <div className="flex items-center space-x-1 text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">
                                    <Icon name="Op" className="w-3 h-3"/>
                                    <span>{card.opCost} OP</span>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-1 text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-1 rounded">
                                    <Icon name="Award" className="w-3 h-3"/>
                                    <span>Görev</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Hover Shine Effect for Unlocked Cards */}
            {isUnlocked && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-tr from-transparent via-white to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
            )}
        </div>
    );
};

const Collection: React.FC = () => {
    const { 
        collectionCards, 
        unlockedCardIds, 
        unlockCardWithOp, 
        op, 
        completedSessionCountForCards, 
        claimLegendaryCard, 
        legendaryCardsUnlockedForIcon, 
        claimIconCard,
        addCollectionCard,
        updateCollectionCard,
        deleteCollectionCard
    } = useContext(DataContext);

    const [selectedCard, setSelectedCard] = useState<CollectionCard | null>(null);
    const [activeTab, setActiveTab] = useState<string>('Hepsi');
    const [showClaimLegendaryModal, setShowClaimLegendaryModal] = useState(false);
    const [showClaimIconModal, setShowClaimIconModal] = useState(false);
    const [unlockedLegendaryCard, setUnlockedLegendaryCard] = useState<CollectionCard | null>(null);
    const [unlockedIconCard, setUnlockedIconCard] = useState<CollectionCard | null>(null);

    // Admin State
    const [isAdmin, setIsAdmin] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<Partial<CollectionCard>>({});
    const [imageSourceType, setImageSourceType] = useState<'url' | 'upload'>('url');
    const [tempImageSrc, setTempImageSrc] = useState<string | null>(null); // For cropper

    const fileInputRef = useRef<HTMLInputElement>(null);

    const availableLegendaryCards = useMemo(() => {
        return collectionCards.filter(c => c.unlockMethod === 'session_streak' && c.rarity === 'Legendary' && !unlockedCardIds.includes(c.id));
    }, [collectionCards, unlockedCardIds]);

    const handleUnlock = (card: CollectionCard) => {
        if (card.unlockMethod === 'op') {
            const success = unlockCardWithOp(card.id);
            if(success) {
                setSelectedCard(card);
            } else {
                alert("Bu kartı açmak için yeterli OP puanın yok!");
            }
        }
    };
    
    const handleClaimLegendary = (cardToUnlock: CollectionCard) => {
        const claimedCard = claimLegendaryCard(cardToUnlock.id);
        if (claimedCard) {
            setUnlockedLegendaryCard(claimedCard);
        }
        setShowClaimLegendaryModal(false);
    };

    const handleClaimIcon = () => {
        const claimedCard = claimIconCard();
        if (claimedCard) {
            setUnlockedIconCard(claimedCard);
        }
        setShowClaimIconModal(false);
    };

    // Admin Functions
    const handleAdminLogin = () => {
        if (passwordInput === 'lezzetside') {
            setIsAdmin(true);
            setIsPasswordModalOpen(false);
            setPasswordInput('');
        } else {
            alert('Hatalı şifre!');
        }
    };

    const openAddCardModal = () => {
        setEditingCard({
            name: '',
            description: '',
            rarity: 'Common',
            imageData: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=800&auto=format&fit=crop',
            opCost: 50,
            unlockMethod: 'op'
        });
        setImageSourceType('url');
        setTempImageSrc(null);
        setIsAdminModalOpen(true);
    };

    const openEditCardModal = (card: CollectionCard, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingCard({ ...card });
        setImageSourceType('url');
        setTempImageSrc(null);
        setIsAdminModalOpen(true);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempImageSrc(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = (croppedDataUrl: string) => {
        setEditingCard(prev => ({ ...prev, imageData: croppedDataUrl }));
        setTempImageSrc(null); // Close cropper
    };

    const handleSaveCard = () => {
        if (!editingCard.name || !editingCard.imageData) {
            alert("Lütfen isim ve görsel URL'sini doldurun.");
            return;
        }

        const cardData = editingCard as CollectionCard;

        if (cardData.id) {
            // Edit existing
            updateCollectionCard(cardData.id, cardData);
        } else {
            // Add new
            addCollectionCard({
                name: cardData.name,
                description: cardData.description || '',
                rarity: cardData.rarity,
                imageData: cardData.imageData,
                opCost: Number(cardData.opCost),
            } as any); 
        }
        setIsAdminModalOpen(false);
    };

    const handleDeleteCard = () => {
        if (editingCard.id) {
            if (confirm('Bu kartı silmek istediğine emin misin?')) {
                deleteCollectionCard(editingCard.id);
                setIsAdminModalOpen(false);
            }
        }
    };

    const tabs = ['Hepsi', 'Common', 'Rare', 'Epic', 'Legendary', 'Icon'];

    const filteredCards = useMemo(() => {
        let cards = [...collectionCards];
        if (activeTab !== 'Hepsi') {
            cards = cards.filter(c => c.rarity === activeTab);
        }
        // Sort: Unlocked first, then by rarity weight
        const rarityWeight = { 'Icon': 5, 'Legendary': 4, 'Epic': 3, 'Rare': 2, 'Common': 1 };
        return cards.sort((a, b) => {
            const aUnlocked = unlockedCardIds.includes(a.id);
            const bUnlocked = unlockedCardIds.includes(b.id);
            if (aUnlocked !== bUnlocked) return aUnlocked ? -1 : 1;
            return rarityWeight[b.rarity] - rarityWeight[a.rarity];
        });
    }, [collectionCards, activeTab, unlockedCardIds]);

    const progressStats = useMemo(() => {
        const total = collectionCards.length;
        const unlocked = unlockedCardIds.length;
        const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;
        return { total, unlocked, percentage };
    }, [collectionCards, unlockedCardIds]);

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Header Section */}
            <div className="shrink-0 pb-4">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-3">
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">Koleksiyonum</h1>
                        {isAdmin && <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">ADMIN MODU</span>}
                    </div>
                    <button 
                        onClick={() => isAdmin ? setIsAdmin(false) : setIsPasswordModalOpen(true)}
                        className={`p-2 rounded-full transition-all ${isAdmin ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                    >
                        {isAdmin ? <Icon name="Lock" className="w-5 h-5" /> : <Icon name="Lock" className="w-5 h-5" />}
                    </button>
                </div>
                
                {/* Stats Bar */}
                <div className="flex flex-wrap gap-4 items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm mb-6">
                    <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <path className="text-gray-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                                <path className="text-primary" strokeDasharray={`${progressStats.percentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">{progressStats.percentage}%</div>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold">Toplam Kart</p>
                            <p className="text-lg font-bold text-white">{progressStats.unlocked} <span className="text-gray-500 text-sm">/ {progressStats.total}</span></p>
                        </div>
                    </div>
                    
                    {/* Active Quests / Progress Bars */}
                    <div className="flex flex-col sm:flex-row gap-4 flex-grow sm:justify-end">
                        {/* Legendary Progress */}
                        <div className="flex flex-col min-w-[180px]">
                             <div className="flex justify-between text-xs mb-1">
                                <span className="text-amber-400 font-bold">Efsanevi Yolculuk</span>
                                <span className="text-gray-400">{completedSessionCountForCards}/10 Seans</span>
                             </div>
                             <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-amber-500 transition-all duration-500" 
                                    style={{ width: `${Math.min((completedSessionCountForCards / 10) * 100, 100)}%` }}
                                ></div>
                             </div>
                             <button 
                                onClick={() => setShowClaimLegendaryModal(true)}
                                disabled={completedSessionCountForCards < 10 || availableLegendaryCards.length === 0}
                                className={`mt-1 text-[10px] py-0.5 rounded font-bold transition-colors ${completedSessionCountForCards >= 10 ? 'bg-amber-500 text-black hover:bg-amber-400' : 'bg-white/5 text-gray-500 cursor-not-allowed'}`}
                            >
                                {completedSessionCountForCards >= 10 ? 'ÖDÜLÜ AL' : 'Devam Ediyor...'}
                            </button>
                        </div>

                         {/* Icon Progress */}
                         <div className="flex flex-col min-w-[180px]">
                             <div className="flex justify-between text-xs mb-1">
                                <span className="text-emerald-400 font-bold">İkon Statüsü</span>
                                <span className="text-gray-400">{legendaryCardsUnlockedForIcon}/3 Efsane</span>
                             </div>
                             <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-emerald-500 transition-all duration-500" 
                                    style={{ width: `${Math.min((legendaryCardsUnlockedForIcon / 3) * 100, 100)}%` }}
                                ></div>
                             </div>
                             <button 
                                onClick={() => setShowClaimIconModal(true)}
                                disabled={legendaryCardsUnlockedForIcon < 3}
                                className={`mt-1 text-[10px] py-0.5 rounded font-bold transition-colors ${legendaryCardsUnlockedForIcon >= 3 ? 'bg-emerald-500 text-black hover:bg-emerald-400' : 'bg-white/5 text-gray-500 cursor-not-allowed'}`}
                            >
                                {legendaryCardsUnlockedForIcon >= 3 ? 'ÖDÜLÜ AL' : 'Devam Ediyor...'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-2 overflow-x-auto pb-2 no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                                activeTab === tab 
                                ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cards Grid */}
            <div className="flex-grow overflow-y-auto -mr-4 pr-4 pb-10">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-fade-in">
                    {/* Admin Add Card Button */}
                    {isAdmin && (
                        <div 
                            onClick={openAddCardModal}
                            className="group relative aspect-[3/4] rounded-xl border-2 border-dashed border-white/20 hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer bg-white/5 hover:bg-white/10 transition-all"
                        >
                            <Icon name="Plus" className="w-12 h-12 text-gray-400 group-hover:text-primary mb-2 transition-colors" />
                            <span className="text-sm font-bold text-gray-400 group-hover:text-white">Yeni Kart Ekle</span>
                        </div>
                    )}

                    {filteredCards.length > 0 ? filteredCards.map(card => (
                        <Card 
                            key={card.id} 
                            card={card} 
                            isUnlocked={unlockedCardIds.includes(card.id)} 
                            onClick={() => setSelectedCard(card)}
                            isAdmin={isAdmin}
                            onEdit={(e) => openEditCardModal(card, e)}
                        />
                    )) : (
                        !isAdmin && (
                            <div className="col-span-full py-20 text-center text-gray-500">
                                <Icon name="Search" className="w-12 h-12 mx-auto mb-2 opacity-30"/>
                                <p>Bu kategoride henüz kart yok.</p>
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {selectedCard && (
                <Modal isOpen={!!selectedCard} onClose={() => setSelectedCard(null)} title={selectedCard.name}>
                    <div className="flex flex-col items-center">
                        <div className="w-64 relative transform transition-transform hover:scale-105 duration-500">
                             {/* Glow behind the card in modal */}
                             <div className={`absolute inset-0 blur-xl opacity-50 ${
                                 selectedCard.rarity === 'Legendary' ? 'bg-amber-500' : 
                                 selectedCard.rarity === 'Icon' ? 'bg-emerald-500' : 
                                 selectedCard.rarity === 'Epic' ? 'bg-purple-500' : 
                                 selectedCard.rarity === 'Rare' ? 'bg-cyan-500' : 'bg-gray-500'
                             }`}></div>
                            <Card card={selectedCard} isUnlocked={unlockedCardIds.includes(selectedCard.id)} onClick={() => {}} />
                        </div>
                        
                        <div className="mt-6 text-center space-y-2 max-w-xs">
                            <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full border ${
                                selectedCard.rarity === 'Legendary' ? 'text-amber-400 border-amber-400/30 bg-amber-400/10' : 
                                selectedCard.rarity === 'Icon' ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' : 
                                selectedCard.rarity === 'Epic' ? 'text-purple-400 border-purple-400/30 bg-purple-400/10' : 
                                selectedCard.rarity === 'Rare' ? 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10' : 'text-slate-400 border-slate-400/30 bg-slate-400/10'
                            }`}>
                                {selectedCard.rarity}
                            </span>
                            <p className="text-gray-300 leading-relaxed text-sm">{selectedCard.description}</p>
                        </div>
                        
                        {!unlockedCardIds.includes(selectedCard.id) && selectedCard.unlockMethod === 'op' && (
                            <button
                                onClick={() => handleUnlock(selectedCard)}
                                className="mt-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-green-500/30 hover:scale-105 transition-all flex items-center"
                                disabled={op < selectedCard.opCost}
                            >
                                <Icon name="Op" className="w-5 h-5 mr-2"/>
                                <span>{selectedCard.opCost} OP ile Kilidi Aç</span>
                            </button>
                        )}
                        
                        {!unlockedCardIds.includes(selectedCard.id) && selectedCard.unlockMethod === 'session_streak' && (
                             <div className="mt-6 p-3 bg-white/5 rounded-lg text-center border border-white/10">
                                <p className="text-xs text-gray-400">Bu kart sadece özel görevlerle açılabilir.</p>
                                <div className="mt-2 flex justify-center space-x-2 text-amber-400 font-bold text-sm">
                                    <Icon name="Award" className="w-4 h-4"/>
                                    <span>Odaklanma Serisi Gerekli</span>
                                </div>
                             </div>
                        )}

                        {op < selectedCard.opCost && !unlockedCardIds.includes(selectedCard.id) && selectedCard.unlockMethod === 'op' && (
                            <p className="text-xs text-red-400 mt-3 font-medium">Yetersiz OP Puanı ({op} OP mevcut)</p>
                        )}
                    </div>
                </Modal>
            )}

            {/* Password Modal */}
            <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title="Admin Girişi">
                <div className="space-y-4">
                    <p className="text-sm text-gray-400">Koleksiyonu yönetmek için yönetici şifresini girin.</p>
                    <input 
                        type="password" 
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="Şifre..."
                        className="w-full bg-gray-500/10 dark:bg-white/5 border-transparent rounded-md p-2 text-sm focus:ring-primary focus:border-primary"
                        onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                    />
                    <div className="flex justify-end">
                        <button onClick={handleAdminLogin} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover">Giriş Yap</button>
                    </div>
                </div>
            </Modal>

            {/* Admin Edit/Add Modal - Redesigned */}
            <Modal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} title={editingCard.id ? 'Kart Tasarım Stüdyosu' : 'Yeni Kart Oluştur'}>
                {tempImageSrc ? (
                    // Cropper Mode
                    <ImageCropper 
                        imageSrc={tempImageSrc} 
                        onCropComplete={handleCropComplete} 
                        onCancel={() => setTempImageSrc(null)} 
                    />
                ) : (
                    // Editor Mode
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Left: Live Preview (Fixed width) */}
                        <div className="md:col-span-5 flex flex-col items-center">
                            <p className="text-xs text-gray-400 mb-2 font-bold uppercase tracking-wide text-center w-full">Canlı Önizleme</p>
                            <div className="w-48 sticky top-0">
                                <Card 
                                    card={{
                                        id: 'PREVIEW',
                                        name: editingCard.name || 'Kart İsmi',
                                        rarity: editingCard.rarity || 'Common',
                                        description: editingCard.description || 'Açıklama burada görünecek...',
                                        imageData: editingCard.imageData || 'https://via.placeholder.com/300x400?text=No+Image',
                                        opCost: editingCard.opCost || 0,
                                        unlockMethod: editingCard.unlockMethod || 'op'
                                    }} 
                                    isUnlocked={true} 
                                    onClick={() => {}} 
                                />
                            </div>
                        </div>

                        {/* Right: Form Inputs */}
                        <div className="md:col-span-7 space-y-5 h-full overflow-y-auto max-h-[60vh] pr-2">
                            
                            {/* Image Section */}
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <label className="block text-xs font-bold text-primary mb-3 uppercase">Görsel Kaynağı</label>
                                <div className="flex space-x-2 mb-3">
                                    <button 
                                        onClick={() => setImageSourceType('upload')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${imageSourceType === 'upload' ? 'bg-primary text-white' : 'bg-white/10 text-gray-400'}`}
                                    >
                                        <Icon name="UploadCloud" className="w-4 h-4 inline mr-1"/> Cihazdan Yükle
                                    </button>
                                    <button 
                                        onClick={() => setImageSourceType('url')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${imageSourceType === 'url' ? 'bg-primary text-white' : 'bg-white/10 text-gray-400'}`}
                                    >
                                        <Icon name="Link" className="w-4 h-4 inline mr-1"/> URL Bağlantısı
                                    </button>
                                </div>

                                {imageSourceType === 'url' ? (
                                    <input 
                                        type="text" 
                                        value={editingCard.imageData || ''} 
                                        onChange={(e) => setEditingCard({...editingCard, imageData: e.target.value})}
                                        placeholder="https://..."
                                        className="w-full bg-black/20 rounded-md p-2 text-sm border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:bg-white/5 transition-colors relative">
                                        <Icon name="Image" className="w-8 h-8 text-gray-500 mb-1"/>
                                        <p className="text-xs text-gray-500">Fotoğraf Seçmek İçin Tıkla</p>
                                        <input 
                                            type="file" 
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Details Section */}
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                                <label className="block text-xs font-bold text-primary mb-1 uppercase">Kart Detayları</label>
                                
                                <div>
                                    <span className="text-xs text-gray-400 block mb-1">İsim</span>
                                    <input 
                                        type="text" 
                                        value={editingCard.name || ''} 
                                        onChange={(e) => setEditingCard({...editingCard, name: e.target.value})}
                                        className="w-full bg-black/20 rounded-md p-2 text-sm border border-white/10 focus:border-primary outline-none font-semibold"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <span className="text-xs text-gray-400 block mb-1">Nadirlik</span>
                                        <select 
                                            value={editingCard.rarity || 'Common'}
                                            onChange={(e) => setEditingCard({...editingCard, rarity: e.target.value as any})}
                                            className="w-full bg-black/20 rounded-md p-2 text-sm border border-white/10 focus:border-primary outline-none"
                                        >
                                            {Object.keys(rarityColorMap).map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-400 block mb-1">Kilit Tipi</span>
                                        <select 
                                            value={editingCard.unlockMethod || 'op'}
                                            onChange={(e) => setEditingCard({...editingCard, unlockMethod: e.target.value as any})}
                                            className="w-full bg-black/20 rounded-md p-2 text-sm border border-white/10 focus:border-primary outline-none"
                                        >
                                            <option value="op">Odak Puanı (OP)</option>
                                            <option value="session_streak">Görev (Seans)</option>
                                        </select>
                                    </div>
                                </div>

                                {editingCard.unlockMethod === 'op' && (
                                    <div>
                                        <span className="text-xs text-gray-400 block mb-1">OP Bedeli</span>
                                        <input 
                                            type="number" 
                                            value={editingCard.opCost || 0} 
                                            onChange={(e) => setEditingCard({...editingCard, opCost: parseInt(e.target.value)})}
                                            className="w-full bg-black/20 rounded-md p-2 text-sm border border-white/10 focus:border-primary outline-none"
                                        />
                                    </div>
                                )}

                                <div>
                                    <span className="text-xs text-gray-400 block mb-1">Hikaye / Açıklama</span>
                                    <textarea 
                                        rows={3}
                                        value={editingCard.description || ''} 
                                        onChange={(e) => setEditingCard({...editingCard, description: e.target.value})}
                                        className="w-full bg-black/20 rounded-md p-2 text-sm border border-white/10 focus:border-primary outline-none resize-none"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-between pt-2">
                                {editingCard.id ? (
                                    <button onClick={handleDeleteCard} className="text-red-400 hover:text-red-300 text-xs font-bold flex items-center px-3 py-2 rounded hover:bg-red-500/10 transition-colors">
                                        <Icon name="Trash2" className="w-4 h-4 mr-1"/> Sil
                                    </button>
                                ) : <div></div>}
                                <button onClick={handleSaveCard} className="bg-primary text-white px-8 py-2 rounded-lg hover:bg-primary-hover font-bold shadow-lg shadow-primary/30 transition-transform hover:scale-105">
                                    Kaydet
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={showClaimLegendaryModal} onClose={() => setShowClaimLegendaryModal(false)} title="Efsanevi Kart Seçimi">
                <p className="mb-6 text-center text-gray-300 text-sm">Büyük başarının ödülü olarak bir Efsanevi kartın kilidini aç.</p>
                <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
                    {availableLegendaryCards.map(card => (
                        <div key={card.id} onClick={() => handleClaimLegendary(card)} className="cursor-pointer transform hover:scale-105 transition-transform">
                            <Card card={card} isUnlocked={false} onClick={() => {}} />
                             <p className="text-center text-xs mt-2 font-bold text-amber-500">{card.name}</p>
                        </div>
                    ))}
                </div>
            </Modal>
            
            <Modal isOpen={showClaimIconModal} onClose={() => setShowClaimIconModal(false)} title="İkonik Başarı!">
                <div className="text-center">
                    <div className="inline-block p-4 rounded-full bg-emerald-500/20 mb-4 animate-bounce">
                        <Icon name="Star" className="w-12 h-12 text-emerald-400" />
                    </div>
                    <p className="mb-6 text-gray-300">3 Efsanevi kart toplayarak ustalığını kanıtladın. Rastgele bir İkon kartı kazandın!</p>
                    <button onClick={handleClaimIcon} className="bg-emerald-500 text-white font-bold px-8 py-3 rounded-xl hover:bg-emerald-400 shadow-lg shadow-emerald-500/30 transition-all">
                        Kartı Göster
                    </button>
                </div>
            </Modal>
            
            {(unlockedLegendaryCard || unlockedIconCard) && (
                <Modal isOpen={!!unlockedLegendaryCard || !!unlockedIconCard} onClose={() => {setUnlockedLegendaryCard(null); setUnlockedIconCard(null);}} title="">
                     <div className="flex flex-col items-center py-4">
                        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 mb-6 animate-pulse">YENİ KART!</h2>
                        <div className="w-64 transform animate-[spin_0.5s_ease-out]">
                            <Card card={(unlockedLegendaryCard || unlockedIconCard)!} isUnlocked={true} onClick={() => {}} />
                        </div>
                        <p className="mt-6 text-center text-xl font-bold text-white tracking-wide">{(unlockedLegendaryCard || unlockedIconCard)!.name}</p>
                        <p className="text-center text-sm text-gray-400 mt-2">Koleksiyonuna başarıyla eklendi.</p>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Collection;

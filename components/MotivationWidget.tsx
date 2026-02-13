import React, { useContext, useRef, useCallback } from 'react';
import { DataContext } from '../context/DataContext.tsx';
import Icon from './Icon.tsx';

const MotivationWidget: React.FC = () => {
    const { motivationalImage, setMotivationalImage } = useContext(DataContext);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setMotivationalImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }, [setMotivationalImage]);
    
    const handleRemoveImage = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setMotivationalImage(null);
    }, [setMotivationalImage]);

    const handleChangeImage = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        fileInputRef.current?.click();
    }, []);


    return (
        <div 
            className="relative group bg-light-card/60 dark:bg-dark-card/50 backdrop-blur-2xl rounded-2xl shadow-lg border border-white/20 dark:border-white/10 h-full flex items-center justify-center overflow-hidden transition-all duration-300"
            style={{ 
                backgroundImage: motivationalImage ? `url(${motivationalImage})` : 'none',
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
             <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />
            {motivationalImage ? (
                <div 
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4 cursor-pointer" 
                    onClick={handleUploadClick}
                >
                    <button onClick={handleChangeImage} className="flex items-center bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm">
                        <Icon name="Edit" className="w-4 h-4 mr-2" />
                        Change
                    </button>
                    <button onClick={handleRemoveImage} className="flex items-center bg-red-500/50 text-white px-4 py-2 rounded-lg hover:bg-red-500/70 transition-colors backdrop-blur-sm">
                        <Icon name="Trash2" className="w-4 h-4 mr-2" />
                        Remove
                    </button>
                </div>
            ) : (
                <button onClick={handleUploadClick} className="p-6 text-center text-gray-400 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light transition-colors">
                    <Icon name="Image" className="w-12 h-12 mx-auto" />
                    <p className="mt-2 font-semibold">Upload a motivational picture</p>
                    <p className="text-xs">Show yourself what you're working for!</p>
                </button>
            )}
        </div>
    );
};

export default React.memo(MotivationWidget);
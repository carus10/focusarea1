

import React, { useState, useContext, useMemo } from 'react';
import Icon from '../components/Icon.tsx';
import { DataContext } from '../context/DataContext.tsx';
import { turkishWords as words } from '../data/words.ts';


const shuffle = (str: string) => [...str].sort(() => Math.random() - 0.5).join('');

const WordPuzzleGame: React.FC = () => {
    const { gameTickets, spendGameTicket, addOp } = useContext(DataContext);
    const [word, setWord] = useState('');
    const [scrambled, setScrambled] = useState('');
    const [guess, setGuess] = useState('');
    const [message, setMessage] = useState('');
    const [isGameActive, setIsGameActive] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);

    const startGame = () => {
        if (gameTickets < 1) {
            setMessage("Yeterli oyun biletin yok!");
            setIsGameActive(false);
            setIsGameOver(false);
            return;
        }
        spendGameTicket();
        const newWord = words[Math.floor(Math.random() * words.length)];
        setWord(newWord);
        setScrambled(shuffle(newWord));
        setIsGameActive(true);
        setIsGameOver(false);
        setGuess('');
        setMessage('');
    };

    const handleGuess = (e: React.FormEvent) => {
        e.preventDefault();
        if (guess.toLowerCase() === word.toLowerCase()) {
            setMessage('Tebrikler! +50 OP kazandın!');
            addOp(50);
            setIsGameActive(false);
            setIsGameOver(false);
        } else {
            setMessage(`Yanlış! Doğru kelime: ${word.toUpperCase()}`);
            setIsGameActive(false);
            setIsGameOver(true);
        }
    };
    
    const handleGiveUp = () => {
        setMessage(`Doğru kelime: ${word.toUpperCase()}`);
        setIsGameActive(false);
        setIsGameOver(true);
    };

    if (isGameActive) {
        return (
            <div className="text-center p-6 flex flex-col justify-center items-center h-full">
                <h3 className="text-xl font-bold mb-2">Kelimeyi Bul</h3>
                <p className="text-3xl font-bold tracking-widest my-4 p-2 bg-gray-500/10 rounded-lg">{scrambled.toUpperCase()}</p>
                <form onSubmit={handleGuess} className="flex gap-2 w-full max-w-xs mx-auto">
                    <input 
                        type="text" 
                        value={guess}
                        onChange={e => setGuess(e.target.value)}
                        className="flex-grow bg-gray-500/10 dark:bg-white/5 border-transparent rounded-md p-2 text-sm focus:ring-primary focus:border-primary text-center"
                        autoFocus
                    />
                    <button type="submit" className="bg-primary text-white p-2 rounded-md hover:bg-primary-hover px-4 font-semibold">
                        Dene
                    </button>
                </form>
                <button onClick={handleGiveUp} className="mt-4 bg-gray-500/20 text-gray-700 dark:text-gray-300 font-semibold px-4 py-2 rounded-lg hover:bg-gray-500/30 text-sm">
                    Bilmiyorum
                </button>
            </div>
        );
    }

    if (isGameOver) {
        return (
            <div className="text-center p-6 flex flex-col items-center justify-center h-full">
                <Icon name="HelpCircle" className="w-12 h-12 text-red-500 mx-auto mb-4"/>
                <h3 className="text-xl font-bold mb-2">Bilemedin!</h3>
                {message && <p className="mb-4 font-semibold text-lg text-red-400">{message}</p>}
                <button onClick={startGame} disabled={gameTickets < 1} className="bg-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-primary-hover disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center mx-auto">
                    <Icon name="Ticket" className="w-5 h-5 mr-2"/>
                    Tekrar Dene (1 Bilet)
                </button>
                 {gameTickets < 1 && <p className="text-xs text-red-400 mt-2">Yeterli biletin yok.</p>}
            </div>
        );
    }
    
    // Initial state or after a win
    return (
        <div className="text-center p-6 flex flex-col items-center justify-center h-full">
            <Icon name="FileText" className="w-12 h-12 text-primary mx-auto mb-4"/>
            <h3 className="text-xl font-bold mb-2">Kelime Bulmaca</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Karışık harflerden doğru kelimeyi bulabilir misin?</p>
            {message && <p className={`mb-4 font-semibold ${message.startsWith('Tebrikler') ? 'text-green-500' : 'text-red-500'}`}>{message}</p>}
            <button onClick={startGame} disabled={gameTickets < 1} className="bg-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-primary-hover disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center mx-auto">
                <Icon name="Ticket" className="w-5 h-5 mr-2"/>
                Oyna (1 Bilet)
            </button>
            {gameTickets < 1 && !message.startsWith('Tebrikler') && <p className="text-xs text-red-400 mt-2">Yeterli biletin yok.</p>}
        </div>
    );
};

const prizes = [
    { text: "+100 OP", value: 100, type: 'op', color: "#22c55e" },
    { text: "+1 Bilet", value: 1, type: 'ticket', color: "#818CF8" },
    { text: "Boş", value: 0, type: 'none', color: "#4B5563" },
    { text: "+2 Bilet", value: 2, type: 'ticket', color: "#6366F1" },
    { text: "+200 OP", value: 200, type: 'op', color: "#16a34a" },
    { text: "Boş", value: 0, type: 'none', color: "#4B5563" },
];

const WheelOfFortuneGame: React.FC = () => {
    const { wheelSpins, spendWheelSpin, addGameTickets, addOp } = useContext(DataContext);
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [result, setResult] = useState<string | null>(null);

    const spin = () => {
        if (wheelSpins < 1 || isSpinning) return;
        
        spendWheelSpin();
        setIsSpinning(true);
        setResult(null);

        const degreesPerSegment = 360 / prizes.length;
        // 1. Önce kazananı belirleyerek tutarlılığı sağla.
        const winningSegmentIndex = Math.floor(Math.random() * prizes.length);
        const winningPrize = prizes[winningSegmentIndex];

        // 2. İşaretçinin duracağı kesin açıyı hesapla.
        // Bu, kazanan dilimin sınırları içinde bir açı olmalı.
        const segmentStartAngle = winningSegmentIndex * degreesPerSegment;
        // Çizgilerin üzerine gelmemesi için rastgele bir sapma ekle.
        const randomOffset = (degreesPerSegment * 0.1) + (Math.random() * degreesPerSegment * 0.8);
        const targetAngleOnWheel = segmentStartAngle + randomOffset;
        
        // 3. Animasyon için gereken toplam dönüşü hesapla.
        // Mevcut dönüşün üzerine en az 5 tam tur ekleyerek ileriye doğru dönüş sağla.
        const revolutions = 5;
        const newRotation = (Math.ceil(rotation / 360) * 360) + (revolutions * 360) - targetAngleOnWheel;

        setRotation(newRotation);

        // 4. Animasyon süresinden sonra sonucu ayarla.
        setTimeout(() => {
            setIsSpinning(false);
            if (winningPrize.value > 0) {
                 setResult(`Kazandın: ${winningPrize.text}!`);
                if (winningPrize.type === 'ticket') {
                    addGameTickets(winningPrize.value);
                } else if (winningPrize.type === 'op') {
                    addOp(winningPrize.value);
                }
            } else {
                setResult("Bu sefer olmadı, tekrar dene!");
            }
        }, 4000); // CSS transition süresiyle eşleşmeli
    };

    return (
        <div className="flex flex-col items-center justify-center text-center p-6 h-full">
            <h3 className="text-xl font-bold mb-4">Çarkıfelek</h3>
            <div className="relative w-64 h-64 mb-4">
                <div 
                    className="absolute inset-0 rounded-full border-4 border-primary transition-transform duration-[4000ms] ease-out"
                    style={{ 
                        transform: `rotate(${rotation}deg)`,
                        background: `conic-gradient(${prizes.map((p, i) => `${p.color} ${i * (100 / prizes.length)}%, ${p.color} ${(i + 1) * (100 / prizes.length)}%`).join(', ')})`
                     }}
                >
                    {prizes.map((prize, i) => (
                         <div 
                            key={i} 
                            className="absolute w-1/2 h-1/2 top-0 left-1/2 origin-bottom-left flex items-center justify-center"
                            style={{ transform: `rotate(${i * (360 / prizes.length)}deg)`}}
                        >
                             <span 
                                className="text-white font-bold text-sm -rotate-90 translate-x-12"
                                style={{ transform: `rotate(${(360 / prizes.length / 2) - 90}deg) translateX(60px)` }}
                            >
                                {prize.text}
                            </span>
                         </div>
                    ))}
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white dark:bg-dark-surface rounded-full border-4 border-primary"></div>
                <div 
                    className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2"
                    style={{
                        width: 0,
                        height: 0,
                        borderLeft: '15px solid transparent',
                        borderRight: '15px solid transparent',
                        borderTop: '20px solid #F59E0B'
                    }}
                ></div>
            </div>
             {result && <p className="font-semibold text-lg text-primary mb-4">{result}</p>}
            <button onClick={spin} disabled={isSpinning || wheelSpins < 1} className="bg-yellow-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-yellow-600 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center">
                 <Icon name="RefreshCw" className={`w-5 h-5 mr-2 ${isSpinning ? 'animate-spin' : ''}`}/>
                Çevir (1 Hak)
            </button>
        </div>
    );
};


const ExerciseCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    details: string;
}> = ({ icon, title, description, details }) => (
    <div className="bg-light-card/60 dark:bg-dark-card/50 backdrop-blur-2xl rounded-2xl shadow-lg border border-white/20 dark:border-white/10 p-6 flex flex-col items-center text-center">
        <div className="mb-4">{icon}</div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{description}</p>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed">{details}</p>
    </div>
);

const Exercise: React.FC = () => {
    return (
        <div className="h-full overflow-y-auto -mr-4 pr-4">
            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 0.7; }
                    50% { transform: scale(1.1); opacity: 1; }
                }
                .animate-pulse-slow {
                    animation: pulse 4s ease-in-out infinite;
                }
            `}</style>
            <h1 className="text-2xl sm:text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-400 dark:to-violet-300">Yenilenme Alanı</h1>
            
            {/* --- Game Section --- */}
            <div className="mb-10">
                <h2 className="text-xl font-bold mb-4">Oyun Zamanı</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-light-card/60 dark:bg-dark-card/50 backdrop-blur-2xl rounded-2xl shadow-lg border border-white/20 dark:border-white/10 min-h-[300px]">
                        <WordPuzzleGame />
                    </div>
                    <div className="bg-light-card/60 dark:bg-dark-card/50 backdrop-blur-2xl rounded-2xl shadow-lg border border-white/20 dark:border-white/10 min-h-[300px]">
                        <WheelOfFortuneGame />
                    </div>
                </div>
            </div>

            {/* --- Exercise Section --- */}
            <div>
                 <h2 className="text-xl font-bold mb-4">Rahatlama Egzersizleri</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ExerciseCard
                        icon={<Icon name="Eye" className="w-12 h-12 text-primary" />}
                        title="Göz Dinlendirme"
                        description="20-20-20 Kuralı"
                        details="Ekran karşısında geçen her 20 dakikada bir, en az 20 saniye boyunca 20 fit (yaklaşık 6 metre) uzaktaki bir nesneye odaklanarak gözlerinizi dinlendirin. Bu, dijital göz yorgunluğunu azaltmaya yardımcı olur."
                    />
                    <ExerciseCard
                        icon={
                            <div className="relative w-12 h-12 flex items-center justify-center">
                                <div className="absolute w-full h-full bg-primary/30 rounded-full animate-pulse-slow"></div>
                                <Icon name="Wind" className="w-8 h-8 text-primary" />
                            </div>
                        }
                        title="Nefes Egzersizi"
                        description="4-7-8 Tekniği"
                        details="4 saniye boyunca burnunuzdan sakince nefes alın. Nefesinizi 7 saniye tutun. Son olarak, 8 saniye boyunca ağzınızdan yavaşça verin. Bu döngüyü 3-4 kez tekrarlayarak zihninizi sakinleştirin."
                    />
                     <ExerciseCard
                        icon={<Icon name="RefreshCw" className="w-12 h-12 text-primary" />}
                        title="Boyun Esnetme"
                        description="Nazik Hareketler"
                        details="Oturur pozisyonda, başınızı yavaşça sağ omzunuza doğru eğin ve 5 saniye bekleyin. Hareketi sol taraf için tekrarlayın. Ardından çenenizi göğsünüze yaklaştırın ve 5 saniye bekleyin. Bu, boyun gerginliğini alır."
                    />
                </div>
            </div>
        </div>
    );
};

export default Exercise;
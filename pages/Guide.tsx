import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Icon from '../components/Icon.tsx';
import { IconName } from '../types.ts';
import { staggerContainer, staggerItem } from '../utils/animations';

interface GuideSection {
  id: string;
  category: string;
  icon: IconName;
  title: string;
  content: string[];
  tips?: string[];
}

const guideData: GuideSection[] = [
  {
    id: 'pomodoro-basic',
    category: 'Temel Özellikler',
    icon: 'Play',
    title: 'Pomodoro Zamanlayıcı',
    content: [
      'Pomodoro tekniği, belirli bir süre odaklanma ve ardından kısa molalar ile verimliliğini artırır.',
      'Timer\'ı başlatmak için Play butonuna tıkla. İstersen tam ekran moduna geçebilirsin.',
      'Her odaklanma seansı sonunda ödüller kazanırsın: OP (Odak Puanı), Bilet ve Çark Hakkı.',
    ],
    tips: [
      '25 dakika odaklanma = 1 Bilet + 25 OP',
      '40+ dakika = 2 Bilet + 1 Çark Hakkı',
      '90+ dakika = 6 Bilet + 2 Çark Hakkı',
    ],
  },
  {
    id: 'pomodoro-profiles',
    category: 'Temel Özellikler',
    icon: 'Settings',
    title: 'Pomodoro Profilleri',
    content: [
      'Farklı çalışma tarzların için özel profiller oluşturabilirsin.',
      'Settings sayfasından "Pomodoro Profilleri" bölümüne git.',
      'Hazır profiller: Default (25-5-15), Derin Çalışma (90-15-30), Hızlı Sprint (15-5-10).',
      'Yeni profil oluştur butonuyla kendi profilini ekle ve istediğin zaman aktif profili değiştir.',
    ],
    tips: [
      'Timer aktifken profil değiştirirsen, yeni ayarlar sonraki seansta devreye girer',
    ],
  },
  {
    id: 'pomodoro-goals',
    category: 'Temel Özellikler',
    icon: 'Target',
    title: 'Hedef Belirleme',
    content: [
      'Günlük ve haftalık pomodoro hedefleri belirleyebilirsin.',
      'Pomodoro Widget\'ında "Hedef Ayarla" butonuna tıkla.',
      'Hedefini tamamladığında bonus ödüller kazanırsın!',
    ],
    tips: [
      'Günlük hedef tamamlama: +2 Bilet, +50 OP',
      'Haftalık hedef tamamlama: +5 Bilet, +2 Çark Hakkı, +200 OP',
    ],
  },
  {
    id: 'flow-mode',
    category: 'Temel Özellikler',
    icon: 'Sparkles',
    title: 'Akış Modu',
    content: [
      'Akış Modu, odaklanma seansın sırasında rastgele tetiklenen bir sürprizdir.',
      'Aktif olduğunda zamanlayıcına +10 dakika eklenir ve ekranda "Akıştasın" mesajı görünür.',
      'Bu özelliği Settings sayfasından açıp kapatabilirsin.',
    ],
    tips: [
      'Akış Modu, derin konsantrasyonunu bozmadan devam etmeni sağlar',
    ],
  },
  {
    id: 'op-system',
    category: 'Ödül Sistemi',
    icon: 'Star',
    title: 'OP (Odak Puanı) Sistemi',
    content: [
      'Her odaklandığın dakika için 1 OP kazanırsın.',
      'OP\'leri koleksiyon kartları açmak için kullanabilirsin.',
      'Kartların fiyatları nadirlik seviyesine göre değişir.',
    ],
    tips: [
      'Common kartlar: 50 OP',
      'Rare kartlar: 150 OP',
      'Epic kartlar: 300 OP',
    ],
  },
  {
    id: 'collection-cards',
    category: 'Ödül Sistemi',
    icon: 'Gift',
    title: 'Koleksiyon Kartları',
    content: [
      'Başarılarını temsil eden dijital kartlar topla.',
      'Nadirlik seviyeleri: Common, Rare, Epic, Legendary, Icon.',
      'Çoğu kartı OP ile açabilirsin. Legendary kartlar için özel bir mekanizma var.',
    ],
    tips: [
      'Koleksiyonum sayfasından kartlarını görüntüle',
      'Kart üzerine tıklayarak detaylarını gör',
    ],
  },
  {
    id: 'legendary-cards',
    category: 'Ödül Sistemi',
    icon: 'Award',
    title: 'Legendary Kart Açma',
    content: [
      'Legendary kartlar için 10 odaklanma seansı (her biri en az 20dk) tamamlaman gerekir.',
      'Koleksiyonum sayfasında ilerleme çubuğunu takip edebilirsin.',
      '10 seans tamamladığında, istediğin Legendary kartı seçip açabilirsin.',
    ],
    tips: [
      'Her 3 Legendary kart açtığında, bir Icon kartı açma hakkı kazanırsın!',
    ],
  },
  {
    id: 'icon-cards',
    category: 'Ödül Sistemi',
    icon: 'Star',
    title: 'Icon Kartlar',
    content: [
      'Icon kartlar en nadir seviyedeki kartlardır.',
      '3 Legendary kart açtığında, rastgele bir Icon kartı kazanma hakkı elde edersin.',
      'Koleksiyonum sayfasında "Icon Kartı Aç" butonu görünecektir.',
    ],
  },
  {
    id: 'word-game',
    category: 'Yenilenme Alanı',
    icon: 'CheckSquare',
    title: 'Kelime Bulmaca',
    content: [
      'Molalarında eğlenceli kelime bulmaca oyunu oyna.',
      '1 Bilet harcayarak oyuna başla.',
      'Verilen harflerden kelimeler oluştur ve OP kazan.',
      'Her doğru kelime için puan kazanırsın!',
    ],
    tips: [
      'Daha uzun kelimeler daha fazla puan getirir',
    ],
  },
  {
    id: 'wheel',
    category: 'Yenilenme Alanı',
    icon: 'RefreshCw',
    title: 'Çarkıfelek',
    content: [
      'Çark Haklarını kullanarak ödül çarkını çevir.',
      'Çarkta OP, Bilet ve Çark Hakkı kazanabilirsin.',
      'Şansını dene ve ekstra ödüller kazan!',
    ],
  },
  {
    id: 'exercises',
    category: 'Yenilenme Alanı',
    icon: 'Wind',
    title: 'Egzersizler',
    content: [
      'Molalarında göz, nefes ve boyun egzersizleri yap.',
      'Her egzersiz için adım adım talimatlar var.',
      'Fiziksel olarak rahatla ve yenilenmiş hisset.',
    ],
    tips: [
      'Düzenli egzersizler uzun vadede verimliliğini artırır',
    ],
  },
  {
    id: 'tasks',
    category: 'Üretkenlik Araçları',
    icon: 'CheckSquare',
    title: 'Görevler',
    content: [
      'Günlük işlerini Görevler bölümünde takip et.',
      'Yeni görev ekle, tamamla veya sil.',
      'Tamamlanan görevleri temizle butonuyla toplu sil.',
    ],
    tips: [
      'Görev tamamladığında bildirim alırsın',
    ],
  },
  {
    id: 'notes',
    category: 'Üretkenlik Araçları',
    icon: 'FileText',
    title: 'Notlar',
    content: [
      'Önemli bilgilerini klasörler halinde düzenle.',
      'Yeni klasör oluştur ve notlarını kategorize et.',
      'Her not için başlık ve içerik ekle.',
      'Notları klasörler arasında taşıyabilirsin.',
    ],
  },
  {
    id: 'lessons',
    category: 'Üretkenlik Araçları',
    icon: 'BookOpen',
    title: 'Dersler',
    content: [
      'Online kurslarını veya derslerini takip et.',
      'YouTube veya Udemy linklerini ekle.',
      'İlerleme yüzdesini güncelle.',
      'Her ders için özel notlar alabilirsin.',
    ],
  },
  {
    id: 'music',
    category: 'Üretkenlik Araçları',
    icon: 'Music',
    title: 'Müzik Çalar',
    content: [
      'Internet Archive üzerindeki müzik koleksiyonlarını çal.',
      'Koleksiyon URL\'sini yapıştır ve dinle.',
      'Favori koleksiyonlarını kaydet.',
      'My Music sayfasından kayıtlı playlistlerini yönet.',
    ],
    tips: [
      'Internet Archive\'da binlerce ücretsiz müzik koleksiyonu var',
    ],
  },
  {
    id: 'settings-background',
    category: 'Ayarlar',
    icon: 'Image',
    title: 'Arka Plan Özelleştirme',
    content: [
      'Settings sayfasından arka planını özelleştir.',
      'Kendi resmini yükle veya renk seç.',
      'Blur (bulanıklık) ve Brightness (parlaklık) ayarlarını değiştir.',
    ],
  },
  {
    id: 'settings-videos',
    category: 'Ayarlar',
    icon: 'Youtube',
    title: 'Motivasyon ve Ödül Videoları',
    content: [
      'Pomodoro öncesi motivasyon videoları ekle.',
      'Pomodoro sonrası ödül videoları ekle (Kedi, Araba, Motor, Anime, Hayvanlar).',
      'YouTube video linklerini yapıştır.',
      'Rastgele bir video önerilecektir.',
    ],
  },
  {
    id: 'pomodoro-history',
    category: 'İstatistikler',
    icon: 'BarChart',
    title: 'Pomodoro Geçmişi',
    content: [
      'Dashboard\'da Pomodoro Geçmişi grafiğini gör.',
      'Günlük, Haftalık veya Aylık görünüm seç.',
      'Toplam pomodoro sayısı ve dakikalarını takip et.',
      'En üretken günlerini keşfet.',
    ],
  },
];

const categories = Array.from(new Set(guideData.map(item => item.category)));

const Guide: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  const [openSections, setOpenSections] = useState<string[]>(['pomodoro-basic']);

  const filteredData = useMemo(() => {
    let filtered = guideData;

    // Category filter
    if (selectedCategory !== 'Tümü') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.title.toLowerCase().includes(query) ||
          item.content.some(c => c.toLowerCase().includes(query)) ||
          item.tips?.some(t => t.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  const toggleSection = (id: string) => {
    setOpenSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  return (
    <motion.div
      className="h-full overflow-y-auto pb-10"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <motion.h1
        className="text-2xl sm:text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-400 dark:to-violet-300"
        variants={staggerItem}
      >
        Nasıl Kullanılır
      </motion.h1>

      {/* Search Bar */}
      <motion.div className="mb-6" variants={staggerItem}>
        <div className="relative">
          <Icon
            name="Search"
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
          />
          <input
            type="text"
            placeholder="Özellik ara..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-light-card/60 dark:bg-dark-card/50 backdrop-blur-2xl rounded-xl border border-white/20 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </motion.div>

      {/* Category Filter */}
      <motion.div className="mb-6 flex flex-wrap gap-2" variants={staggerItem}>
        <button
          onClick={() => setSelectedCategory('Tümü')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedCategory === 'Tümü'
              ? 'bg-primary text-white'
              : 'bg-light-card/60 dark:bg-dark-card/50 hover:bg-primary/20'
          }`}
        >
          Tümü
        </button>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-primary text-white'
                : 'bg-light-card/60 dark:bg-dark-card/50 hover:bg-primary/20'
            }`}
          >
            {category}
          </button>
        ))}
      </motion.div>

      {/* Guide Sections */}
      <motion.div className="space-y-3" variants={staggerItem}>
        {filteredData.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Icon name="Search" className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aradığınız özellik bulunamadı.</p>
          </div>
        ) : (
          filteredData.map(section => {
            const isOpen = openSections.includes(section.id);
            return (
              <motion.div
                key={section.id}
                className="bg-light-card/60 dark:bg-dark-card/50 backdrop-blur-2xl rounded-xl border border-white/20 dark:border-white/10 overflow-hidden"
                variants={staggerItem}
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-500/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Icon name={section.icon} className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-lg">{section.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {section.category}
                      </p>
                    </div>
                  </div>
                  <Icon
                    name="ChevronDown"
                    className={`w-5 h-5 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? 'max-h-[1000px]' : 'max-h-0'
                  }`}
                >
                  <div className="p-4 pt-0 space-y-3">
                    {section.content.map((paragraph, idx) => (
                      <p
                        key={idx}
                        className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed"
                      >
                        {paragraph}
                      </p>
                    ))}

                    {section.tips && section.tips.length > 0 && (
                      <div className="mt-4 p-3 bg-primary/10 rounded-lg border-l-4 border-primary">
                        <p className="text-xs font-bold text-primary mb-2 flex items-center gap-1">
                          <Icon name="Sparkles" className="w-4 h-4" />
                          İpuçları
                        </p>
                        <ul className="space-y-1">
                          {section.tips.map((tip, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-gray-600 dark:text-gray-300 flex items-start gap-2"
                            >
                              <span className="text-primary mt-0.5">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </motion.div>
  );
};

export default Guide;

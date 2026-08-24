import { SubjectCategory } from '../entities/subject.entity';
import { TopicDifficulty } from '../entities/topic.entity';

export interface SeedTopic {
  code: string;
  name: string;
  orderIndex: number;
  estimatedHours: number;
  importanceWeight: number;
  difficulty: TopicDifficulty;
}

export interface SeedSubject {
  code: string;
  name: string;
  category: SubjectCategory;
  orderIndex: number;
  colorCode: string;
  iconName: string;
  topics: SeedTopic[];
}

export interface SeedSection {
  code: string;
  name: string;
  orderIndex: number;
  description: string;
  subjects: SeedSubject[];
}

export interface SeedExamVersion {
  version: string;
  displayName: string;
  validFrom: string;
  validTo: string;
  officialSourceUrl: string;
  verifiedAt: string;
  verifiedBy: string;
  isCurrent: boolean;
  sections: SeedSection[];
}

export interface SeedExam {
  code: string;
  name: string;
  nativeName: string;
  description: string;
  versions: SeedExamVersion[];
}

export interface SeedEducationSystem {
  code: string;
  name: string;
  nativeName: string;
  exams: SeedExam[];
}

export interface SeedCountry {
  code: string;
  name: string;
  nativeName: string;
  defaultTimezone: string;
  educationSystems: SeedEducationSystem[];
}

export const YKS_EXAM_PACK_DATA: SeedCountry = {
  code: 'TR',
  name: 'Turkey',
  nativeName: 'Türkiye',
  defaultTimezone: 'Europe/Istanbul',
  educationSystems: [
    {
      code: 'TR_YKS_SYSTEM',
      name: 'Turkish Higher Education Entrance System',
      nativeName: 'Yükseköğretim Kurumları Sınavı Sistemi',
      exams: [
        {
          code: 'YKS',
          name: 'Higher Education Institutions Examination',
          nativeName: 'Yükseköğretim Kurumları Sınavı (YKS)',
          description: 'Türkiye üniversite giriş sınavı (TYT, AYT, YDT oturumları).',
          versions: [
            {
              version: '2026-2027',
              displayName: '2026-2027 YKS Müfredatı',
              validFrom: '2026-09-01T00:00:00Z',
              validTo: '2027-08-31T23:59:59Z',
              officialSourceUrl: 'https://www.osym.gov.tr',
              verifiedAt: '2026-08-15T00:00:00Z',
              verifiedBy: 'ÖSYM & MEB Talim Terbiye Kurulu',
              isCurrent: true,
              sections: [
                {
                  code: 'TYT',
                  name: 'Temel Yeterlilik Testi',
                  orderIndex: 1,
                  description: 'Tüm adayların zorunlu olarak girdiği 1. oturum testi.',
                  subjects: [
                    {
                      code: 'TYT_TURKCE',
                      name: 'TYT Türkçe',
                      category: SubjectCategory.LANGUAGE_LITERATURE,
                      orderIndex: 1,
                      colorCode: '#EF4444',
                      iconName: 'book-open',
                      topics: [
                        { code: 'TYT_TR_SOZCUK_ANLAM', name: 'Sözcükte Anlam', orderIndex: 1, estimatedHours: 3, importanceWeight: 4, difficulty: TopicDifficulty.EASY },
                        { code: 'TYT_TR_CUMLE_ANLAM', name: 'Cümlede Anlam', orderIndex: 2, estimatedHours: 4, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'TYT_TR_PARAGRAF', name: 'Paragrafta Anlam ve Yapı', orderIndex: 3, estimatedHours: 12, importanceWeight: 5, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'TYT_TR_SES_BILGISI', name: 'Ses Bilgisi', orderIndex: 4, estimatedHours: 3, importanceWeight: 3, difficulty: TopicDifficulty.EASY },
                        { code: 'TYT_TR_YAZIM_NOKTALAMA', name: 'Yazım Kuralları ve Noktalama', orderIndex: 5, estimatedHours: 4, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'TYT_TR_SOZCUK_TURU', name: 'Sözcük Türleri (İsim, Sıfat, Zamir, Zarf vb.)', orderIndex: 6, estimatedHours: 6, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'TYT_TR_CUMLE_OGELERI', name: 'Cümlenin Ögeleri', orderIndex: 7, estimatedHours: 3, importanceWeight: 3, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'TYT_TR_ANLATIM_BOZUKLUGU', name: 'Anlatım Bozukluğu', orderIndex: 8, estimatedHours: 2, importanceWeight: 2, difficulty: TopicDifficulty.HARD },
                      ],
                    },
                    {
                      code: 'TYT_MATEMATIK',
                      name: 'TYT Matematik',
                      category: SubjectCategory.MATHEMATICS,
                      orderIndex: 2,
                      colorCode: '#3B82F6',
                      iconName: 'calculator',
                      topics: [
                        { code: 'TYT_MAT_TEMEL_KAVRAMLAR', name: 'Temel Kavramlar ve Sayı Basamakları', orderIndex: 1, estimatedHours: 6, importanceWeight: 5, difficulty: TopicDifficulty.EASY },
                        { code: 'TYT_MAT_BOLME_BOLUNEBILME', name: 'Bölme ve Bölünebilme Kuralları', orderIndex: 2, estimatedHours: 4, importanceWeight: 3, difficulty: TopicDifficulty.EASY },
                        { code: 'TYT_MAT_EBOB_EKOK', name: 'EBOB ve EKOK', orderIndex: 3, estimatedHours: 4, importanceWeight: 3, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'TYT_MAT_RASYONEL_SAYILAR', name: 'Rasyonel Sayılar ve Ondalık Gösterim', orderIndex: 4, estimatedHours: 3, importanceWeight: 3, difficulty: TopicDifficulty.EASY },
                        { code: 'TYT_MAT_BASIT_ESITSIZLIK', name: 'Basit Eşitsizlikler ve Mutlak Değer', orderIndex: 5, estimatedHours: 5, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'TYT_MAT_USLU_KOKLU', name: 'Üslü ve Köklü İfadeler', orderIndex: 6, estimatedHours: 6, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'TYT_MAT_CARPANLARA_AYIRMA', name: 'Çarpanlara Ayırma', orderIndex: 7, estimatedHours: 5, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'TYT_MAT_ORAN_ORANTI', name: 'Oran ve Orantı', orderIndex: 8, estimatedHours: 3, importanceWeight: 3, difficulty: TopicDifficulty.EASY },
                        { code: 'TYT_MAT_PROBLEMLER', name: 'Sayı, Kesir, Yaş, Yüzde, Hız ve Grafik Problemleri', orderIndex: 9, estimatedHours: 16, importanceWeight: 5, difficulty: TopicDifficulty.HARD },
                        { code: 'TYT_MAT_KUMELER', name: 'Kümeler ve Kartezyen Çarpım', orderIndex: 10, estimatedHours: 4, importanceWeight: 3, difficulty: TopicDifficulty.EASY },
                        { code: 'TYT_MAT_FONKSIYONLAR', name: 'Fonksiyonlar (Temel)', orderIndex: 11, estimatedHours: 6, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'TYT_MAT_PKOB', name: 'Permütasyon, Kombinasyon, Binom ve Olasılık', orderIndex: 12, estimatedHours: 6, importanceWeight: 4, difficulty: TopicDifficulty.HARD },
                        { code: 'TYT_MAT_ISTATISTIK', name: 'İstatistik ve Veri Analizi', orderIndex: 13, estimatedHours: 3, importanceWeight: 2, difficulty: TopicDifficulty.EASY },
                      ],
                    },
                    {
                      code: 'TYT_GEOMETRI',
                      name: 'TYT-AYT Geometri',
                      category: SubjectCategory.MATHEMATICS,
                      orderIndex: 3,
                      colorCode: '#06B6D4',
                      iconName: 'shapes',
                      topics: [
                        { code: 'GEO_DOGRUDACIDA', name: 'Doğruda ve Üçgende Açılar', orderIndex: 1, estimatedHours: 5, importanceWeight: 4, difficulty: TopicDifficulty.EASY },
                        { code: 'GEO_OZEL_UCGENLER', name: 'Özel Üçgenler (Dik, İkizkenar, Eşkenar)', orderIndex: 2, estimatedHours: 6, importanceWeight: 5, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'GEO_UCGENDE_ALAN_BENZERLIK', name: 'Üçgende Benzerlik ve Alan', orderIndex: 3, estimatedHours: 7, importanceWeight: 5, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'GEO_COKGEN_DORTGEN', name: 'Çokgenler ve Dörtgenler (Paralelkenar, Eşkenar, Yamuk)', orderIndex: 4, estimatedHours: 8, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'GEO_CEMBER_DAIRE', name: 'Çemberde Açı, Uzunluk ve Dairede Alan', orderIndex: 5, estimatedHours: 7, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'GEO_KATI_CISIMLER', name: 'Katı Cisimler (Prizma, Piramit, Koni, Küre)', orderIndex: 6, estimatedHours: 6, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'GEO_ANALITIK', name: 'Noktanın ve Doğrunun Analitik İncelenmesi', orderIndex: 7, estimatedHours: 6, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                      ],
                    },
                    {
                      code: 'TYT_FIZIK',
                      name: 'TYT Fizik',
                      category: SubjectCategory.NATURAL_SCIENCES,
                      orderIndex: 4,
                      colorCode: '#8B5CF6',
                      iconName: 'flash',
                      topics: [
                        { code: 'TYT_FIZ_BILIM_GIRIS', name: 'Fizik Bilimine Giriş ve Madde ve Özellikleri', orderIndex: 1, estimatedHours: 3, importanceWeight: 3, difficulty: TopicDifficulty.EASY },
                        { code: 'TYT_FIZ_HAREKET_KUVVET', name: 'Kuvvet ve Hareket', orderIndex: 2, estimatedHours: 5, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'TYT_FIZ_ENERJI', name: 'İş, Güç ve Enerji', orderIndex: 3, estimatedHours: 4, importanceWeight: 3, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'TYT_FIZ_ISI_SICAKLIK', name: 'Isı, Sıcaklık ve Genleşme', orderIndex: 4, estimatedHours: 5, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'TYT_FIZ_ELEKTROSTATIK_ELEKTRIK', name: 'Elektrostatik ve Elektrik Akımı', orderIndex: 5, estimatedHours: 5, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'TYT_FIZ_OPTIK', name: 'Optik (Aynalar, Kırılma, Mercekler, Renk)', orderIndex: 6, estimatedHours: 7, importanceWeight: 5, difficulty: TopicDifficulty.HARD },
                        { code: 'TYT_FIZ_DALGALAR', name: 'Dalgalar (Yay, Su, Ses, Deprem)', orderIndex: 7, estimatedHours: 4, importanceWeight: 3, difficulty: TopicDifficulty.MEDIUM },
                      ],
                    },
                    {
                      code: 'TYT_KIMYA',
                      name: 'TYT Kimya',
                      category: SubjectCategory.NATURAL_SCIENCES,
                      orderIndex: 5,
                      colorCode: '#10B981',
                      iconName: 'flask',
                      topics: [
                        { code: 'TYT_KIM_BILIM_GIRIS', name: 'Kimya Bilimi', orderIndex: 1, estimatedHours: 2, importanceWeight: 3, difficulty: TopicDifficulty.EASY },
                        { code: 'TYT_KIM_ATOM_PERIYODIK', name: 'Atom ve Periyodik Sistem', orderIndex: 2, estimatedHours: 5, importanceWeight: 5, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'TYT_KIM_TUR_ETKILESIM', name: 'Kimyasal Türler Arası Etkileşimler', orderIndex: 3, estimatedHours: 5, importanceWeight: 5, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'TYT_KIM_MADDENIN_HALLERI', name: 'Maddenin Halleri', orderIndex: 4, estimatedHours: 3, importanceWeight: 3, difficulty: TopicDifficulty.EASY },
                        { code: 'TYT_KIM_HESAPLAMALAR', name: 'Kimyanın Temel Kanunları ve Kimyasal Hesaplamalar', orderIndex: 5, estimatedHours: 6, importanceWeight: 4, difficulty: TopicDifficulty.HARD },
                        { code: 'TYT_KIM_KARISIMLAR', name: 'Karışımlar', orderIndex: 6, estimatedHours: 4, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'TYT_KIM_ASIT_BAZ_TUZ', name: 'Asitler, Bazlar ve Tuzlar', orderIndex: 7, estimatedHours: 4, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'TYT_KIM_HER_YERDE_KIMYA', name: 'Kimya Her Yerde', orderIndex: 8, estimatedHours: 2, importanceWeight: 2, difficulty: TopicDifficulty.EASY },
                      ],
                    },
                    {
                      code: 'TYT_BIYOLOJI',
                      name: 'TYT Biyoloji',
                      category: SubjectCategory.NATURAL_SCIENCES,
                      orderIndex: 6,
                      colorCode: '#14B8A6',
                      iconName: 'leaf',
                      topics: [
                        { code: 'TYT_BIY_YASAM_BILIMI', name: 'Yaşam Bilimi Biyoloji ve Canlıların Temel Bileşenleri', orderIndex: 1, estimatedHours: 5, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'TYT_BIY_HUCRE', name: 'Hücre ve Organelleri', orderIndex: 2, estimatedHours: 5, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'TYT_BIY_SINIFLANDIRMA', name: 'Canlıların Çeşitliliği ve Sınıflandırılması', orderIndex: 3, estimatedHours: 4, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'TYT_BIY_BOLUNMELER', name: 'Hücre Bölünmeleri (Mitoz - Mayoz)', orderIndex: 4, estimatedHours: 4, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'TYT_BIY_KALITIM', name: 'Kalıtımın Genel Esasları', orderIndex: 5, estimatedHours: 6, importanceWeight: 5, difficulty: TopicDifficulty.HARD },
                        { code: 'TYT_BIY_EKOLOJI', name: 'Ekosistem Ekolojisi ve Güncel Çevre Sorunları', orderIndex: 6, estimatedHours: 4, importanceWeight: 4, difficulty: TopicDifficulty.EASY },
                      ],
                    },
                    {
                      code: 'TYT_TARIH',
                      name: 'TYT Tarih',
                      category: SubjectCategory.SOCIAL_SCIENCES,
                      orderIndex: 7,
                      colorCode: '#F59E0B',
                      iconName: 'compass',
                      topics: [
                        { code: 'TYT_TAR_GIRIS_ILK_CAG', name: 'Tarih ve Zaman, İlk ve Orta Çağlarda Türk Dünyası', orderIndex: 1, estimatedHours: 4, importanceWeight: 4, difficulty: TopicDifficulty.EASY },
                        { code: 'TYT_TAR_ISLAM_TARIHI', name: 'İslam Medeniyetinin Doğuşu ve İlk Türk-İslam Devletleri', orderIndex: 2, estimatedHours: 4, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'TYT_TAR_OSMANLI_KURULUS_YUKSELIS', name: 'Yerleşme ve Devletleşme Sürecinde Selçuklu ve Osmanlı', orderIndex: 3, estimatedHours: 6, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'TYT_TAR_INKILAP_MILLI_MUCADELE', name: 'Milli Mücadele Dönemi ve Atatürkçülük', orderIndex: 4, estimatedHours: 8, importanceWeight: 5, difficulty: TopicDifficulty.MEDIUM },
                      ],
                    },
                    {
                      code: 'TYT_COGRAFYA',
                      name: 'TYT Coğrafya',
                      category: SubjectCategory.SOCIAL_SCIENCES,
                      orderIndex: 8,
                      colorCode: '#10B981',
                      iconName: 'globe',
                      topics: [
                        { code: 'TYT_COG_DOGA_INSAN', name: 'Doğa ve İnsan, Harita Bilgisi', orderIndex: 1, estimatedHours: 4, importanceWeight: 4, difficulty: TopicDifficulty.EASY },
                        { code: 'TYT_COG_DUNYANIN_SEKLI', name: 'Dünyanın Şekli, Hareketleri ve İklim Bilgisi', orderIndex: 2, estimatedHours: 6, importanceWeight: 5, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'TYT_COG_YERIN_SEKILLENMESI', name: 'İç ve Dış Kuvvetler, Yerin Şekillenmesi', orderIndex: 3, estimatedHours: 5, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'TYT_COG_NUFUS_YERLESME', name: 'Nüfus, Yerleşme ve Ekonomik Faaliyetler', orderIndex: 4, estimatedHours: 4, importanceWeight: 4, difficulty: TopicDifficulty.EASY },
                        { code: 'TYT_COG_AFETLER', name: 'Doğal Afetler ve Çevre', orderIndex: 5, estimatedHours: 3, importanceWeight: 3, difficulty: TopicDifficulty.EASY },
                      ],
                    },
                    {
                      code: 'TYT_FELSEFE_DIN',
                      name: 'TYT Felsefe & Din Kültürü',
                      category: SubjectCategory.SOCIAL_SCIENCES,
                      orderIndex: 9,
                      colorCode: '#A855F7',
                      iconName: 'heart',
                      topics: [
                        { code: 'TYT_FEL_TEMEL_KAVRAMLAR', name: 'Felsefenin Alanı, Bilgi, Varlık ve Ahlak Felsefesi', orderIndex: 1, estimatedHours: 5, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'TYT_DIN_INANC_IBADET', name: 'İslam ve İbadet, Ahlak ve Değerler', orderIndex: 2, estimatedHours: 3, importanceWeight: 3, difficulty: TopicDifficulty.EASY },
                      ],
                    },
                  ],
                },
                {
                  code: 'AYT_SAYISAL',
                  name: 'AYT Sayısal Oturumu',
                  orderIndex: 2,
                  description: 'Sayısal puan türü hedefleyen adayların girdiği 2. oturum alanı.',
                  subjects: [
                    {
                      code: 'AYT_MATEMATIK',
                      name: 'AYT İleri Matematik',
                      category: SubjectCategory.MATHEMATICS,
                      orderIndex: 1,
                      colorCode: '#1E40AF',
                      iconName: 'calculator',
                      topics: [
                        { code: 'AYT_MAT_POLINOMLAR', name: 'Polinomlar ve 2. Dereceden Denklemler', orderIndex: 1, estimatedHours: 6, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'AYT_MAT_PARABOL_ESITSIZLIK', name: 'Parabol ve Eşitsizlik Sistemleri', orderIndex: 2, estimatedHours: 6, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'AYT_MAT_TRIGONOMETRI', name: 'Trigonometri (Temel & İleri)', orderIndex: 3, estimatedHours: 12, importanceWeight: 5, difficulty: TopicDifficulty.HARD },
                        { code: 'AYT_MAT_LOGARITMA', name: 'Logaritma', orderIndex: 4, estimatedHours: 6, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'AYT_MAT_DIZILER', name: 'Diziler ve Seriler', orderIndex: 5, estimatedHours: 5, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'AYT_MAT_LIMIT_SUREKLILIK', name: 'Limit ve Süreklilik', orderIndex: 6, estimatedHours: 6, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'AYT_MAT_TUREV', name: 'Türev ve Uygulamaları', orderIndex: 7, estimatedHours: 14, importanceWeight: 5, difficulty: TopicDifficulty.HARD },
                        { code: 'AYT_MAT_INTEGRAL', name: 'İntegral ve Uygulamaları', orderIndex: 8, estimatedHours: 14, importanceWeight: 5, difficulty: TopicDifficulty.HARD },
                      ],
                    },
                    {
                      code: 'AYT_FIZIK',
                      name: 'AYT Fizik',
                      category: SubjectCategory.NATURAL_SCIENCES,
                      orderIndex: 2,
                      colorCode: '#6D28D9',
                      iconName: 'flash',
                      topics: [
                        { code: 'AYT_FIZ_VEKTOR_BAGIL', name: 'Vektörler ve Bağıl Hareket', orderIndex: 1, estimatedHours: 4, importanceWeight: 3, difficulty: TopicDifficulty.EASY },
                        { code: 'AYT_FIZ_NEWTON_ATIŞLAR', name: 'Newton Hareket Yasaları ve Atışlar', orderIndex: 2, estimatedHours: 6, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'AYT_FIZ_IMPULS_MOMENTUM', name: 'İtme ve Çizgisel Momentum', orderIndex: 3, estimatedHours: 5, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'AYT_FIZ_TORK_DENGE', name: 'Tork, Denge ve Basit Makineler', orderIndex: 4, estimatedHours: 5, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'AYT_FIZ_ELEKTRIK_MANYETIZMA', name: 'Elektrik Alan, Potansiyel, Manyetizma ve İndüksiyon', orderIndex: 5, estimatedHours: 10, importanceWeight: 5, difficulty: TopicDifficulty.HARD },
                        { code: 'AYT_FIZ_CEMBERSAL_HARMONIK', name: 'Düzgün Çembersel Hareket ve Basit Harmonik Hareket', orderIndex: 6, estimatedHours: 7, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'AYT_FIZ_MODERN_FIZIK', name: 'Dalga Mekaniği, Atom Fiziği ve Modern Fizik', orderIndex: 7, estimatedHours: 8, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                      ],
                    },
                    {
                      code: 'AYT_KIMYA',
                      name: 'AYT Kimya',
                      category: SubjectCategory.NATURAL_SCIENCES,
                      orderIndex: 3,
                      colorCode: '#047857',
                      iconName: 'flask',
                      topics: [
                        { code: 'AYT_KIM_MODERN_ATOM_GAZLAR', name: 'Modern Atom Teorisi ve Gazlar', orderIndex: 1, estimatedHours: 6, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'AYT_KIM_SIVI_COZELTILER', name: 'Sıvı Çözeltiler ve Koligatif Özellikler', orderIndex: 2, estimatedHours: 5, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'AYT_KIM_ENERJI_HIZ', name: 'Kimyasal Tepkimelerde Enerji ve Hız', orderIndex: 3, estimatedHours: 5, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'AYT_KIM_DENGE_ASIT_BAZ', name: 'Kimyasal Denge ve Sulu Çözelti Dengeleri (Asit-Baz/Çözünürlük)', orderIndex: 4, estimatedHours: 8, importanceWeight: 5, difficulty: TopicDifficulty.HARD },
                        { code: 'AYT_KIM_ELEKTROKIMYA', name: 'Kimya ve Elektrik (Redoks, Piller, Elektroliz)', orderIndex: 5, estimatedHours: 7, importanceWeight: 5, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'AYT_KIM_ORGANIK', name: 'Organik Kimyaya Giriş ve Organik Bileşikler', orderIndex: 6, estimatedHours: 12, importanceWeight: 5, difficulty: TopicDifficulty.HARD },
                      ],
                    },
                    {
                      code: 'AYT_BIYOLOJI',
                      name: 'AYT Biyoloji',
                      category: SubjectCategory.NATURAL_SCIENCES,
                      orderIndex: 4,
                      colorCode: '#0F766E',
                      iconName: 'leaf',
                      topics: [
                        { code: 'AYT_BIY_DENETLEYICI_DUYU', name: 'Sinir Sistemi, Endokrin Sistem ve Duyu Organları', orderIndex: 1, estimatedHours: 7, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'AYT_BIY_DESTEK_SINDIRIM_DOLASIM', name: 'Destek-Hareket, Sindirim, Dolaşım ve Bağışıklık', orderIndex: 2, estimatedHours: 8, importanceWeight: 5, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'AYT_BIY_SOLUNUM_BOSALTIM_UREME', name: 'Solunum, Boşaltım ve Üreme Sistemleri', orderIndex: 3, estimatedHours: 7, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'AYT_BIY_GENDEN_PROTEINE', name: 'Genden Proteine (DNA, RNA, Protein Sentezi)', orderIndex: 4, estimatedHours: 7, importanceWeight: 5, difficulty: TopicDifficulty.HARD },
                        { code: 'AYT_BIY_ENERJI_DONUSUMLERI', name: 'Canlılarda Enerji Dönüşümleri (Fotosentez, Kemosentez, Hücresel Solunum)', orderIndex: 5, estimatedHours: 7, importanceWeight: 5, difficulty: TopicDifficulty.HARD },
                        { code: 'AYT_BIY_BITKI_EKOLOJI', name: 'Bitki Biyolojisi ve Çevre/Popülasyon Ekolojisi', orderIndex: 6, estimatedHours: 8, importanceWeight: 5, difficulty: TopicDifficulty.MEDIUM },
                      ],
                    },
                  ],
                },
                {
                  code: 'AYT_ESIT_AGIRLIK',
                  name: 'AYT Eşit Ağırlık / Sözel Oturumu',
                  orderIndex: 3,
                  description: 'Eşit Ağırlık ve Sözel alanları için Türk Dili ve Edebiyatı ile Sosyal Bilimler konuları.',
                  subjects: [
                    {
                      code: 'AYT_EDEBIYAT',
                      name: 'AYT Türk Dili ve Edebiyatı',
                      category: SubjectCategory.LANGUAGE_LITERATURE,
                      orderIndex: 1,
                      colorCode: '#B91C1C',
                      iconName: 'book',
                      topics: [
                        { code: 'AYT_EDB_GUZEL_SANATLAR_SIIR', name: 'Şiir Bilgisi, Edebi Sanatlar ve Nazım Şekilleri', orderIndex: 1, estimatedHours: 7, importanceWeight: 5, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'AYT_EDB_ISLAMIYET_ONCESI_HALK', name: 'İslamiyet Öncesi, Geçiş Dönemi ve Halk Edebiyatı', orderIndex: 2, estimatedHours: 6, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'AYT_EDB_DIVAN', name: 'Divan Edebiyatı ve Sanatçıları', orderIndex: 3, estimatedHours: 8, importanceWeight: 5, difficulty: TopicDifficulty.HARD },
                        { code: 'AYT_EDB_TANZIMAT_SERVETIFUNUN', name: 'Tanzimat, Servet-i Fünun ve Fecr-i Ati Edebiyatı', orderIndex: 4, estimatedHours: 7, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'AYT_EDB_MILLI_CUMHURIYET', name: 'Milli Edebiyat ve Cumhuriyet Dönemi Türk Edebiyatı', orderIndex: 5, estimatedHours: 12, importanceWeight: 5, difficulty: TopicDifficulty.HARD },
                        { code: 'AYT_EDB_EDEBİ_AKIMLAR', name: 'Edebi Akımlar ve Dünya Edebiyatı', orderIndex: 6, estimatedHours: 3, importanceWeight: 3, difficulty: TopicDifficulty.EASY },
                      ],
                    },
                    {
                      code: 'AYT_TARIH_1_2',
                      name: 'AYT Tarih',
                      category: SubjectCategory.SOCIAL_SCIENCES,
                      orderIndex: 2,
                      colorCode: '#D97706',
                      iconName: 'compass',
                      topics: [
                        { code: 'AYT_TAR_OSMANLI_DETAY', name: 'Osmanlı Diplomasi, Kültür ve Medeniyet', orderIndex: 1, estimatedHours: 6, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'AYT_TAR_20YY_DUNYA_SAVASLARI', name: '20. Yüzyıl Başlarında Dünya ve İnkılap Tarihi Derinlik', orderIndex: 2, estimatedHours: 8, importanceWeight: 5, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'AYT_TAR_CAGDAS_TURK_DUNYA', name: 'Çağdaş Türk ve Dünya Tarihi', orderIndex: 3, estimatedHours: 6, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                      ],
                    },
                    {
                      code: 'AYT_COGRAFYA_1_2',
                      name: 'AYT Coğrafya',
                      category: SubjectCategory.SOCIAL_SCIENCES,
                      orderIndex: 3,
                      colorCode: '#059669',
                      iconName: 'globe',
                      topics: [
                        { code: 'AYT_COG_EKOSISTEM_BIYOM', name: 'Ekosistem, Biyoçeşitlilik ve Madde Döngüleri', orderIndex: 1, estimatedHours: 4, importanceWeight: 4, difficulty: TopicDifficulty.EASY },
                        { code: 'AYT_COG_TURKIYE_EKONOMISI', name: 'Türkiye’de Nüfus, Tarım, Hayvancılık, Sanayi ve Madenler', orderIndex: 2, estimatedHours: 6, importanceWeight: 5, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'AYT_COG_KURESEL_ORTAM_BOLGELER', name: 'Küresel Ticaret, Turizm, Çevre ve Bölgeler', orderIndex: 3, estimatedHours: 5, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                      ],
                    },
                  ],
                },
                {
                  code: 'YDT_DIL',
                  name: 'Yabancı Dil Testi (YDT)',
                  orderIndex: 4,
                  description: 'Yabancı Dil puan türü hedefleyen adayların girdiği 3. oturum.',
                  subjects: [
                    {
                      code: 'YDT_INGILIZCE',
                      name: 'YDT İngilizce',
                      category: SubjectCategory.FOREIGN_LANGUAGE,
                      orderIndex: 1,
                      colorCode: '#2563EB',
                      iconName: 'language',
                      topics: [
                        { code: 'YDT_ING_VOCABULARY_PHRASAL', name: 'Vocabulary, Idioms and Phrasal Verbs', orderIndex: 1, estimatedHours: 12, importanceWeight: 5, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'YDT_ING_GRAMMAR_ADVANCED', name: 'Advanced Grammar & Clause Structures', orderIndex: 2, estimatedHours: 10, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                        { code: 'YDT_ING_READING_PASSAGES', name: 'Reading Comprehension & Paragraph Strategies', orderIndex: 3, estimatedHours: 15, importanceWeight: 5, difficulty: TopicDifficulty.HARD },
                        { code: 'YDT_ING_TRANSLATION_DIALOGUE', name: 'Translation, Dialogue and Restatement Skills', orderIndex: 4, estimatedHours: 8, importanceWeight: 4, difficulty: TopicDifficulty.MEDIUM },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

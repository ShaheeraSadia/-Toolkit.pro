import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type LanguageCode = "en" | "es" | "fr" | "de" | "ja" | "zh" | "ar" | "hi" | "pt" | "it";

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  dir?: "ltr" | "rtl";
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸", dir: "ltr" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", dir: "ltr" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", dir: "ltr" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", dir: "ltr" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵", dir: "ltr" },
  { code: "zh", name: "Chinese", nativeName: "中文 (简体)", flag: "🇨🇳", dir: "ltr" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", dir: "rtl" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳", dir: "ltr" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷", dir: "ltr" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹", dir: "ltr" }
];

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    app_title: "Toolkit Pro",
    app_tagline: "All-in-One AI & Digital Creation Suite",
    home: "Home",
    quote_designer: "Quote Designer",
    image_compressor: "Image Compressor",
    qr_generator: "QR Generator",
    color_extractor: "Color Extractor",
    video_creator: "Video Creator",
    android_studio: "Android App Studio",
    pdf_tools: "PDF Tools Suite",
    image_converter: "Image Converter",
    bg_remover: "Background Remover",
    ai_chatbot: "AI Chatbot",
    voice_studio: "Voice Studio",
    guides: "Guides",
    compliance: "Compliance",
    my_drive: "My Drive",
    search_placeholder: "Search tools, templates, guides (Ctrl+K)...",
    search_short: "Search...",
    install_app: "Install App",
    language: "Language",
    select_language: "Select Language",
    cloud_active: "Cloud Active",
    local_sync: "Local Sync",
    theme_light: "Light Mode",
    theme_dark: "Dark Mode",
    high_contrast: "High Contrast",
    tooltips: "Tooltips",
    settings: "Settings",
    seo_audit: "SEO Audit",
    ai_keys: "AI Keys",
    export: "Export",
    save_project: "Save Project",
    clear: "Clear",
    reset: "Reset",
    recent_activities: "Recent Activities",
    pro_tier: "PRO Tier",
    all_tools: "All Tools",
    no_projects_found: "No matching projects found",
    quick_start: "Quick Start Workspace",
    created_with: "Powered by Google AI Studio",
  },
  es: {
    app_title: "Toolkit Pro",
    app_tagline: "Suite completa de creación digital e IA",
    home: "Inicio",
    quote_designer: "Diseñador de Citas",
    image_compressor: "Compresor de Imágenes",
    qr_generator: "Generador QR",
    color_extractor: "Extractor de Color",
    video_creator: "Creador de Video",
    android_studio: "Estudio App Android",
    pdf_tools: "Herramientas PDF",
    image_converter: "Convertidor de Imagen",
    bg_remover: "Eliminador de Fondo",
    ai_chatbot: "Chatbot IA",
    voice_studio: "Estudio de Voz",
    guides: "Guías",
    compliance: "Cumplimiento",
    my_drive: "Mi Unidad",
    search_placeholder: "Buscar herramientas, plantillas, guías (Ctrl+K)...",
    search_short: "Buscar...",
    install_app: "Instalar App",
    language: "Idioma",
    select_language: "Seleccionar Idioma",
    cloud_active: "Nube Activa",
    local_sync: "Sinc. Local",
    theme_light: "Modo Claro",
    theme_dark: "Modo Oscuro",
    high_contrast: "Alto Contraste",
    tooltips: "Sugerencias",
    settings: "Ajustes",
    seo_audit: "Auditoría SEO",
    ai_keys: "Claves IA",
    export: "Exportar",
    save_project: "Guardar Proyecto",
    clear: "Limpiar",
    reset: "Restablecer",
    recent_activities: "Actividades Recientes",
    pro_tier: "Nivel PRO",
    all_tools: "Todas las Herramientas",
    no_projects_found: "No se encontraron proyectos",
    quick_start: "Espacio de Inicio Rápido",
    created_with: "Desarrollado con Google AI Studio",
  },
  fr: {
    app_title: "Toolkit Pro",
    app_tagline: "Suite complète de création numérique et IA",
    home: "Accueil",
    quote_designer: "Créateur de Citations",
    image_compressor: "Compresseur d'Images",
    qr_generator: "Générateur QR",
    color_extractor: "Extracteur de Couleur",
    video_creator: "Créateur de Vidéo",
    android_studio: "Android App Studio",
    pdf_tools: "Outils PDF",
    image_converter: "Convertisseur d'Image",
    bg_remover: "Effaceur d'Arrière-plan",
    ai_chatbot: "Chatbot IA",
    voice_studio: "Studio Vocal",
    guides: "Guides",
    compliance: "Conformité",
    my_drive: "Mon Drive",
    search_placeholder: "Rechercher outils, modèles, guides (Ctrl+K)...",
    search_short: "Recherche...",
    install_app: "Installer l'App",
    language: "Langue",
    select_language: "Choisir la Langue",
    cloud_active: "Nuage Actif",
    local_sync: "Sync Locale",
    theme_light: "Mode Clair",
    theme_dark: "Mode Sombre",
    high_contrast: "Haut Contraste",
    tooltips: "Info-bulles",
    settings: "Paramètres",
    seo_audit: "Audit SEO",
    ai_keys: "Clés IA",
    export: "Exporter",
    save_project: "Enregistrer Projet",
    clear: "Effacer",
    reset: "Réinitialiser",
    recent_activities: "Activités Récentes",
    pro_tier: "Niveau PRO",
    all_tools: "Tous les Outils",
    no_projects_found: "Aucun projet trouvé",
    quick_start: "Espace de Démarrage Rapide",
    created_with: "Propulsé par Google AI Studio",
  },
  de: {
    app_title: "Toolkit Pro",
    app_tagline: "Alles-in-Einem KI & Digitale Erstellungs-Suite",
    home: "Startseite",
    quote_designer: "Zitate-Designer",
    image_compressor: "Bildkomprimierer",
    qr_generator: "QR-Generator",
    color_extractor: "Farbextraktor",
    video_creator: "Video-Ersteller",
    android_studio: "Android App Studio",
    pdf_tools: "PDF-Werkzeuge",
    image_converter: "Bildkonverter",
    bg_remover: "Hintergrundentferner",
    ai_chatbot: "KI-Chatbot",
    voice_studio: "Live-Sprachstudio",
    guides: "Anleitungen",
    compliance: "Compliance",
    my_drive: "Mein Drive",
    search_placeholder: "Werkzeuge, Vorlagen, Anleitungen suchen (Strg+K)...",
    search_short: "Suchen...",
    install_app: "App Installieren",
    language: "Sprache",
    select_language: "Sprache Auswählen",
    cloud_active: "Cloud Aktiv",
    local_sync: "Lokale Sync",
    theme_light: "Heller Modus",
    theme_dark: "Dunkler Modus",
    high_contrast: "Hoher Kontrast",
    tooltips: "Tipps",
    settings: "Einstellungen",
    seo_audit: "SEO-Audit",
    ai_keys: "KI-Schlüssel",
    export: "Exportieren",
    save_project: "Projekt Speichern",
    clear: "Löschen",
    reset: "Zurücksetzen",
    recent_activities: "Letzte Aktivitäten",
    pro_tier: "PRO-Stufe",
    all_tools: "Alle Werkzeuge",
    no_projects_found: "Keine Projekte gefunden",
    quick_start: "Schnellstart-Arbeitsbereich",
    created_with: "Unterstützt durch Google AI Studio",
  },
  ja: {
    app_title: "Toolkit Pro",
    app_tagline: "オールインワンAI＆デジタルクリエイションスイート",
    home: "ホーム",
    quote_designer: "名言デザイナー",
    image_compressor: "画像圧縮",
    qr_generator: "QRコード作成",
    color_extractor: "カラー抽出",
    video_creator: "動画クリエイター",
    android_studio: "Androidアプリスタジオ",
    pdf_tools: "PDFツールスイート",
    image_converter: "画像変換",
    bg_remover: "背景削除",
    ai_chatbot: "AIチャットボット",
    voice_studio: "ライブ音声スタジオ",
    guides: "ガイド",
    compliance: "コンプライアンス",
    my_drive: "マイドライブ",
    search_placeholder: "ツール、テンプレート、ガイドを検索 (Ctrl+K)...",
    search_short: "検索...",
    install_app: "アプリをインストール",
    language: "言語",
    select_language: "言語を選択",
    cloud_active: "クラウド有効",
    local_sync: "ローカル同期",
    theme_light: "ライトモード",
    theme_dark: "ダークモード",
    high_contrast: "ハイコントラスト",
    tooltips: "ツールチップ",
    settings: "設定",
    seo_audit: "SEO診断",
    ai_keys: "AIキー管理",
    export: "エクスポート",
    save_project: "プロジェクトを保存",
    clear: "クリア",
    reset: "リセット",
    recent_activities: "最近の動向",
    pro_tier: "PROプラン",
    all_tools: "すべてのツール",
    no_projects_found: "該当するプロジェクトはありません",
    quick_start: "クイックスタートワークスペース",
    created_with: "Google AI Studio搭載",
  },
  zh: {
    app_title: "Toolkit Pro",
    app_tagline: "全能AI与数字创作工具箱",
    home: "首页",
    quote_designer: "名言名句设计器",
    image_compressor: "图片压缩工具",
    qr_generator: "二维码生成器",
    color_extractor: "调色板提取器",
    video_creator: "视频创作工具",
    android_studio: "Android应用工作室",
    pdf_tools: "PDF工具箱",
    image_converter: "图像格式转换器",
    bg_remover: "智能抠图背景消除",
    ai_chatbot: "AI智能聊天机器人",
    voice_studio: "实时语音工作室",
    guides: "使用指南",
    compliance: "合规与条款",
    my_drive: "我的云端硬盘",
    search_placeholder: "搜索工具、模板、指南 (Ctrl+K)...",
    search_short: "搜索...",
    install_app: "安装应用",
    language: "语言",
    select_language: "选择语言",
    cloud_active: "云端已连线",
    local_sync: "本地同步",
    theme_light: "浅色模式",
    theme_dark: "深色模式",
    high_contrast: "高对比度",
    tooltips: "提示信息",
    settings: "设置",
    seo_audit: "SEO优化审计",
    ai_keys: "AI密钥管理",
    export: "导出",
    save_project: "保存项目",
    clear: "清除",
    reset: "重置",
    recent_activities: "最近活动",
    pro_tier: "PRO专业版",
    all_tools: "全部工具",
    no_projects_found: "未找到符合条件的项目",
    quick_start: "快速入门工作区",
    created_with: "基于 Google AI Studio 驱动",
  },
  ar: {
    app_title: "Toolkit Pro",
    app_tagline: "مجموعة أدوات الإنشاء الرقمي والذكاء الاصطناعي",
    home: "الرئيسية",
    quote_designer: "مصمم الاقتباسات",
    image_compressor: "ضغط الصور",
    qr_generator: "مولد رمز QR",
    color_extractor: "استخراج الألوان",
    video_creator: "صانع الفيديو",
    android_studio: "استوديو تطبيق أندرويد",
    pdf_tools: "أدوات PDF",
    image_converter: "محول الصور",
    bg_remover: "مزيل الخلفية",
    ai_chatbot: "مساعد الذكاء الاصطناعي",
    voice_studio: "استوديو الصوت المباشر",
    guides: "الإرشادات",
    compliance: "الامتثال والسلامة",
    my_drive: "ملفاتي في درايف",
    search_placeholder: "بحث عن الأدوات والأنماط (Ctrl+K)...",
    search_short: "بحث...",
    install_app: "تثبيت التطبيق",
    language: "اللغة",
    select_language: "اختر اللغة",
    cloud_active: "السحابة متصلة",
    local_sync: "مزامنة محلية",
    theme_light: "الوضع الفاتح",
    theme_dark: "الوضع الداكن",
    high_contrast: "تباين عالٍ",
    tooltips: "تلميحات الأدوات",
    settings: "الإعدادات",
    seo_audit: "تدقيق SEO",
    ai_keys: "مفاتيح الذكاء الاصطناعي",
    export: "تصدير",
    save_project: "حفظ المشروع",
    clear: "مسح",
    reset: "إعادة ضبط",
    recent_activities: "الأنشطة الأخيرة",
    pro_tier: "باقة PRO",
    all_tools: "جميع الأدوات",
    no_projects_found: "لم يتم العثور على مشاريع مطابقة",
    quick_start: "مساحة البدء السريع",
    created_with: "مشغل بواسطة Google AI Studio",
  },
  hi: {
    app_title: "Toolkit Pro",
    app_tagline: "ऑल-इन-वन एआई और डिजिटल निर्माण सुइट",
    home: "होम",
    quote_designer: "कोट डिज़ाइनर",
    image_compressor: "इमेज कंप्रेसर",
    qr_generator: "क्यूआर जनरेटर",
    color_extractor: "कलर एक्सट्रैक्टर",
    video_creator: "वीडियो क्रिएटर",
    android_studio: "एंड्रॉइड ऐप स्टूडियो",
    pdf_tools: "पीडीएफ टूल सुइट",
    image_converter: "इमेज कन्वर्टर",
    bg_remover: "बैकग्राउंड रिमूवर",
    ai_chatbot: "एआई चैटबॉट",
    voice_studio: "लाइव वॉइस स्टूडियो",
    guides: "गाइड्स",
    compliance: "अनुपालन",
    my_drive: "माय ड्राइव",
    search_placeholder: "टूल, टेम्प्लेट, गाइड खोजें (Ctrl+K)...",
    search_short: "खोजें...",
    install_app: "ऐप इंस्टॉल करें",
    language: "भाषा",
    select_language: "भाषा चुनें",
    cloud_active: "क्लाउड सक्रिय",
    local_sync: "लोकल सिंक",
    theme_light: "लाइट मोड",
    theme_dark: "डार्क मोड",
    high_contrast: "हाई कंट्रास्ट",
    tooltips: "टूलटिप्स",
    settings: "सेटिंग्स",
    seo_audit: "एसईओ ऑडिट",
    ai_keys: "एआई कीज़",
    export: "एक्सपोर्ट",
    save_project: "प्रोजेक्ट सेव करें",
    clear: "क्लियर",
    reset: "रीसेट",
    recent_activities: "हाल की गतिविधियां",
    pro_tier: "प्रो टियर",
    all_tools: "सभी टूल्स",
    no_projects_found: "कोई प्रोजेक्ट नहीं मिला",
    quick_start: "क्विक स्टार्ट वर्कस्पेस",
    created_with: "गूगल एआई स्टूडियो द्वारा संचालित",
  },
  pt: {
    app_title: "Toolkit Pro",
    app_tagline: "Suíte Completa de Criação Digital e IA",
    home: "Início",
    quote_designer: "Designer de Citações",
    image_compressor: "Compressor de Imagem",
    qr_generator: "Gerador de QR",
    color_extractor: "Extrator de Cores",
    video_creator: "Criador de Vídeo",
    android_studio: "Estúdio de App Android",
    pdf_tools: "Ferramentas de PDF",
    image_converter: "Conversor de Imagem",
    bg_remover: "Removedor de Fundo",
    ai_chatbot: "Chatbot IA",
    voice_studio: "Estúdio de Voz Ao Vivo",
    guides: "Guias",
    compliance: "Conformidade",
    my_drive: "Meu Drive",
    search_placeholder: "Buscar ferramentas, modelos, guias (Ctrl+K)...",
    search_short: "Buscar...",
    install_app: "Instalar App",
    language: "Idioma",
    select_language: "Selecionar Idioma",
    cloud_active: "Nuvem Ativa",
    local_sync: "Sinc. Local",
    theme_light: "Modo Claro",
    theme_dark: "Modo Escuro",
    high_contrast: "Alto Contraste",
    tooltips: "Dicas de Ferramenta",
    settings: "Configurações",
    seo_audit: "Auditoria SEO",
    ai_keys: "Chaves de IA",
    export: "Exportar",
    save_project: "Salvar Projeto",
    clear: "Limpar",
    reset: "Redefinir",
    recent_activities: "Atividades Recentes",
    pro_tier: "Nível PRO",
    all_tools: "Todas as Ferramentas",
    no_projects_found: "Nenhum projeto encontrado",
    quick_start: "Área de Início Rápido",
    created_with: "Desenvolvido com Google AI Studio",
  },
  it: {
    app_title: "Toolkit Pro",
    app_tagline: "Suite completa di creazione digitale e IA",
    home: "Home",
    quote_designer: "Designer di Citazioni",
    image_compressor: "Compressore Immagini",
    qr_generator: "Generatore QR",
    color_extractor: "Estrattore di Colore",
    video_creator: "Creatore di Video",
    android_studio: "Studio App Android",
    pdf_tools: "Strumenti PDF",
    image_converter: "Convertitore Immagini",
    bg_remover: "Rimuovi Sfondo",
    ai_chatbot: "Chatbot IA",
    voice_studio: "Studio Vocale Live",
    guides: "Guide",
    compliance: "Conformità",
    my_drive: "Il Mio Drive",
    search_placeholder: "Cerca strumenti, modelli, guide (Ctrl+K)...",
    search_short: "Cerca...",
    install_app: "Installa App",
    language: "Lingua",
    select_language: "Seleziona Lingua",
    cloud_active: "Cloud Attivo",
    local_sync: "Sync Locale",
    theme_light: "Modalità Chiara",
    theme_dark: "Modalità Scurissima",
    high_contrast: "Alto Contrasto",
    tooltips: "Suggerimenti",
    settings: "Impostazioni",
    seo_audit: "Audit SEO",
    ai_keys: "Chiavi IA",
    export: "Esporta",
    save_project: "Salva Progetto",
    clear: "Cancella",
    reset: "Ripristina",
    recent_activities: "Attività Recenti",
    pro_tier: "Livello PRO",
    all_tools: "Tutti gli Strumenti",
    no_projects_found: "Nessun progetto trovato",
    quick_start: "Area di Avvio Rapido",
    created_with: "Alimentato da Google AI Studio",
  }
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  currentLangInfo: LanguageInfo;
  t: (key: string, fallback?: string) => string;
  supportedLanguages: LanguageInfo[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem("toolkit-pro-user-lang") as LanguageCode;
      if (saved && TRANSLATIONS[saved]) return saved;
      
      // Auto-detect browser language
      if (typeof navigator !== "undefined" && navigator.language) {
        const navLang = navigator.language.split("-")[0].toLowerCase() as LanguageCode;
        if (TRANSLATIONS[navLang]) return navLang;
      }
    } catch (e) {
      console.error("Error reading language from localStorage:", e);
    }
    return "en";
  });

  const setLanguage = (code: LanguageCode) => {
    if (TRANSLATIONS[code]) {
      setLanguageState(code);
      try {
        localStorage.setItem("toolkit-pro-user-lang", code);
      } catch (e) {
        console.error("Error saving language to localStorage:", e);
      }
    }
  };

  const currentLangInfo = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  // Keep DOM document lang, dir, hreflang SEO meta tags, and localStorage in sync whenever language changes
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
      document.documentElement.dir = currentLangInfo.dir || "ltr";

      // Dynamically manage hreflang tags in document head for SEO
      const baseUrl = typeof window !== "undefined" 
        ? `${window.location.origin}${window.location.pathname}`
        : "https://toolkitpro.app";

      // Remove any existing dynamic hreflang tags created by us
      const existingHreflangs = document.querySelectorAll('link[data-seo-hreflang="true"]');
      existingHreflangs.forEach(el => el.remove());

      // Inject hreflang for each supported language
      SUPPORTED_LANGUAGES.forEach(lang => {
        const link = document.createElement("link");
        link.rel = "alternate";
        link.hreflang = lang.code;
        link.href = `${baseUrl}?lang=${lang.code}`;
        link.setAttribute("data-seo-hreflang", "true");
        document.head.appendChild(link);
      });

      // Inject x-default hreflang pointing to English default
      const xDefaultLink = document.createElement("link");
      xDefaultLink.rel = "alternate";
      xDefaultLink.hreflang = "x-default";
      xDefaultLink.href = `${baseUrl}?lang=en`;
      xDefaultLink.setAttribute("data-seo-hreflang", "true");
      document.head.appendChild(xDefaultLink);

      // Update document title/meta language tag if available
      let metaLang = document.querySelector('meta[name="language"]');
      if (!metaLang) {
        metaLang = document.createElement("meta");
        metaLang.setAttribute("name", "language");
        document.head.appendChild(metaLang);
      }
      metaLang.setAttribute("content", language);
    }

    try {
      localStorage.setItem("toolkit-pro-user-lang", language);
    } catch (e) {
      console.error("Error updating localStorage language preference:", e);
    }
  }, [language, currentLangInfo]);

  // Sync across tabs if user updates language in another tab
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "toolkit-pro-user-lang" && e.newValue && TRANSLATIONS[e.newValue as LanguageCode]) {
        setLanguageState(e.newValue as LanguageCode);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const t = (key: string, fallback?: string): string => {
    const translation = TRANSLATIONS[language]?.[key] || TRANSLATIONS.en?.[key];
    return translation || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, currentLangInfo, t, supportedLanguages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime?: string;
  size?: string;
  thumbnailLink?: string;
  webViewLink?: string;
  parents?: string[];
}

export type BgStyleType = "gradient" | "color" | "image";

export interface QuoteConfig {
  text: string;
  author: string;
  fontFamily: string;
  authorFontFamily?: string;
  fontSize: number;
  fontColor: string;
  textAlign: "left" | "center" | "right";
  bgStyle: BgStyleType;
  bgValue: string; // gradient CSS or solid hex color, or uploaded image base64
  overlayOpacity: number; // 0 to 1
  overlayBlur: number; // 0 to 20 px
  padding: number; // card padding
  aspectRatio?: "1:1" | "9:16" | "3:1" | "16:9" | "4:5" | "7:4" | "4:7";
  fontStyle?: "normal" | "italic" | "oblique";
  isBold?: boolean;
  isItalic?: boolean;
  noiseOpacity?: number; // subtle noise opacity, 0 to 1
  noisePreset?: string; // name of active noise pattern if any
}

export interface PaletteColor {
  hex: string;
  name: string;
  contrastColor: string;
}

export interface CompressionResult {
  fileName: string;
  mimeType: string;
  originalSize: number;
  compressedSize: number;
  savingPercentage: number;
  dataUrl: string;
}

export type ActiveTab = "home" | "quote" | "compress" | "qr" | "palette" | "video" | "drive" | "resources" | "legal";

export interface RecentActivity {
  id: string;
  type: "tool" | "file";
  title: string;
  detail: string;
  timestamp: string;
  icon: "Quote" | "FileImage" | "QrCode" | "Pipette" | "Cloud" | "BookOpen" | "ShieldCheck" | "Activity" | "Download" | "Sparkles" | "Video";
  tab?: ActiveTab;
}

import React, { useState, useRef, useEffect } from "react";
import { User } from "firebase/auth";
import { motion, AnimatePresence } from "motion/react";
import { DriveFile } from "../types";
import { deleteDriveFile, getOrCreateFolder, uploadFileToDrive, createDriveFolder, moveDriveFile, renameDriveFile } from "../lib/drive";
import {
  Cloud,
  RefreshCw,
  Search,
  Trash2,
  ExternalLink,
  Eye,
  FileImage,
  Filter,
  UploadCloud,
  Check,
  AlertCircle,
  Copy,
  ChevronLeft,
  ChevronRight,
  X,
  Folder,
  FolderPlus,
  Move,
  Edit3,
  Square,
  CheckSquare,
  Sparkles,
  ShieldCheck,
  ArrowUpDown,
  Download,
  LayoutGrid,
  List,
  GripVertical,
} from "lucide-react";

interface DriveExplorerProps {
  user: User | null;
  accessToken: string | null;
  files: DriveFile[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectTab: (tab: any) => void;
  onOpenSeoModal?: (initialData?: any) => void;
}

export default function DriveExplorer({
  user,
  accessToken,
  files,
  isLoading,
  onRefresh,
  onSelectTab,
  onOpenSeoModal,
}: DriveExplorerProps) {
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus on Ctrl+F or Cmd+F
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const [filterType, setFilterType] = useState<"all" | "quote" | "compress" | "qr" | "palette" | "general">("all");
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Real-time network and session sync status monitoring
  const [isOnline, setIsOnline] = useState(typeof window !== "undefined" ? window.navigator.onLine : true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [previewFileContent, setPreviewFileContent] = useState<string | null>(null);
  const [isPreviewContentLoading, setIsPreviewContentLoading] = useState(false);
  const [previewContentError, setPreviewContentError] = useState<string | null>(null);

  // Directory Organization state variables
  const [appRootId, setAppRootId] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<{ id: string; name: string }[]>([]);
  const [viewMode, setViewMode] = useState<"tree" | "flat">("tree");

  // Destructive Actions (Delete, Rename) & Details Preview Custom States
  const [deletingItem, setDeletingItem] = useState<{ id: string; name: string; isFolder: boolean; size?: string; thumbnail?: string } | null>(null);
  const [renamingItem, setRenamingItem] = useState<{ id: string; name: string; isFolder: boolean } | null>(null);
  const [newRenameValue, setNewRenameValue] = useState("");
  const [isRenamingItem, setIsRenamingItem] = useState(false);
  const [selectedPreviewFile, setSelectedPreviewFile] = useState<DriveFile | null>(null);

  // Create Folder state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Moving file state
  const [movingFile, setMovingFile] = useState<DriveFile | null>(null);
  const [isMovingFile, setIsMovingFile] = useState(false);

  // Batch selection and batch rename state variables
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [showBatchRenameModal, setShowBatchRenameModal] = useState(false);
  const [batchRenameMode, setBatchRenameMode] = useState<"prefix-suffix" | "find-replace" | "sequence">("prefix-suffix");
  const [batchPrefix, setBatchPrefix] = useState("");
  const [batchSuffix, setBatchSuffix] = useState("");
  const [batchFind, setBatchFind] = useState("");
  const [batchReplace, setBatchReplace] = useState("");
  const [batchPattern, setBatchPattern] = useState("toolkit_");
  const [batchStartNum, setBatchStartNum] = useState(1);
  const [isRenamingBatch, setIsRenamingBatch] = useState(false);
  const [renameProgress, setRenameProgress] = useState<{ total: number; current: number } | null>(null);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState<{ total: number; current: number } | null>(null);

  // Sorting configuration states
  const [sortBy, setSortBy] = useState<"date" | "size" | "name" | "custom">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [displayMode, setDisplayMode] = useState<"grid" | "list">("grid");

  // Drag-and-drop state for reordering files and moving files to folders
  const [customOrderMap, setCustomOrderMap] = useState<Record<string, string[]>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("toolkit_drive_custom_order");
        return saved ? JSON.parse(saved) : {};
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("toolkit_drive_custom_order", JSON.stringify(customOrderMap));
      } catch (e) {
        console.error("Failed to persist custom drive file order:", e);
      }
    }
  }, [customOrderMap]);

  const [draggedFileId, setDraggedFileId] = useState<string | null>(null);
  const [draggedFileIds, setDraggedFileIds] = useState<string[]>([]);
  const [dragOverTargetId, setDragOverTargetId] = useState<string | null>(null);
  const [dragOverTargetType, setDragOverTargetType] = useState<"folder" | "file" | "breadcrumb" | null>(null);
  const [isMovingBatch, setIsMovingBatch] = useState(false);

  // Clear batch selection on navigation or search/filter parameters
  useEffect(() => {
    setSelectedFileIds([]);
  }, [currentFolderId, search, filterType, viewMode, displayMode]);

  const computeNewName = (originalName: string, index: number): string => {
    const dotIndex = originalName.lastIndexOf(".");
    const baseName = dotIndex !== -1 ? originalName.substring(0, dotIndex) : originalName;
    const extension = dotIndex !== -1 ? originalName.substring(dotIndex) : "";

    if (batchRenameMode === "prefix-suffix") {
      return `${batchPrefix}${baseName}${batchSuffix}${extension}`;
    } else if (batchRenameMode === "find-replace") {
      if (!batchFind) return originalName;
      const escapedFind = batchFind.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(escapedFind, "g");
      return `${baseName.replace(regex, batchReplace)}${extension}`;
    } else if (batchRenameMode === "sequence") {
      const serialNum = (batchStartNum + index).toString().padStart(3, "0");
      return `${batchPattern}${serialNum}${extension}`;
    }

    return originalName;
  };

  const handleBatchRenameAction = async () => {
    if (!accessToken || selectedFileIds.length === 0) return;

    setIsRenamingBatch(true);
    setRenameProgress({ total: selectedFileIds.length, current: 0 });

    let successCount = 0;
    let failCount = 0;

    try {
      const selectedFiles = files.filter(f => selectedFileIds.includes(f.id));

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const newName = computeNewName(file.name, i);

        if (newName === file.name) {
          successCount++;
          setRenameProgress({ total: selectedFiles.length, current: i + 1 });
          continue;
        }

        try {
          await renameDriveFile(accessToken, file.id, newName);
          successCount++;
        } catch (renameErr) {
          console.error(`Failed to rename ${file.name} to ${newName}:`, renameErr);
          failCount++;
        }

        setRenameProgress({ total: selectedFiles.length, current: i + 1 });
      }

      setUploadStatus({
        success: failCount === 0,
        msg: failCount === 0 
          ? `Successfully batch renamed ${successCount} files!`
          : `Batch rename completed: ${successCount} succeeded, ${failCount} failed.`,
      });

      setSelectedFileIds([]);
      setShowBatchRenameModal(false);
      onRefresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to execute batch rename.");
    } finally {
      setIsRenamingBatch(false);
      setRenameProgress(null);
    }
  };

  const handleBatchDeleteAction = async () => {
    if (!accessToken || selectedFileIds.length === 0) return;

    setIsDeletingBatch(true);
    setDeleteProgress({ total: selectedFileIds.length, current: 0 });

    let successCount = 0;
    let failCount = 0;

    try {
      for (let i = 0; i < selectedFileIds.length; i++) {
        const fileId = selectedFileIds[i];
        try {
          await deleteDriveFile(accessToken, fileId);
          successCount++;
          if (selectedPreviewFile?.id === fileId) {
            setSelectedPreviewFile(null);
          }
        } catch (deleteErr) {
          console.error(`Failed to delete file ID ${fileId}:`, deleteErr);
          failCount++;
        }
        setDeleteProgress({ total: selectedFileIds.length, current: i + 1 });
      }

      setUploadStatus({
        success: failCount === 0,
        msg: failCount === 0
          ? `Successfully deleted ${successCount} files!`
          : `Batch deletion completed: ${successCount} deleted, ${failCount} failed.`,
      });

      setSelectedFileIds([]);
      setShowBatchDeleteModal(false);
      onRefresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to execute batch deletion.");
    } finally {
      setIsDeletingBatch(false);
      setDeleteProgress(null);
    }
  };

  const toggleSelectFile = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFileIds(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId) 
        : [...prev, fileId]
    );
  };

  // Auto-resolve ToolkitPro application folder ID
  useEffect(() => {
    if (!accessToken) return;

    const tkFolder = files.find(
      (f) => f.mimeType === "application/vnd.google-apps.folder" && f.name === "ToolkitPro"
    );

    if (tkFolder) {
      setAppRootId(tkFolder.id);
      if (!currentFolderId) {
        setCurrentFolderId(tkFolder.id);
        setCurrentPath([{ id: tkFolder.id, name: "ToolkitPro" }]);
      }
    } else {
      getOrCreateFolder(accessToken, "ToolkitPro")
        .then((id) => {
          setAppRootId(id);
          if (!currentFolderId) {
            setCurrentFolderId(id);
            setCurrentPath([{ id, name: "ToolkitPro" }]);
          }
        })
        .catch((err) => console.error("Failed to lazily establish app root folder:", err));
    }
  }, [files, accessToken]);

  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ success?: boolean; msg?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const uploadFiles = async (filesToUpload: File[]) => {
    if (!accessToken) {
      setUploadStatus({
        success: false,
        msg: "Please connect your Google Drive account first.",
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    try {
      // 1. Resolve target folder - upload to the currently browsed folder if inside custom subfolders,
      // otherwise default to standard 'ToolkitPro/Uploads' folder.
      let targetFolderId = currentFolderId;
      let targetFolderName = currentPath[currentPath.length - 1]?.name || "ToolkitPro";

      if (!targetFolderId || targetFolderId === appRootId) {
        const appFolderId = appRootId || (await getOrCreateFolder(accessToken, "ToolkitPro"));
        targetFolderId = await getOrCreateFolder(accessToken, "Uploads", appFolderId);
        targetFolderName = "ToolkitPro/Uploads";
      }

      let successCount = 0;
      for (const file of filesToUpload) {
        try {
          const base64DataUrl = await fileToDataUrl(file);
          await uploadFileToDrive(
            accessToken,
            file.name,
            file.type || "application/octet-stream",
            base64DataUrl,
            targetFolderId
          );
          successCount++;
        } catch (uploadErr) {
          console.error(`Failed to upload ${file.name}:`, uploadErr);
        }
      }

      if (successCount === filesToUpload.length) {
        setUploadStatus({
          success: true,
          msg: `Successfully uploaded ${successCount} ${successCount === 1 ? "file" : "files"} to "${targetFolderName}" folder!`,
        });
      } else if (successCount > 0) {
        setUploadStatus({
          success: true,
          msg: `Uploaded ${successCount} out of ${filesToUpload.length} files to "${targetFolderName}" folder.`,
        });
      } else {
        throw new Error("Unable to upload files. Please make sure they are valid files.");
      }

      onRefresh();
    } catch (err: any) {
      console.error(err);
      setUploadStatus({
        success: false,
        msg: err.message || "Failed to upload files to Google Drive.",
      });
    } finally {
      setIsUploading(false);
      // Auto dismiss success toast after 6 seconds
      setTimeout(() => {
        setUploadStatus((prev) => (prev?.success ? null : prev));
      }, 6000);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedFileId) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    // If an internal drive item is being dragged, skip external file upload
    if (draggedFileId) {
      return;
    }

    const filesToUpload = Array.from(e.dataTransfer.files) as File[];
    if (filesToUpload.length === 0) return;

    await uploadFiles(filesToUpload);
  };

  const handleReorderFiles = (sourceFileId: string, targetFileId: string) => {
    if (sourceFileId === targetFileId) return;

    const currentFolderKey = currentFolderId || appRootId || "root";
    const existingOrder = customOrderMap[currentFolderKey] || currentFiles.map((f) => f.id);

    // Keep unique valid IDs in current view
    const validIds = Array.from(new Set([...existingOrder, ...currentFiles.map((f) => f.id)]))
      .filter((id) => currentFiles.some((f) => f.id === id));

    const sourceIndex = validIds.indexOf(sourceFileId);
    const targetIndex = validIds.indexOf(targetFileId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    const newOrder = [...validIds];
    const [removed] = newOrder.splice(sourceIndex, 1);
    newOrder.splice(targetIndex, 0, removed);

    setCustomOrderMap((prev) => ({
      ...prev,
      [currentFolderKey]: newOrder,
    }));

    setSortBy("custom");
    setUploadStatus({
      success: true,
      msg: "Reordered files in view successfully!",
    });
    setTimeout(() => {
      setUploadStatus((prev) => (prev?.msg?.includes("Reordered") ? null : prev));
    }, 4000);
  };

  const handleMoveFilesToFolder = async (
    fileIdsToMove: string[],
    targetFolderId: string,
    targetFolderName: string
  ) => {
    if (!accessToken || fileIdsToMove.length === 0) return;

    // Avoid moving if target folder is current folder
    if (targetFolderId === (currentFolderId || appRootId)) return;

    setIsMovingBatch(true);
    setUploadStatus({
      success: true,
      msg: `Moving ${fileIdsToMove.length} ${fileIdsToMove.length === 1 ? "file" : "files"} to "${targetFolderName}"...`,
    });

    let successCount = 0;
    let failCount = 0;

    try {
      const activeParentId = currentFolderId || appRootId || "";
      for (const fId of fileIdsToMove) {
        try {
          const targetFileObj = files.find((f) => f.id === fId);
          const oldParent = (targetFileObj?.parents && targetFileObj.parents[0]) || activeParentId;
          await moveDriveFile(accessToken, fId, targetFolderId, oldParent);
          successCount++;
        } catch (err) {
          console.error(`Failed to move file ID ${fId}:`, err);
          failCount++;
        }
      }

      setUploadStatus({
        success: failCount === 0,
        msg: failCount === 0
          ? `Successfully moved ${successCount} ${
              successCount === 1 ? "file" : "files"
            } into "${targetFolderName}" folder!`
          : `Moved ${successCount} files into "${targetFolderName}", ${failCount} failed.`,
      });

      setSelectedFileIds((prev) => prev.filter((id) => !fileIdsToMove.includes(id)));
      onRefresh();
    } catch (err: any) {
      console.error(err);
      setUploadStatus({
        success: false,
        msg: err.message || "Failed to move file(s) into folder.",
      });
    } finally {
      setIsMovingBatch(false);
      setTimeout(() => {
        setUploadStatus((prev) => (prev?.msg?.includes("Moved") ? null : prev));
      }, 5000);
    }
  };

  const resetCustomOrder = () => {
    const currentFolderKey = currentFolderId || appRootId || "root";
    setCustomOrderMap((prev) => {
      const next = { ...prev };
      delete next[currentFolderKey];
      return next;
    });
    setSortBy("date");
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesToUpload = Array.from(e.target.files) as File[];
    if (filesToUpload.length === 0) return;

    await uploadFiles(filesToUpload);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerDelete = (item: DriveFile, isFolder: boolean) => {
    setDeletingItem({
      id: item.id,
      name: item.name,
      isFolder,
      size: item.size ? formatBytes(item.size) : undefined,
      thumbnail: item.thumbnailLink,
    });
  };

  const triggerRename = (item: DriveFile, isFolder: boolean) => {
    setRenamingItem({
      id: item.id,
      name: item.name,
      isFolder,
    });
    setNewRenameValue(item.name);
  };

  const executeDeleteAction = async () => {
    if (!accessToken || !deletingItem) return;

    const { id, isFolder } = deletingItem;
    setIsDeletingId(id);
    setDeletingItem(null);

    try {
      await deleteDriveFile(accessToken, id);
      if (selectedPreviewFile?.id === id) {
        setSelectedPreviewFile(null);
      }
      onRefresh(); // Reload files
    } catch (err: any) {
      console.error(err);
      alert(err.message || `Failed to delete ${isFolder ? "folder" : "file"} from Google Drive.`);
    } finally {
      setIsDeletingId(null);
    }
  };

  const executeRenameAction = async () => {
    if (!accessToken || !renamingItem || !newRenameValue.trim() || newRenameValue.trim() === renamingItem.name) {
      setRenamingItem(null);
      return;
    }

    setIsRenamingItem(true);
    try {
      await renameDriveFile(accessToken, renamingItem.id, newRenameValue.trim());
      if (selectedPreviewFile?.id === renamingItem.id) {
        setSelectedPreviewFile(prev => prev ? { ...prev, name: newRenameValue.trim() } : null);
      }
      setRenamingItem(null);
      onRefresh(); // Reload files
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to rename item in Google Drive.");
    } finally {
      setIsRenamingItem(false);
    }
  };

  const handleCreateFolderAction = async () => {
    if (!accessToken || !newFolderName.trim()) return;

    setIsCreatingFolder(true);
    try {
      const activeFolderId = currentFolderId || appRootId || (await getOrCreateFolder(accessToken, "ToolkitPro"));
      await createDriveFolder(accessToken, newFolderName.trim(), activeFolderId);
      
      setNewFolderName("");
      setShowCreateModal(false);
      onRefresh(); // Refresh and rebuild structures
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to create folder in Google Drive.");
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleMoveFileAction = async (targetFolderId: string) => {
    if (!accessToken || !movingFile) return;

    setIsMovingFile(true);
    try {
      const previousParentId = currentFolderId || (movingFile.parents && movingFile.parents[0]) || appRootId || "";
      await moveDriveFile(accessToken, movingFile.id, targetFolderId, previousParentId);
      
      setMovingFile(null);
      onRefresh(); // Reload files
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to move file in Google Drive.");
    } finally {
      setIsMovingFile(false);
    }
  };

  const enterFolder = (folder: DriveFile) => {
    const updatedPath = [...currentPath, { id: folder.id, name: folder.name }];
    setCurrentPath(updatedPath);
    setCurrentFolderId(folder.id);
  };

  const navigateToFolderFromBreadcrumb = (index: number) => {
    const newPath = currentPath.slice(0, index + 1);
    setCurrentPath(newPath);
    setCurrentFolderId(newPath[index].id);
  };

  // Classify file based on its name prefixes/suffix
  const getFileCategory = (name: string): "quote" | "compress" | "qr" | "palette" | "general" => {
    const n = name.toLowerCase();
    if (n.startsWith("quote_designer_")) return "quote";
    if (n.includes("_compressed")) return "compress";
    if (n.startsWith("qr_code_")) return "qr";
    if (n.startsWith("color_palette_")) return "palette";
    return "general";
  };

  // Check if a file or folder matches the search query by name or date
  const matchFileByDateOrName = (file: DriveFile, query: string): boolean => {
    if (!query) return true;
    const q = query.toLowerCase().trim();

    // 1. Match name
    if (file.name.toLowerCase().includes(q)) return true;

    // 2. Match date (createdTime)
    if (file.createdTime) {
      const createdDate = new Date(file.createdTime);
      const isoStr = file.createdTime.toLowerCase();
      if (isoStr.includes(q)) return true;

      const localStr = createdDate.toLocaleDateString().toLowerCase();
      if (localStr.includes(q)) return true;

      // Match common parts of date: month name, day, year
      const options: Intl.DateTimeFormatOptions[] = [
        { month: "long" },
        { month: "short" },
        { weekday: "long" },
        { weekday: "short" },
        { year: "numeric" },
        { day: "numeric" },
      ];

      for (const opt of options) {
        try {
          const part = createdDate.toLocaleDateString(undefined, opt).toLowerCase();
          if (part.includes(q)) return true;
        } catch (e) {}
      }
    }

    // 3. Match date (modifiedTime)
    if (file.modifiedTime) {
      const modifiedDate = new Date(file.modifiedTime);
      const isoStr = file.modifiedTime.toLowerCase();
      if (isoStr.includes(q)) return true;

      const localStr = modifiedDate.toLocaleDateString().toLowerCase();
      if (localStr.includes(q)) return true;

      const options: Intl.DateTimeFormatOptions[] = [
        { month: "long" },
        { month: "short" },
        { weekday: "long" },
        { weekday: "short" },
        { year: "numeric" },
        { day: "numeric" },
      ];

      for (const opt of options) {
        try {
          const part = modifiedDate.toLocaleDateString(undefined, opt).toLowerCase();
          if (part.includes(q)) return true;
        } catch (e) {}
      }
    }

    return false;
  };

  // Real-time keyword filter highlighting
  const highlightMatch = (text: string, searchStr: string) => {
    if (!searchStr) return text;
    const cleanSearch = searchStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const parts = text.split(new RegExp(`(${cleanSearch})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === searchStr.toLowerCase() ? (
            <mark
              key={i}
              className="bg-amber-100 dark:bg-indigo-950/80 text-amber-950 dark:text-indigo-200 font-extrabold rounded px-0.5"
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // Retrieve folders nested inside current directory (under folder view mode)
  const rawFolders = files.filter((f) => {
    if (f.mimeType !== "application/vnd.google-apps.folder") return false;
    if (f.id === appRootId) return false;

    // Check directory bounds
    const parentId = currentFolderId || appRootId;
    const isDirectChild = f.parents?.includes(parentId || "");

    const matchesSearch = matchFileByDateOrName(f, search);
    return isDirectChild && matchesSearch;
  });

  const currentFolders = [...rawFolders].sort((a, b) => {
    let comparison = 0;
    if (sortBy === "date") {
      const dateA = new Date(a.modifiedTime || a.createdTime || 0).getTime();
      const dateB = new Date(b.modifiedTime || b.createdTime || 0).getTime();
      comparison = dateA - dateB;
    } else {
      comparison = a.name.localeCompare(b.name);
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Retrieve files nested inside current directory
  const rawFiles = files.filter((f) => {
    if (f.mimeType === "application/vnd.google-apps.folder") return false;

    // Filter by hierarchy if tree mode is active
    if (viewMode === "tree") {
      const parentId = currentFolderId || appRootId;
      const isDirectChild = f.parents?.includes(parentId || "");
      if (!isDirectChild) return false;
    }

    const matchesSearch = matchFileByDateOrName(f, search);
    if (!matchesSearch) return false;

    if (filterType !== "all") {
      const cat = getFileCategory(f.name);
      if (cat !== filterType) return false;
    }

    return true;
  });

  const currentFiles = [...rawFiles].sort((a, b) => {
    if (sortBy === "custom") {
      const currentFolderKey = currentFolderId || appRootId || "root";
      const customList = customOrderMap[currentFolderKey] || [];
      const indexA = customList.indexOf(a.id);
      const indexB = customList.indexOf(b.id);

      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      // Fallback: Date modified descending
      const dateA = new Date(a.modifiedTime || a.createdTime || 0).getTime();
      const dateB = new Date(b.modifiedTime || b.createdTime || 0).getTime();
      return dateB - dateA;
    }

    let comparison = 0;
    if (sortBy === "date") {
      const dateA = new Date(a.modifiedTime || a.createdTime || 0).getTime();
      const dateB = new Date(b.modifiedTime || b.createdTime || 0).getTime();
      comparison = dateA - dateB;
    } else if (sortBy === "size") {
      const sizeA = a.size ? parseInt(a.size, 10) : 0;
      const sizeB = b.size ? parseInt(b.size, 10) : 0;
      comparison = sizeA - sizeB;
    } else {
      comparison = a.name.localeCompare(b.name);
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const getHiResImage = (link?: string) => {
    if (!link) return "";
    return link.replace(/=s\d+(-c)?$/, "=s1000");
  };

  const formatBytes = (bytesStr?: string) => {
    if (!bytesStr) return "Unknown size";
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return bytesStr;
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDownloadCSV = () => {
    if (currentFiles.length === 0) {
      alert("No files currently displayed to export!");
      return;
    }

    const escapeCsvValue = (val: string) => {
      const clean = val.replace(/"/g, '""');
      return `"${clean}"`;
    };

    const headers = ["File Name", "Type / Category", "Formatted Size", "Last Modified"];
    const rows = [headers.join(",")];

    for (const file of currentFiles) {
      const categoryName = getFileCategory(file.name).toUpperCase();
      const formattedSizeValue = formatBytes(file.size);
      const lastModifiedDate = new Date(file.modifiedTime || file.createdTime || "").toLocaleString();

      const row = [
        escapeCsvValue(file.name),
        escapeCsvValue(categoryName),
        escapeCsvValue(formattedSizeValue),
        escapeCsvValue(lastModifiedDate),
      ];
      rows.push(row.join(","));
    }

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent(rows.join("\n"));
    
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `drive_export_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Trigger activity logging if registered
    window.dispatchEvent(
      new CustomEvent("toolkit-add-activity", {
        detail: {
          type: "download",
          title: "Downloaded CSV File List",
          detail: `Exported ${currentFiles.length} file metadata entries to CSV`,
          icon: "Download",
          tab: "drive"
        }
      })
    );
  };

  const handlePrevPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewIndex !== null && previewIndex > 0) {
      setPreviewIndex(previewIndex - 1);
      setCopiedLink(false);
    }
  };

  const handleNextPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewIndex !== null && previewIndex < currentFiles.length - 1) {
      setPreviewIndex(previewIndex + 1);
      setCopiedLink(false);
    }
  };

  const handleCopyLink = (url?: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const isTextPreviewable = (fileName: string, mimeType: string): boolean => {
    const textMimeTypes = [
      "application/json",
      "application/javascript",
      "application/x-javascript",
      "text/javascript",
      "text/plain",
      "text/html",
      "text/css",
      "text/markdown",
      "text/xml",
      "application/xml",
      "text/csv"
    ];
    if (textMimeTypes.some(m => mimeType.includes(m))) return true;

    // Extension check
    const ext = fileName.split('.').pop()?.toLowerCase();
    const textExtensions = ["txt", "js", "ts", "tsx", "jsx", "json", "html", "css", "md", "csv", "xml", "yml", "yaml", "ini", "log", "sql"];
    return !!ext && textExtensions.includes(ext);
  };

  const previewFileId = (previewIndex !== null && currentFiles[previewIndex]) ? currentFiles[previewIndex].id : null;
  const previewFileName = (previewIndex !== null && currentFiles[previewIndex]) ? currentFiles[previewIndex].name : null;
  const previewFileMime = (previewIndex !== null && currentFiles[previewIndex]) ? currentFiles[previewIndex].mimeType : null;

  useEffect(() => {
    if (!previewFileId || !accessToken) {
      setPreviewFileContent(null);
      setIsPreviewContentLoading(false);
      setPreviewContentError(null);
      return;
    }

    if (!previewFileName || !previewFileMime || !isTextPreviewable(previewFileName, previewFileMime)) {
      setPreviewFileContent(null);
      setIsPreviewContentLoading(false);
      setPreviewContentError(null);
      return;
    }

    let isMounted = true;
    const fetchContent = async () => {
      setIsPreviewContentLoading(true);
      setPreviewContentError(null);
      setPreviewFileContent(null);

      try {
        const url = `https://www.googleapis.com/drive/v3/files/${previewFileId}?alt=media`;
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load file content (${response.status} ${response.statusText})`);
        }

        const text = await response.text();
        if (isMounted) {
          setPreviewFileContent(text);
        }
      } catch (err: any) {
        console.error("Error fetching preview text content:", err);
        if (isMounted) {
          setPreviewContentError(err.message || "Failed to load files text content.");
        }
      } finally {
        if (isMounted) {
          setIsPreviewContentLoading(false);
        }
      }
    };

    fetchContent();

    return () => {
      isMounted = false;
    };
  }, [previewFileId, accessToken, previewFileName, previewFileMime]);

  // Lock body scroll when any modal in DriveExplorer is open
  useEffect(() => {
    const isAnyModalOpen = 
      previewIndex !== null || 
      deletingItem !== null || 
      renamingItem !== null || 
      showCreateModal || 
      movingFile !== null || 
      showBatchRenameModal;

    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [previewIndex, deletingItem, renamingItem, showCreateModal, movingFile, showBatchRenameModal]);

  const isSyncing = isOnline && !!accessToken && (isLoading || isUploading || isCreatingFolder || isMovingFile || isDeletingId !== null);
  const syncStatus: "Online" | "Syncing" | "Offline" = !isOnline || !accessToken
    ? "Offline"
    : isSyncing
      ? "Syncing"
      : "Online";

  return (
    <div className="space-y-6 font-sans">
      {/* DRIVE HEADER WITH INTEGRATED REAL-TIME SYNC STATUS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-150/40 dark:border-slate-800/80 shadow-sm transition-colors">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30">
              <Cloud className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-sans">Google Drive Cloud Workspace</h3>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xl font-medium">
            Save, sync, and organize compressed files, customized card design assets, and median-cut color spectrum palettes in your secure personal Google Drive.
          </p>
        </div>

        {/* Sync status pill visual display */}
        <div className="flex items-center gap-2.5 sm:self-center">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-505 uppercase tracking-widest font-mono">
            SYNC STATUS:
          </span>
          
          {syncStatus === "Offline" && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400 text-xs font-bold font-mono border border-slate-200 dark:border-slate-800 shadow-3xs">
              <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600 shrink-0" />
              <span>Offline</span>
            </div>
          )}

          {syncStatus === "Syncing" && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-955/35 text-indigo-700 dark:text-indigo-400 text-xs font-bold font-mono border border-indigo-100/60 dark:border-indigo-900/30 shadow-3xs">
              <RefreshCw className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-405 animate-spin shrink-0" />
              <span>Syncing...</span>
            </div>
          )}

          {syncStatus === "Online" && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-955/35 text-emerald-800 dark:text-emerald-400 text-xs font-bold font-mono border border-emerald-100/60 dark:border-emerald-900/30 shadow-3xs">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>Online</span>
            </div>
          )}
        </div>
      </div>

      {/* REAL-TIME SYNCING & LOADING PROGRESS STATION */}
      {(isLoading || isSyncing) && (
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-3xl border border-indigo-100/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3 text-left w-full md:w-auto">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/35 shrink-0">
              <RefreshCw className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">
                {isLoading ? "Fetching Google Drive Files..." : "Synchronizing Storage Assets..."}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                {isLoading 
                  ? `Populating file metadata nodes. Connected to Secure Drive folder with ${files.length} node(s) loaded...`
                  : `Broadcasting layout state changes. Real-time syncing ${files.length} active workspace file(s)...`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 w-full md:w-80 shrink-0 font-sans">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1.5 leading-none">
                <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-mono">
                  {isLoading ? "Registry fetch" : "Syncloop Active"}
                </span>
                <span className="text-[9.5px] font-extrabold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded-md font-mono border border-slate-200/40 dark:border-slate-800/60">
                  {files.length} files tracked
                </span>
              </div>
              <div id="drive-sync-progress-bar-container" className="h-1.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-205/10">
                <div 
                  id="drive-sync-progress-bar-fill"
                  className="h-full bg-gradient-to-r from-indigo-505 via-indigo-650 to-emerald-500 rounded-full transition-all duration-500 animate-pulse" 
                  style={{ width: isLoading ? "65%" : "100%" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Drop Zone / Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 cursor-pointer overflow-hidden ${
          isDragOver
            ? "border-emerald-500 bg-emerald-50/40 dark:border-emerald-500 dark:bg-emerald-950/20 scale-[0.99] shadow-inner"
            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 hover:shadow-md"
        }`}
        id="drive-drop-zone"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center justify-center space-y-3 animate-pulse">
            <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin" />
            <span className="text-xs font-bold text-slate-800 dark:text-white">
              Uploading files to drive folder...
            </span>
            <p className="text-[11px] text-slate-450 dark:text-slate-505">
              Please don't close this window during the import process.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-full border border-slate-100 dark:border-slate-850">
              <UploadCloud className={`w-8 h-8 ${isDragOver ? "text-emerald-500 animate-bounce" : "text-slate-400 dark:text-slate-550"}`} />
            </div>
            
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                Drag & Drop files from your desktop
              </h4>
              <p className="text-[11.5px] text-slate-450 dark:text-slate-500 max-w-sm mx-auto">
                Or <span className="text-emerald-500 font-semibold underline">browse local files</span> to upload instantly to your specific <span className="font-semibold text-slate-700 dark:text-slate-350">{currentPath[currentPath.length - 1]?.name || "ToolkitPro"}</span> folder on Google Drive.
              </p>
            </div>
          </div>
        )}

        {/* Global Notifications for Upload status */}
        {uploadStatus && (
          <div
            className={`absolute inset-x-0 bottom-0 py-2.5 px-4 text-[11px] font-semibold text-center border-t flex items-center justify-center gap-1.5 transition-all ${
              uploadStatus.success
                ? "bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900/40 dark:text-emerald-300"
                : "bg-rose-50 border-rose-100 text-rose-800 dark:bg-rose-955/40 dark:border-rose-900/40 dark:text-rose-300"
            }`}
            onClick={(e) => {
              e.stopPropagation(); // Prevent file picker opening when dismissing message
              setUploadStatus(null);
            }}
          >
            {uploadStatus.success ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            )}
            <span className="truncate">{uploadStatus.msg}</span>
            <span className="text-[9px] font-normal text-slate-400 dark:text-slate-550 ml-1 leading-none hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
              (Dismiss)
            </span>
          </div>
        )}
      </div>

      {/* Search, Filters, and Sorting Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex flex-col gap-4 shadow-sm animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input with inline helper tags */}
          <div className="relative flex-1 max-w-md flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or date (e.g. June, 2026)..."
              className="w-full text-xs pl-10 pr-20 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-slate-800 dark:focus:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-905 dark:text-white shadow-inner"
            />
            {search ? (
              <div className="absolute right-2 flex items-center gap-1.5">
                <span className="text-[9px] font-bold text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded">
                  {currentFiles.length} found
                </span>
                <button
                  onClick={() => setSearch("")}
                  className="text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-350 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold cursor-pointer"
                  title="Clear search"
                >
                  ×
                </button>
              </div>
            ) : (
              <span className="absolute right-3.5 text-[10px] font-bold text-slate-300 dark:text-slate-655 pointer-events-none">
                Ctrl + F
              </span>
            )}
          </div>

          {/* Action buttons (SEO Audit, CSV Download & Sync Refresh) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* SEO Best Practices Pre-Check Button */}
            {onOpenSeoModal && (
              <button
                onClick={() => onOpenSeoModal({ title: "google-drive-project.png", category: "Web Graphics" })}
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-700 hover:to-teal-700 text-white rounded-xl px-4 py-2 font-bold text-xs cursor-pointer transition-all select-none shadow-3xs hover:shadow-xs"
                title="Perform interactive SEO audit before archiving files to Google Drive"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
                <span>SEO Best Practices Audit</span>
              </button>
            )}

            {/* Download CSV Button */}
            <button
              onClick={handleDownloadCSV}
              disabled={currentFiles.length === 0}
              className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 text-indigo-750 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-900/60 rounded-xl px-4 py-2 font-bold text-xs cursor-pointer disabled:opacity-40 transition-all select-none shadow-3xs hover:shadow-xs"
              id="btn-download-drive-csv"
              title="Download currently displayed file details as a CSV sheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>

            {/* Sync Manual Refresh */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl px-4 py-2 font-bold text-xs cursor-pointer disabled:opacity-50 transition-all select-none shadow-3xs hover:shadow-xs"
              id="btn-refresh-drive-list"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-500 ${isLoading ? "animate-spin" : ""}`} />
              <span>Sync Cloud Storage</span>
            </button>
          </div>
        </div>

        <div className="h-px bg-slate-100 dark:bg-slate-800/60" />

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1.5 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-indigo-500" /> Filter:
            </span>
            {[
              { id: "all", label: "All Items" },
              { id: "quote", label: "Quote Cards" },
              { id: "compress", label: "JPEG Compressions" },
              { id: "qr", label: "QR Codes" },
              { id: "palette", label: "Color Palettes" },
              { id: "general", label: "Your Uploads" },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setFilterType(type.id as any)}
                className={`px-3 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
                  filterType === type.id
                    ? "bg-slate-950 dark:bg-indigo-650 border-slate-900 dark:border-indigo-600 text-white shadow"
                    : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Sorting controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" /> Order By:
            </span>
            
            <div className="bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-850 flex items-center text-xs">
              {[
                { id: "date", label: "Date Modified" },
                { id: "size", label: "File Size" },
                { id: "name", label: "File Name" },
                { id: "custom", label: "Custom Drag Order" },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSortBy(option.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer select-none flex items-center gap-1 ${
                    sortBy === option.id
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-855 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  {option.id === "custom" && <GripVertical className="w-3 h-3 text-indigo-500" />}
                  {option.label}
                </button>
              ))}
            </div>

            {customOrderMap[currentFolderId || appRootId || "root"]?.length > 0 && (
              <button
                type="button"
                onClick={resetCustomOrder}
                className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-450 hover:text-indigo-600 dark:hover:text-amber-400 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Reset custom drag layout back to default date modified sort"
              >
                Reset Drag Order
              </button>
            )}

            <button
              onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-205 border border-slate-200/50 dark:border-slate-850 flex items-center gap-1 font-bold cursor-pointer transition-all shadow-3xs"
              title={sortOrder === "asc" ? "Sorted Ascending - click to reverse" : "Sorted Descending - click to reverse"}
              id="btn-toggle-sort-order"
            >
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider select-none">
                Direction:
              </span>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 ml-0.5 uppercase tracking-wide">
                {sortOrder === "asc" ? "Asc (A-Z / Oldest)" : "Desc (Z-A / Newest)"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Directory Browser Subbar */}
      {accessToken && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 rounded-2xl border border-slate-150 dark:border-slate-800/60 shadow-xs">
          {/* Left Side: Path Breadcrumbs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto py-1 scrollbar-none text-xs text-slate-550 custom-scrollbar">
            {currentPath.length > 1 && (() => {
              const parentFolder = currentPath[currentPath.length - 2];
              const isDropTarget = dragOverTargetId === parentFolder.id && dragOverTargetType === "breadcrumb";
              return (
                <button
                  type="button"
                  onClick={() => navigateToFolderFromBreadcrumb(currentPath.length - 2)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (draggedFileId) {
                      setDragOverTargetId(parentFolder.id);
                      setDragOverTargetType("breadcrumb");
                      e.dataTransfer.dropEffect = "move";
                    }
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (dragOverTargetId === parentFolder.id) {
                      setDragOverTargetId(null);
                      setDragOverTargetType(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverTargetId(null);
                    setDragOverTargetType(null);
                    const fileIds = draggedFileIds.length > 0 ? draggedFileIds : (draggedFileId ? [draggedFileId] : []);
                    if (fileIds.length > 0) {
                      handleMoveFilesToFolder(fileIds, parentFolder.id, parentFolder.name);
                    }
                  }}
                  className={`mr-1 p-1 px-2 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-3xs ${
                    isDropTarget
                      ? "bg-emerald-500 text-white ring-2 ring-emerald-400 scale-105"
                      : "bg-slate-200/60 dark:bg-slate-800/80 hover:bg-slate-300/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-305"
                  }`}
                  title={`Go up or drag file(s) here to move to parent folder (${parentFolder.name})`}
                  id="btn-drive-up-one-level"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
                  <span className="text-[10px] font-bold">Up</span>
                </button>
              );
            })()}
            <Folder className="w-4 h-4 text-emerald-500 shrink-0" />
            {currentPath.map((folder, index) => {
              const isBreadcrumbDropTarget = dragOverTargetId === folder.id && dragOverTargetType === "breadcrumb";
              const isLast = index === currentPath.length - 1;
              return (
                <React.Fragment key={folder.id}>
                  {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-350 shrink-0" />}
                  <button
                    type="button"
                    onClick={() => navigateToFolderFromBreadcrumb(index)}
                    onDragOver={(e) => {
                      if (isLast) return;
                      e.preventDefault();
                      e.stopPropagation();
                      if (draggedFileId) {
                        setDragOverTargetId(folder.id);
                        setDragOverTargetType("breadcrumb");
                        e.dataTransfer.dropEffect = "move";
                      }
                    }}
                    onDragLeave={(e) => {
                      if (isLast) return;
                      e.preventDefault();
                      e.stopPropagation();
                      if (dragOverTargetId === folder.id) {
                        setDragOverTargetId(null);
                        setDragOverTargetType(null);
                      }
                    }}
                    onDrop={(e) => {
                      if (isLast) return;
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverTargetId(null);
                      setDragOverTargetType(null);
                      const fileIds = draggedFileIds.length > 0 ? draggedFileIds : (draggedFileId ? [draggedFileId] : []);
                      if (fileIds.length > 0) {
                        handleMoveFilesToFolder(fileIds, folder.id, folder.name);
                      }
                    }}
                    className={`font-semibold shrink-0 rounded px-1.5 py-0.5 transition-all ${
                      isBreadcrumbDropTarget
                        ? "bg-emerald-500 text-white font-bold ring-2 ring-emerald-400 scale-105"
                        : isLast
                        ? "text-slate-905 dark:text-white pointer-events-none font-bold"
                        : "text-slate-500 dark:text-slate-400 hover:text-indigo-650 dark:hover:text-indigo-400 hover:underline"
                    }`}
                    title={!isLast ? `Click to navigate or drop file(s) here to move to ${folder.name}` : undefined}
                  >
                    {folder.name}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {/* Right Side: viewMode buttons + "Create Folder" button */}
          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="bg-slate-200/65 dark:bg-slate-955 p-1 rounded-xl border border-slate-200/50 dark:border-slate-850 flex items-center text-xs">
              <button
                type="button"
                onClick={() => setViewMode("tree")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer select-none ${
                  viewMode === "tree"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                Folder view
              </button>
              <button
                type="button"
                onClick={() => setViewMode("flat")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer select-none ${
                  viewMode === "flat"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-505 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                Flat view
              </button>
            </div>

            {/* Display Mode Switcher (Grid vs List) */}
            <div className="bg-slate-200/65 dark:bg-slate-955 p-1 rounded-xl border border-slate-200/50 dark:border-slate-850 flex items-center text-xs gap-0.5">
              <button
                type="button"
                onClick={() => setDisplayMode("grid")}
                className={`p-1 px-2.5 rounded-lg font-bold transition-all cursor-pointer select-none flex items-center gap-1.5 ${
                  displayMode === "grid"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode("list")}
                className={`p-1 px-2.5 rounded-lg font-bold transition-all cursor-pointer select-none flex items-center gap-1.5 ${
                  displayMode === "list"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-505 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>

            {/* Create Folder button */}
            <button
              type="button"
              onClick={() => {
                setNewFolderName("");
                setShowCreateModal(true);
              }}
              disabled={!accessToken}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-350 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/60 px-3 py-2 rounded-xl transition-all cursor-pointer select-none disabled:opacity-50"
              id="btn-create-folder"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Create Folder</span>
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-extrabold font-mono">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-505" />
            <span>SYNCLOOP IN PROGRESS: PREFETCHING SECURE STORAGE NODES...</span>
          </div>

          <div className="space-y-8 text-left w-full">
            {/* Folder Skeletons Grid (only when tree mode is active) */}
            {viewMode === "tree" && (
              <div className="space-y-3">
                <h5 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 pl-1 flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 animate-pulse" />
                  <span>Loading Folders...</span>
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={`folder-sk-${i}`}
                      className="bg-white dark:bg-slate-900 px-4 py-3.5 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between shadow-2xs"
                    >
                      <div className="flex items-center space-x-3 w-full">
                        <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-xl w-8 h-8 shrink-0 flex items-center justify-center">
                          <div className="w-4 h-4 rounded-md shimmer opacity-80" />
                        </div>
                        <div className="h-3 w-2/3 rounded-lg shimmer opacity-80" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File Skeletons Grid */}
            <div className="space-y-3">
              <h5 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5 pl-1">
                <FileImage className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 animate-pulse" />
                <span>Loading Files...</span>
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={`file-sk-${i}`}
                    className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 overflow-hidden shadow-sm flex flex-col justify-between"
                  >
                    {/* Upper thumbnail container skeleton */}
                    <div className="h-36 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-50 dark:border-slate-850/60 flex items-center justify-center relative overflow-hidden">
                      {/* Category Badge skeleton */}
                      <div className="absolute top-2.5 left-2.5 h-5 w-12 rounded bg-slate-200 dark:bg-slate-800 shimmer" />
                      
                      {/* Checkbox skeleton */}
                      <div className="absolute top-2.5 right-2.5 h-5.5 w-5.5 rounded-lg bg-slate-200 dark:bg-slate-800 shimmer" />

                      {/* Center Image Placeholder */}
                      <FileImage className="w-10 h-10 text-slate-200/60 dark:text-slate-800/40" />
                    </div>

                    {/* File Info parameters skeleton */}
                    <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between text-left">
                      <div>
                        <div className="h-3.5 w-5/6 rounded-lg shimmer" />
                        <div className="h-2.5 w-1/3 rounded-md mt-2.5 shimmer" />
                      </div>

                      {/* Action drawers skeleton */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-850 text-xs">
                        <div className="flex items-center gap-1">
                          <div className="h-7.5 w-8 rounded-lg bg-slate-105 dark:bg-slate-850 shimmer" />
                          <div className="h-7.5 w-8 rounded-lg bg-slate-105 dark:bg-slate-850 shimmer" />
                        </div>
                        <div className="h-7.5 w-16 rounded-lg bg-slate-105 dark:bg-slate-850 shimmer" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : viewMode === "tree" && currentFolders.length === 0 && currentFiles.length === 0 ? (
        /* Empty Folder / Directory state */
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[260px] shadow-sm animate-fade-in">
          <Folder className="w-12 h-12 text-slate-200 dark:text-slate-700 mb-2" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">This folder is empty</h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm leading-relaxed">
            Drag-and-drop elements or upload files here to save them directly to <span className="font-semibold text-slate-700 dark:text-slate-350">{currentPath[currentPath.length - 1]?.name}</span>, or click "Create Folder" to set up further custom subdivisions.
          </p>
        </div>
      ) : currentFiles.length === 0 && viewMode === "flat" ? (
        /* Empty Flat Filter / Search state */
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[260px] shadow-sm animate-fade-in">
          <Cloud className="w-12 h-12 text-slate-200 dark:text-slate-700 mb-2" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">No synchronized files found</h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mt-1 mb-6 leading-relaxed">
            {search || filterType !== "all"
              ? "We couldn't match any saved assets with your current search criteria."
              : "Your custom Google Drive file list is empty! Open creative modules and click 'Save to Google Drive' to secure templates in your cloud space."}
          </p>
          {(search || filterType !== "all") ? (
            <button
              onClick={() => {
                setSearch("");
                setFilterType("all");
              }}
              className="text-xs font-semibold text-slate-900 dark:text-slate-300 border border-slate-200 dark:border-slate-800 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl bg-white dark:bg-slate-950 cursor-pointer"
            >
              Reset Filters
            </button>
          ) : (
            <div className="flex flex-wrap gap-3 font-semibold text-xs justify-center">
              <button
                onClick={() => onSelectTab("quote")}
                className="bg-slate-950 dark:bg-indigo-650 text-white rounded-xl px-4 py-2 hover:bg-slate-900 dark:hover:bg-indigo-700 shadow transition-colors cursor-pointer"
                id="btn-goto-quote"
              >
                Create Quote Card
              </button>
              <button
                onClick={() => onSelectTab("compress")}
                className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                id="btn-goto-compress"
              >
                Compress Image
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Composite Folders and Files content spaces */
        <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
          <div className="flex-1 space-y-8 text-left animate-fade-in w-full">
          {/* FOLDERS GRID PANEL */}
          {viewMode === "tree" && currentFolders.length > 0 && (
            <div className="space-y-3">
              <h5 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 pl-1 flex items-center gap-1.5 scroll-mt-6">
                <Folder className="w-3.5 h-3.5 text-slate-450" />
                Folders ({currentFolders.length})
              </h5>
              <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                <AnimatePresence mode="popLayout">
                  {currentFolders.map((folder) => {
                    const isFolderDropTarget = dragOverTargetId === folder.id && dragOverTargetType === "folder";
                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        key={folder.id}
                        onClick={() => enterFolder(folder)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (draggedFileId) {
                            setDragOverTargetId(folder.id);
                            setDragOverTargetType("folder");
                            e.dataTransfer.dropEffect = "move";
                          }
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (dragOverTargetId === folder.id) {
                            setDragOverTargetId(null);
                            setDragOverTargetType(null);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOverTargetId(null);
                          setDragOverTargetType(null);
                          const fileIds = draggedFileIds.length > 0 ? draggedFileIds : (draggedFileId ? [draggedFileId] : []);
                          if (fileIds.length > 0) {
                            handleMoveFilesToFolder(fileIds, folder.id, folder.name);
                          }
                        }}
                        className={`relative bg-white dark:bg-slate-900 px-4 py-3.5 border rounded-2xl flex items-center justify-between group cursor-pointer transition-all text-left ${
                          isFolderDropTarget
                            ? "ring-2 ring-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/80 border-emerald-500 scale-105 shadow-md z-10"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 hover:shadow-xs"
                        }`}
                      >
                        {isFolderDropTarget && (
                          <div className="absolute -top-2.5 right-2 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 z-20 animate-bounce">
                            <Folder className="w-3 h-3 fill-current" />
                            <span>Move {draggedFileIds.length > 1 ? `${draggedFileIds.length} files` : "here"}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <div className={`p-2 rounded-xl group-hover:scale-105 transition-all ${
                            isFolderDropTarget ? "bg-emerald-600 text-white" : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                          }`}>
                            <Folder className="w-4 h-4 fill-emerald-100 dark:fill-emerald-900" />
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-white truncate" title={folder.name}>
                            {highlightMatch(folder.name, search)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerRename(folder, true);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-indigo-650 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-all cursor-pointer flex items-center justify-center"
                            title="Rename folder"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerDelete(folder, true);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-650 dark:hover:text-rose-455 hover:bg-rose-50 dark:hover:bg-rose-955/20 transition-all cursor-pointer flex items-center justify-center"
                            title="Permanently remove folder"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
          {/* FILES GRID PANEL */}
          <div className="space-y-3">
            {currentFiles.length > 0 && (
              <div className="flex items-center justify-between pb-1 pl-1 pt-2">
                <h5 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <FileImage className="w-3.5 h-3.5 text-slate-450" />
                  Files ({currentFiles.length})
                </h5>
                <button
                  type="button"
                  onClick={() => {
                    const allVisibleIds = currentFiles.map((f) => f.id);
                    const allSelected = allVisibleIds.every((id) => selectedFileIds.includes(id));
                    if (allSelected) {
                      setSelectedFileIds((prev) => prev.filter((id) => !allVisibleIds.includes(id)));
                    } else {
                      setSelectedFileIds((prev) => {
                        const next = [...prev];
                        allVisibleIds.forEach((id) => {
                          if (!next.includes(id)) next.push(id);
                        });
                        return next;
                      });
                    }
                  }}
                  className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-indigo-600 dark:hover:text-amber-400 px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none"
                >
                  {currentFiles.every((f) => selectedFileIds.includes(f.id))
                    ? "✓ Deselect All"
                    : "⚬ Select All"}
                </button>
              </div>
            )}

            {currentFiles.length === 0 && viewMode === "tree" && currentFolders.length > 0 ? (
              <div className="text-center text-xs text-slate-400 dark:text-slate-500 italic py-6">
                No files inside this directory. Navigate to one of the folders above or upload files directly.
              </div>
            ) : displayMode === "grid" ? (
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                  {currentFiles.map((file) => {
                    const cat = getFileCategory(file.name);
                    const globalIndex = currentFiles.indexOf(file);
                    const isSelected = selectedFileIds.includes(file.id);
                    const isDragSource = draggedFileId === file.id;
                    const isFileDropTarget = dragOverTargetId === file.id && dragOverTargetType === "file";

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        key={file.id}
                        draggable={true}
                        onDragStart={(e) => {
                          const fileIds = selectedFileIds.includes(file.id) ? selectedFileIds : [file.id];
                          setDraggedFileId(file.id);
                          setDraggedFileIds(fileIds);
                          e.dataTransfer.setData("application/json", JSON.stringify({ type: "drive-files", fileIds }));
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={() => {
                          setDraggedFileId(null);
                          setDraggedFileIds([]);
                          setDragOverTargetId(null);
                          setDragOverTargetType(null);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (draggedFileId && draggedFileId !== file.id) {
                            setDragOverTargetId(file.id);
                            setDragOverTargetType("file");
                            e.dataTransfer.dropEffect = "move";
                          }
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (dragOverTargetId === file.id) {
                            setDragOverTargetId(null);
                            setDragOverTargetType(null);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const targetId = file.id;
                          setDragOverTargetId(null);
                          setDragOverTargetType(null);

                          if (draggedFileId && draggedFileId !== targetId) {
                            handleReorderFiles(draggedFileId, targetId);
                          }
                        }}
                        onClick={() => setSelectedPreviewFile(file)}
                        onDoubleClick={() => {
                          setPreviewIndex(globalIndex);
                          setSelectedPreviewFile(file);
                        }}
                        className={`relative bg-white dark:bg-slate-950 rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group animate-fade-in cursor-pointer ${
                          isDragSource ? "opacity-40 scale-95 border-dashed border-indigo-500" : ""
                        } ${
                          isFileDropTarget
                            ? "ring-2 ring-indigo-500 border-indigo-500 scale-[1.02] shadow-xl bg-indigo-50/40 dark:bg-indigo-950/30 z-10"
                            : isSelected
                            ? "ring-2 ring-emerald-500 border-transparent bg-emerald-500/[0.02]"
                            : "border-slate-100 dark:border-slate-850"
                        } ${
                          selectedPreviewFile?.id === file.id && !isFileDropTarget
                            ? "ring-2 ring-indigo-500 dark:ring-indigo-500 border-transparent bg-indigo-50/20 dark:bg-indigo-950/5"
                            : ""
                        }`}
                      >
                      {/* Reorder Drop Target Floating Badge */}
                      {isFileDropTarget && (
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 z-30 animate-pulse pointer-events-none">
                          <GripVertical className="w-3.5 h-3.5" />
                          <span>Drop to Reorder Here</span>
                        </div>
                      )}

                      {/* Drag Handle Indicator */}
                      <div
                        className="absolute top-2.5 left-2.5 z-10 p-1.5 rounded-lg bg-slate-900/60 backdrop-blur-xs text-white opacity-0 group-hover:opacity-80 hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity shadow-xs"
                        title="Drag to reorder or drop onto a folder"
                      >
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>
                      {/* Upper thumbnail preview container */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewIndex(globalIndex);
                          setSelectedPreviewFile(file);
                        }}
                        className="h-36 bg-slate-55 dark:bg-slate-900 border-b border-slate-50 dark:border-slate-850/60 flex items-center justify-center relative select-none cursor-pointer overflow-hidden"
                      >
                        {/* Checkbox Selector Overlay */}
                        <div
                          onClick={(e) => toggleSelectFile(file.id, e)}
                          className="absolute top-2.5 right-2.5 z-10"
                          title={isSelected ? "Deselect item" : "Select item"}
                        >
                          <div className={`w-5.5 h-5.5 rounded-lg border flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-emerald-500 border-emerald-600 text-white scale-105 shadow"
                              : "bg-slate-955/40 border-slate-700 hover:bg-slate-955/60 text-white opacity-40 group-hover:opacity-100"
                          }`}>
                            {isSelected ? (
                              <Check className="w-4 h-4 text-white stroke-[3.5]" />
                            ) : (
                              <div className="w-2 h-2 rounded bg-transparent" />
                            )}
                          </div>
                        </div>

                        {file.thumbnailLink ? (
                          <img
                            src={file.thumbnailLink}
                            alt={file.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform group-hover:scale-102"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex flex-col items-center text-slate-400">
                            <FileImage className="w-10 h-10 text-slate-300 dark:text-slate-650" />
                          </div>
                        )}

                        {/* Hover Quick Preview Action */}
                        <div className="absolute inset-0 bg-slate-955/40 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <span className="inline-flex items-center gap-1.5 bg-white text-slate-900 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-md transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                            <Eye className="w-3.5 h-3.5 text-indigo-505" />
                            Preview File
                          </span>
                        </div>

                        {/* Thumbnail Badge categorization overlays */}
                        <span className="absolute top-2.5 left-2.5 inline-flex items-center rounded-md bg-slate-955 dark:bg-slate-900/90 px-2 py-1 text-[10px] font-bold text-white shadow uppercase tracking-wide">
                          {cat}
                        </span>
                      </div>

                      {/* File Info parameters */}
                      <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between text-left">
                        <div onClick={(e) => { e.stopPropagation(); setSelectedPreviewFile(file); }}>
                          <h5 className="text-xs font-bold text-slate-800 dark:text-white truncate" title={file.name}>
                            {highlightMatch(file.name, search)}
                          </h5>
                          <p className="text-[10px] text-slate-450 dark:text-slate-550 mt-0.5">
                            Uploaded on {new Date(file.createdTime).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Action drawers */}
                        <div className="flex items-center space-x-1 pt-2 border-t border-slate-100 dark:border-slate-850 text-xs">
                          {/* Fast Preview Eye Action */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewIndex(globalIndex);
                              setSelectedPreviewFile(file);
                            }}
                            className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-707 dark:text-slate-300 transition-all gap-1 cursor-pointer"
                            title="Sleek File Preview"
                            id={`btn-preview-${file.id}`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Organize file structure location */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMovingFile(file);
                            }}
                            className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-707 dark:text-slate-300 transition-all gap-1 cursor-pointer"
                            title="Move file to another folder"
                          >
                            <Move className="w-3.5 h-3.5 text-slate-400" />
                          </button>

                          {/* View File in Google Drive link */}
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 inline-flex items-center justify-center px-1 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-905 text-slate-707 dark:text-slate-300 font-semibold text-[10px] bg-white dark:bg-slate-900 transition-all gap-1 cursor-pointer"
                          >
                            View
                            <ExternalLink className="w-3.0 h-3.0 text-slate-400 shrink-0" />
                          </a>

                          {/* Rename single file item */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerRename(file, false);
                            }}
                            className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-455 dark:text-slate-505 hover:text-indigo-650 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/40 transition-all cursor-pointer"
                            title="Rename file"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete item secure dispatch */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerDelete(file, false);
                            }}
                            disabled={isDeletingId === file.id}
                            className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-455 dark:text-slate-505 hover:text-rose-600 dark:hover:text-rose-455 hover:bg-rose-50 dark:hover:bg-rose-955/20 border border-transparent hover:border-rose-100 dark:hover:border-rose-900/40 transition-all cursor-pointer"
                            title="Permanently remove file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="border border-slate-150 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-white dark:bg-slate-950 shadow-xs animate-fade-in text-left">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-150 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/30 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4 w-12 text-center select-none">Select</th>
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4 hidden md:table-cell">Category</th>
                        <th className="py-3 px-4 hidden sm:table-cell">Uploaded On</th>
                        <th className="py-3 px-4 text-right pr-6 select-none">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                      {currentFiles.map((file) => {
                        const cat = getFileCategory(file.name);
                        const globalIndex = currentFiles.indexOf(file);
                        const isSelected = selectedFileIds.includes(file.id);
                        const isHighlighted = selectedPreviewFile?.id === file.id;
                        const isDragSource = draggedFileId === file.id;
                        const isRowDropTarget = dragOverTargetId === file.id && dragOverTargetType === "file";

                        return (
                          <tr
                            key={file.id}
                            draggable={true}
                            onDragStart={(e) => {
                              const fileIds = selectedFileIds.includes(file.id) ? selectedFileIds : [file.id];
                              setDraggedFileId(file.id);
                              setDraggedFileIds(fileIds);
                              e.dataTransfer.setData("application/json", JSON.stringify({ type: "drive-files", fileIds }));
                              e.dataTransfer.effectAllowed = "move";
                            }}
                            onDragEnd={() => {
                              setDraggedFileId(null);
                              setDraggedFileIds([]);
                              setDragOverTargetId(null);
                              setDragOverTargetType(null);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (draggedFileId && draggedFileId !== file.id) {
                                setDragOverTargetId(file.id);
                                setDragOverTargetType("file");
                                e.dataTransfer.dropEffect = "move";
                              }
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (dragOverTargetId === file.id) {
                                setDragOverTargetId(null);
                                setDragOverTargetType(null);
                              }
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const targetId = file.id;
                              setDragOverTargetId(null);
                              setDragOverTargetType(null);

                              if (draggedFileId && draggedFileId !== targetId) {
                                handleReorderFiles(draggedFileId, targetId);
                              }
                            }}
                            onClick={() => setSelectedPreviewFile(file)}
                            onDoubleClick={() => {
                              setPreviewIndex(globalIndex);
                              setSelectedPreviewFile(file);
                            }}
                            className={`group hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors cursor-pointer text-xs ${
                              isDragSource ? "opacity-40 bg-slate-100 dark:bg-slate-900" : ""
                            } ${
                              isRowDropTarget
                                ? "ring-2 ring-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40"
                                : isHighlighted
                                ? "bg-indigo-50/15 dark:bg-indigo-950/5"
                                : ""
                            }`}
                          >
                            {/* Checkbox & Drag Handle */}
                            <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1">
                                <span className="cursor-grab active:cursor-grabbing text-slate-350 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-300 opacity-60 group-hover:opacity-100 transition-opacity">
                                  <GripVertical className="w-3.5 h-3.5" />
                                </span>
                                <div
                                  onClick={(e) => toggleSelectFile(file.id, e)}
                                  className="inline-flex cursor-pointer"
                                  title={isSelected ? "Deselect item" : "Select item"}
                                >
                                  <div className={`w-5.5 h-5.5 rounded-lg border flex items-center justify-center transition-all ${
                                    isSelected
                                      ? "bg-emerald-500 border-emerald-600 text-white scale-105 shadow"
                                      : "bg-transparent border-slate-300 dark:border-slate-700 hover:border-slate-400"
                                  }`}>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3.5]" />}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Name & Thumbnail */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-105 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center shrink-0">
                                  {file.thumbnailLink ? (
                                    <img
                                      src={file.thumbnailLink}
                                      alt={file.name}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <FileImage className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                                  )}
                                </div>
                                <div className="min-w-0 max-w-[180px] sm:max-w-xs md:max-w-md lg:max-w-lg">
                                  <div className="font-bold text-slate-800 dark:text-white truncate" title={file.name}>
                                    {highlightMatch(file.name, search)}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="py-3.5 px-4 hidden md:table-cell">
                              <span className="inline-flex items-center rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[9px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                {cat}
                              </span>
                            </td>

                            {/* Uploaded On */}
                            <td className="py-3.5 px-4 hidden sm:table-cell text-slate-450 dark:text-slate-500 font-medium font-mono text-[10.5px]">
                              {new Date(file.createdTime).toLocaleDateString()}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                              <div className="inline-flex items-center gap-1">
                                {/* Fast Preview Eye Action */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewIndex(globalIndex);
                                    setSelectedPreviewFile(file);
                                  }}
                                  className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-250 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-707 dark:text-slate-300 transition-all cursor-pointer"
                                  title="Sleek File Preview"
                                  id={`list-btn-preview-${file.id}`}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                {/* Organize file structure location */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMovingFile(file);
                                  }}
                                  className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-250 dark:border-slate-800 hover:bg-slate-55 dark:hover:bg-slate-900 text-slate-707 dark:text-slate-300 transition-all cursor-pointer"
                                  title="Move file to another folder"
                                >
                                  <Move className="w-3.5 h-3.5 text-slate-400" />
                                </button>

                                {/* View File in Google Drive link */}
                                <a
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center px-2 py-1.5 rounded-lg border border-slate-250 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-707 dark:text-slate-300 font-bold text-[10px] bg-white dark:bg-slate-900 transition-all gap-1 cursor-pointer"
                                >
                                  View
                                  <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                                </a>

                                {/* Rename single file item */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    triggerRename(file, false);
                                  }}
                                  className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-505 hover:text-indigo-650 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-955/20 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/40 transition-all cursor-pointer"
                                  title="Rename file"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete item secure dispatch */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    triggerDelete(file, false);
                                  }}
                                  disabled={isDeletingId === file.id}
                                  className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-505 hover:text-rose-605 dark:hover:text-rose-455 hover:bg-rose-50 dark:hover:bg-rose-955/20 border border-transparent hover:border-rose-100 dark:hover:border-rose-900/40 transition-all cursor-pointer"
                                  title="Permanently remove file"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR DETAILED PREVIEW AND METADATA PANE */}
          {selectedPreviewFile && (() => {
            const cat = getFileCategory(selectedPreviewFile.name);

            return (
              <div 
                className="w-full lg:w-80 shrink-0 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-lg space-y-5 animate-scale-up lg:sticky lg:top-4 text-left"
                id="file-sidebar-preview"
              >
                {/* Header title */}
                <div className="flex items-center justify-between pb-1 font-sans select-none">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-505 uppercase tracking-widest font-mono">
                    File Details
                  </span>
                  <button
                    onClick={() => setSelectedPreviewFile(null)}
                    className="p-1 px-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-colors"
                    title="Close Details Pane"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Main Visual Representation */}
                <div className="relative bg-slate-50/70 dark:bg-black/20 rounded-2xl min-h-[160px] flex items-center justify-center border border-slate-100 dark:border-slate-850 overflow-hidden group">
                  {selectedPreviewFile.thumbnailLink ? (
                    <img
                      src={getHiResImage(selectedPreviewFile.thumbnailLink)}
                      alt={selectedPreviewFile.name}
                      referrerPolicy="no-referrer"
                      className="max-h-[150px] max-w-full object-contain p-2 rounded-xl transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center space-y-2 text-slate-400 dark:text-slate-500">
                      <div className="p-3.5 bg-slate-100 dark:bg-slate-850 rounded-full">
                        <FileImage className="w-8 h-8 text-indigo-550 dark:text-indigo-400" />
                      </div>
                      <span className="text-[9px] uppercase tracking-wider font-bold">No High-Res Thumbnail</span>
                    </div>
                  )}

                  {/* Icon badge overlay */}
                  <span className="absolute top-2.5 left-2.5 inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/40 px-2 py-0.5 text-[9px] font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-wide">
                    {cat}
                  </span>
                </div>

                {/* File Specs metadata details */}
                <div className="space-y-4 font-sans text-xs">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white break-all leading-snug font-sans" title={selectedPreviewFile.name}>
                      {selectedPreviewFile.name}
                    </h4>
                    <p className="text-[10px] text-slate-455 dark:text-slate-500 truncate font-mono">
                      {selectedPreviewFile.mimeType}
                    </p>
                  </div>

                  <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3.5 text-[11px] leading-snug select-none">
                    {selectedPreviewFile.size && (
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-450">File Size:</span>
                        <span className="font-mono text-slate-850 dark:text-slate-200 font-bold">{formatBytes(selectedPreviewFile.size)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-455">Uploaded:</span>
                      <span className="text-slate-850 dark:text-slate-205 font-semibold">{new Date(selectedPreviewFile.createdTime).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-455">ID Node:</span>
                      <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500 select-all truncate max-w-[120px]">{selectedPreviewFile.id}</span>
                    </div>
                  </div>
                </div>

                {/* Interaction CTA Actions */}
                <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-850 font-sans">
                  <a
                    href={selectedPreviewFile.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-605 hover:bg-indigo-700 text-white font-bold text-[11px] transition-all cursor-pointer text-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open in Google Drive
                  </a>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopyLink(selectedPreviewFile.webViewLink)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 text-[11px] font-bold cursor-pointer bg-white dark:bg-slate-900 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      Copy Link
                    </button>

                    <button
                      onClick={() => triggerRename(selectedPreviewFile, false)}
                      className="inline-flex items-center justify-center p-2 rounded-xl border border-slate-250 dark:border-slate-800 text-slate-705 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-all bg-white dark:bg-slate-900"
                      title="Rename file"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    <button
                      onClick={() => triggerDelete(selectedPreviewFile, false)}
                      className="inline-flex items-center justify-center p-2 rounded-xl border border-rose-250 dark:border-rose-950/25 text-rose-650 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-955/20 transition-all cursor-pointer"
                      title="Permanently Delete file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Interactive Lightbox / Modal File Preview */}
      {previewIndex !== null && currentFiles[previewIndex] && (() => {
        const previewFile = currentFiles[previewIndex];
        return (
          <div 
            className="fixed inset-0 z-50 overflow-y-auto flex items-start sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in scrollbar-thin"
            id="preview-file-modal"
            onClick={() => setPreviewIndex(null)}
          >
            <div 
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-100 dark:border-slate-800 overflow-hidden shadow-2xl flex flex-col md:flex-row my-8 sm:my-0 animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Portion: Big Image/File Type Visual representation or dynamic text contents */}
              <div className="relative md:w-3/5 bg-slate-50/50 dark:bg-black/20 min-h-[300px] md:min-h-[420px] flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 overflow-hidden">
                {isPreviewContentLoading ? (
                  <div className="flex flex-col items-center space-y-3 p-6 text-slate-400 dark:text-slate-500 select-none">
                    <RefreshCw className="w-8 h-8 text-indigo-505 animate-spin" />
                    <span className="text-[11px] font-bold tracking-wider font-mono animate-pulse uppercase">Fetching File Content...</span>
                  </div>
                ) : previewFileContent !== null ? (
                  /* RENDER FULL TEXT PREVIEW CONTENT WITH ELEGANT SCROLLABLE READER */
                  <div className="w-full h-full min-h-[300px] md:min-h-[420px] flex flex-col bg-slate-950 text-slate-100 text-left relative self-stretch">
                    <div className="px-4 py-2 bg-slate-900 border-b border-slate-850 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider select-none shrink-0">
                      <span className="truncate max-w-[170px] font-mono">{previewFile.name}</span>
                      <span className="font-mono text-indigo-400">{formatBytes(previewFile.size)}</span>
                    </div>
                    <div className="flex-1 overflow-auto p-4 font-mono text-[11px] leading-relaxed select-text selection:bg-indigo-500/35 scrollbar-thin max-h-[300px] md:max-h-[380px]">
                      <pre className="whitespace-pre-wrap break-all pr-2 font-mono whitespace-pre">{previewFileContent}</pre>
                    </div>
                  </div>
                ) : previewContentError ? (
                  /* CONTENT LOADING ERROR BLOCK */
                  <div className="flex flex-col items-center space-y-2.5 p-6 text-center select-none">
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-full border border-rose-100 dark:border-rose-900/30">
                      <AlertCircle className="w-6 h-6 text-rose-550 dark:text-rose-450" />
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wide">Error Fetching Preview</h5>
                      <p className="text-[10px] leading-relaxed max-w-[200px] text-slate-400 dark:text-slate-500 font-medium font-sans">
                        {previewContentError}
                      </p>
                    </div>
                  </div>
                ) : previewFile.thumbnailLink ? (
                  /* IMAGE VISUAL REPRESENTATION WITH AUTO-FIT SCROLL PREVIEW */
                  <div className="p-4 flex items-center justify-center overflow-auto max-h-[300px] md:max-h-[420px]">
                    <img
                      src={getHiResImage(previewFile.thumbnailLink)}
                      alt={previewFile.name}
                      referrerPolicy="no-referrer"
                      className="max-h-[280px] md:max-h-[380px] max-w-full object-contain rounded-2xl drop-shadow-lg transition-transform hover:scale-102"
                    />
                  </div>
                ) : (
                  /* FILE TYPE FALLBACK PREVIEW IF NONE OF THE ABOVE MATCH */
                  <div className="flex flex-col items-center space-y-2.5 text-slate-400 dark:text-slate-500 select-none">
                    <div className="p-5 bg-slate-100 dark:bg-slate-850 rounded-full">
                      <FileImage className="w-14 h-14 text-indigo-500" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-bold animate-fade-in">Preview not available</span>
                  </div>
                )}
 
                {/* Slider Navigation arrows - overlays on top of the preview display */}
                {previewIndex > 0 && (
                  <button
                    onClick={(e) => handlePrevPreview(e)}
                    className="absolute left-3 p-2.5 rounded-full bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-707 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-md transition-all cursor-pointer border border-slate-200/50 dark:border-slate-800 z-10"
                    title="Previous item"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                {previewIndex < currentFiles.length - 1 && (
                  <button
                    onClick={(e) => handleNextPreview(e)}
                    className="absolute right-3 p-2.5 rounded-full bg-white dark:bg-slate-955 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-707 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-md transition-all cursor-pointer border border-slate-200/50 dark:border-slate-800 z-10"
                    title="Next item"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Right Portion: File Info details & Interactive Actions */}
              <div className="md:w-2/5 p-6 flex flex-col justify-between text-left space-y-5">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <span className="inline-flex items-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/45 px-2.5 py-1 text-[9.5px] font-bold text-indigo-600 dark:text-indigo-300 uppercase tracking-widest leading-none">
                      {getFileCategory(previewFile.name)}
                    </span>
                    <button
                      onClick={() => setPreviewIndex(null)}
                      className="p-1 px-1.5 rounded-lg text-slate-400 dark:text-slate-555 hover:text-slate-855 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug break-all line-clamp-3" title={previewFile.name}>
                      {previewFile.name}
                    </h4>
                    <p className="text-[10px] text-slate-455 dark:text-slate-500 font-medium">
                      {previewFile.mimeType}
                    </p>
                  </div>

                  {/* Sub-details key fields */}
                  <div className="space-y-2.5 border-t border-slate-100 dark:border-slate-800 pt-3 text-[11px] leading-relaxed">
                    <div className="flex justify-between items-center text-slate-500">
                      <span className="font-semibold text-slate-450">File Size:</span>
                      <span className="font-mono text-slate-850 dark:text-slate-200 font-bold">{formatBytes(previewFile.size)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-505">
                      <span className="font-semibold text-slate-450">Registered:</span>
                      <span className="text-slate-850 dark:text-slate-200 font-semibold">{new Date(previewFile.createdTime).toLocaleDateString()} {new Date(previewFile.createdTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-505">
                      <span className="font-semibold text-slate-450">ID Handle:</span>
                      <span className="font-mono text-[9px] text-slate-400 dark:text-slate-505 select-all truncate max-w-[120px]">{previewFile.id}</span>
                    </div>
                  </div>
                </div>

                {/* Interaction drawer */}
                <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {copiedLink && (
                    <div className="bg-emerald-950/40 border border-emerald-850 text-emerald-400 py-1.5 rounded-xl text-[10px] font-semibold text-center flex items-center justify-center gap-1.5 animate-fade-in">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      Link successfully copied!
                    </div>
                  )}
                  
                  <a
                    href={previewFile.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow cursor-pointer text-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open in Google Drive
                  </a>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopyLink(previewFile.webViewLink)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer bg-white dark:bg-slate-900 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      Copy Link
                    </button>

                    <button
                      onClick={() => {
                        triggerRename(previewFile, false);
                      }}
                      className="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-all bg-white dark:bg-slate-905"
                      title="Rename file"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setPreviewIndex(null);
                        triggerDelete(previewFile, false);
                      }}
                      disabled={isDeletingId === previewFile.id}
                      className="inline-flex items-center justify-center p-2 rounded-xl border border-rose-200/60 dark:border-rose-950/30 text-rose-650 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
                      title="Permanently remove file from Google Drive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* CREATE FOLDER MODAL */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full border border-slate-100 dark:border-slate-850/80 overflow-hidden shadow-2xl p-6 space-y-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 text-emerald-600 dark:text-emerald-400">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-100 dark:border-emerald-900/25">
                <FolderPlus className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-905 dark:text-white">Create New Folder</h4>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Create a custom subdirectory folder under <span className="font-semibold text-slate-700 dark:text-slate-300">{currentPath[currentPath.length - 1]?.name || "ToolkitPro"}</span> to organize your automotive cards, compressed images, color palettes, and other synchronizations.
            </p>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1 font-mono">
                Folder Name
              </label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g. Marketing Q1, Client Pitch..."
                autoFocus
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-slate-850 dark:focus:border-slate-705 bg-slate-50 dark:bg-slate-950 text-slate-905 dark:text-white"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolderAction();
                }}
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl bg-transparent transition-colors cursor-pointer select-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateFolderAction}
                disabled={isCreatingFolder || !newFolderName.trim()}
                className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl px-4 py-2 text-xs font-bold shadow-md transition-all cursor-pointer select-none"
              >
                {isCreatingFolder ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Folder</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOVE FILE / REORGANIZE MODAL */}
      {movingFile && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setMovingFile(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full border border-slate-100 dark:border-slate-850/80 overflow-hidden shadow-2xl p-6 space-y-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 text-indigo-650 dark:text-indigo-400">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl border border-indigo-100 dark:border-indigo-900/25">
                <Move className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Organize Synced Asset</h4>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
                Moving <span className="font-bold text-slate-750 dark:text-slate-300 truncate max-w-[200px] align-bottom">"{movingFile.name}"</span>
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Choose a custom target directory from the list of established folders below inside your Toolkit Google Drive workspace:
              </p>
            </div>

            <div className="max-h-48 overflow-y-auto border border-slate-150 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 divide-y divide-slate-100 dark:divide-slate-850 p-1">
              {/* Option to move back to ToolkitPro Root */}
              <button
                type="button"
                onClick={() => handleMoveFileAction(appRootId || "")}
                disabled={isMovingFile || currentFolderId === appRootId}
                className="w-full text-left font-semibold text-xs py-2.5 px-3 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-350 first:rounded-t-xl flex items-center justify-between group disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-slate-400 fill-slate-150" />
                  <span>ToolkitPro (Main Directory)</span>
                </span>
                {currentFolderId === appRootId && (
                  <span className="text-[9px] font-bold text-indigo-550 dark:text-indigo-400 uppercase tracking-widest pl-1">Current</span>
                )}
              </button>

              {/* Render existing custom directories */}
              {files
                .filter(f => f.mimeType === "application/vnd.google-apps.folder" && f.id !== appRootId && f.id !== movingFile.id)
                .map((folder) => {
                  const isCurrentParent = currentFolderId === folder.id;
                  return (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => handleMoveFileAction(folder.id)}
                      disabled={isMovingFile || isCurrentParent}
                      className="w-full text-left font-semibold text-xs py-2.5 px-3 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 flex items-center justify-between group disabled:opacity-50"
                    >
                      <span className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-amber-500 fill-amber-100 dark:fill-amber-955/20" />
                        <span className="truncate">{folder.name}</span>
                      </span>
                      {isCurrentParent && (
                        <span className="text-[9px] font-bold text-indigo-550 dark:text-indigo-400 uppercase tracking-widest pl-1 font-mono">Current</span>
                      )}
                    </button>
                  );
                })}
              
              {/* If no other folders exist */}
              {files.filter(f => f.mimeType === "application/vnd.google-apps.folder" && f.id !== appRootId && f.id !== movingFile.id).length === 0 && (
                <div className="py-4 text-center text-[10px] text-slate-400 dark:text-slate-500 italic">
                  No other custom directories. Click "Create Folder" first to add some custom structures.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setMovingFile(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl bg-transparent transition-colors cursor-pointer select-none"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING BATCH ACTIONS CONTROL BAR */}
      {selectedFileIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 dark:bg-slate-900 border border-slate-800 dark:border-slate-705 rounded-2xl p-3 shadow-2xl flex items-center gap-4 animate-bounce-in max-w-[90vw] w-fit">
          <div className="flex items-center gap-2 px-1">
            <span className="inline-flex items-center justify-center bg-indigo-600 text-white font-black text-[10px] w-5 h-5 rounded-full shadow-inner animate-pulse">
              {selectedFileIds.length}
            </span>
            <span className="text-xs font-bold text-slate-200 whitespace-nowrap hidden sm:inline text-left">
              selected files
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setBatchPrefix("");
                setBatchSuffix("");
                setBatchFind("");
                setBatchReplace("");
                setBatchPattern("toolkit_");
                setBatchStartNum(1);
                setShowBatchRenameModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-bold transition-all hover:scale-102 cursor-pointer shadow-md select-none"
              title="Apply batch rename templates to your selection"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Batch Rename</span>
            </button>

            <button
              onClick={() => setShowBatchDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all hover:scale-102 cursor-pointer shadow-md select-none"
              title="Permanently remove selected items"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bulk Delete</span>
            </button>

            <button
              onClick={() => setSelectedFileIds([])}
              className="px-3 py-2 rounded-xl hover:bg-slate-850 text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer select-none"
              title="Cancel file choices"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* BATCH RENAME TEMPLATE CONFIGURATION MODAL */}
      {showBatchRenameModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
          onClick={() => {
            if (!isRenamingBatch) setShowBatchRenameModal(false);
          }}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-100 dark:border-slate-850/80 overflow-hidden shadow-2xl flex flex-col md:flex-row animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Column: Form Settings */}
            <div className="md:w-1/2 p-6 space-y-4 border-b md:border-b-0 md:border-r border-slate-150 dark:border-slate-800 flex flex-col justify-between text-left">
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-indigo-600 dark:text-indigo-400">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/35">
                    <Sparkles className="w-5 h-5 text-indigo-505" />
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white font-sans">Batch Rename</h4>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  Customize naming templates for {selectedFileIds.length} items. File formats and extensions are fully preserved.
                </p>

                {/* Batch Mode Selectors */}
                <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-955 p-1 rounded-xl border border-slate-200/40 dark:border-slate-850 text-[10px] font-bold font-sans">
                  {[
                    { id: "prefix-suffix", label: "Prefix/Suffix" },
                    { id: "find-replace", label: "Find/Replace" },
                    { id: "sequence", label: "Sequence" },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setBatchRenameMode(mode.id as any)}
                      className={`py-1.5 rounded-lg transition-all text-center cursor-pointer select-none ${
                        batchRenameMode === mode.id
                          ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-205"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>

                {/* Mode Specific Inputs */}
                {batchRenameMode === "prefix-suffix" && (
                  <div className="space-y-3 pt-2 font-sans">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-405 dark:text-slate-500 uppercase tracking-widest pl-1 font-mono">
                        Prefix
                      </label>
                      <input
                        type="text"
                        value={batchPrefix}
                        onChange={(e) => setBatchPrefix(e.target.value)}
                        placeholder="e.g. customized_"
                        className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-white focus:outline-none focus:border-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-405 dark:text-slate-500 uppercase tracking-widest pl-1 font-mono">
                        Suffix
                      </label>
                      <input
                        type="text"
                        value={batchSuffix}
                        onChange={(e) => setBatchSuffix(e.target.value)}
                        placeholder="e.g. _v2"
                        className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-white focus:outline-none focus:border-slate-800"
                      />
                    </div>
                  </div>
                )}

                {batchRenameMode === "find-replace" && (
                  <div className="space-y-3 pt-2 font-sans">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-405 dark:text-slate-500 uppercase tracking-widest pl-1 font-mono">
                        Find text
                      </label>
                      <input
                        type="text"
                        value={batchFind}
                        onChange={(e) => setBatchFind(e.target.value)}
                        placeholder="e.g. quote_"
                        className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-white focus:outline-none focus:border-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-405 dark:text-slate-500 uppercase tracking-widest pl-1 font-mono">
                        Replace with
                      </label>
                      <input
                        type="text"
                        value={batchReplace}
                        onChange={(e) => setBatchReplace(e.target.value)}
                        placeholder="e.g. card_"
                        className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-white focus:outline-none focus:border-slate-800"
                      />
                    </div>
                  </div>
                )}

                {batchRenameMode === "sequence" && (
                  <div className="space-y-3 pt-2 font-sans">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-405 dark:text-slate-500 uppercase tracking-widest pl-1 font-mono">
                        Base Pattern Name
                      </label>
                      <input
                        type="text"
                        value={batchPattern}
                        onChange={(e) => setBatchPattern(e.target.value)}
                        placeholder="e.g. asset_"
                        className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-white focus:outline-none focus:border-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-405 dark:text-slate-500 uppercase tracking-widest pl-1 font-mono">
                        Start numbering from
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={batchStartNum}
                        onChange={(e) => setBatchStartNum(parseInt(e.target.value, 10) || 1)}
                        className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-white focus:outline-none focus:border-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Rename progress loader or buttons */}
              <div className="pt-4 flex items-center justify-end gap-2 text-xs font-sans">
                {isRenamingBatch ? (
                  <div className="w-full space-y-2 py-2">
                    <div className="flex items-center justify-between font-mono text-[9px] font-bold text-slate-400">
                      <span>RENAMING PROGRESS</span>
                      <span>{renameProgress ? `${renameProgress.current}/${renameProgress.total}` : ""}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-505 transition-all duration-300 animate-pulse" 
                        style={{ width: `${renameProgress ? (renameProgress.current / renameProgress.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowBatchRenameModal(false)}
                      className="px-4 py-2 font-bold text-slate-500 dark:text-slate-455 hover:bg-slate-55 dark:hover:bg-slate-850 rounded-xl cursor-pointer select-none transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleBatchRenameAction}
                      className="inline-flex items-center gap-1 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 font-bold shadow-md transition-all cursor-pointer select-none"
                    >
                      <Check className="w-4 h-4" />
                      <span>Apply Renames</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Right Column: Live Transformations Preview */}
            <div className="md:w-1/2 p-6 flex flex-col bg-slate-50/50 dark:bg-black/10 min-h-[280px] font-sans">
              <div className="pb-2 border-b border-slate-150 dark:border-slate-800/85 mb-3 select-none flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                  LIVE TRACE PREVIEW
                </span>
                <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-605 dark:text-indigo-400 text-[8px] px-1.5 py-0.2 rounded font-mono font-black uppercase">
                  SIMULATED
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[300px] pr-1.5 custom-scrollbar">
                {files
                  .filter((f) => selectedFileIds.includes(f.id))
                  .map((file, i) => {
                    const newName = computeNewName(file.name, i);
                    return (
                      <div 
                        key={file.id} 
                        className="p-2.5 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850/60 rounded-xl text-[10px] flex flex-col gap-1 shadow-3xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 shrink-0 font-bold">Original:</span>
                          <span className="font-semibold text-slate-655 dark:text-slate-400 truncate text-left select-all" title={file.name}>
                            {file.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 border-t border-slate-50 dark:border-slate-850/30 pt-1 mt-0.5">
                          <span className="text-emerald-505 shrink-0 font-bold">New Name:</span>
                          <span className="font-extrabold text-slate-900 dark:text-emerald-400 truncate text-left select-all" title={newName}>
                            {newName}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BATCH SECURE DELETE CONFIRMATION MODAL */}
      {showBatchDeleteModal && (
        <div 
          className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-md animate-fade-in animate-duration-150"
          onClick={() => { if (!isDeletingBatch) setShowBatchDeleteModal(false); }}
          id="batch-delete-confirmation-modal"
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-rose-105 dark:border-rose-950/30 overflow-hidden shadow-2xl p-6 space-y-5 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3.5 text-rose-600 dark:text-rose-400">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 rounded-2xl border border-rose-100 dark:border-rose-900/40 shrink-0">
                <Trash2 className="w-5.5 h-5.5 animate-pulse" />
              </div>
              <div className="text-left font-sans">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Bulk Delete Files?
                </h4>
                <p className="text-[9px] text-rose-500 dark:text-rose-400 font-bold font-mono uppercase tracking-widest mt-1.5">
                  Action Cannot Be Undone
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed text-left">
              Are you absolutely sure you want to permanently delete these <strong className="text-slate-900 dark:text-white">{selectedFileIds.length}</strong> selected files from your integrated Google Drive? Any modules or assets referencing these nodes will lose connectivity.
            </p>

            {/* List the affected items as recommended by SKILL.md */}
            <div className="space-y-1.5 text-left font-sans">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 font-mono">
                Items to remove ({selectedFileIds.length})
              </label>
              <div className="max-h-36 overflow-y-auto border border-slate-150 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 divide-y divide-slate-100 dark:divide-slate-850 p-2 custom-scrollbar">
                {files
                  .filter((f) => selectedFileIds.includes(f.id))
                  .map((file) => (
                    <div key={file.id} className="py-2 px-1 text-xs text-slate-700 dark:text-slate-350 flex items-center justify-between font-medium">
                      <span className="truncate pr-4 select-all" title={file.name}>
                        {file.name}
                      </span>
                      {file.size && (
                        <span className="font-mono text-[10px] text-slate-400 shrink-0">
                          {formatBytes(file.size)}
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 text-xs font-sans font-semibold">
              {isDeletingBatch ? (
                <div className="w-full space-y-2 py-1">
                  <div className="flex items-center justify-between font-mono text-[9px] font-bold text-slate-450 dark:text-slate-500">
                    <span className="uppercase">Deleting files...</span>
                    <span>{deleteProgress ? `${deleteProgress.current}/${deleteProgress.total}` : ""}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-600 transition-all duration-300 animate-pulse" 
                      style={{ width: `${deleteProgress ? (deleteProgress.current / deleteProgress.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setShowBatchDeleteModal(false)}
                    className="w-full sm:w-auto px-4 py-2.5 font-bold text-slate-550 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl cursor-pointer select-none transition-all text-center"
                  >
                    Cancel, Keep Them
                  </button>
                  <button
                    type="button"
                    onClick={handleBatchDeleteAction}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-4.5 py-2.5 font-bold shadow-md shadow-rose-200/20 transition-all cursor-pointer select-none"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, delete permanently</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* INDIVIDUAL SECURE DELETE CONFIRMATION MODAL */}
      {deletingItem && (
        <div 
          className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in animate-duration-150"
          onClick={() => setDeletingItem(null)}
          id="delete-confirmation-modal"
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-rose-100 dark:border-rose-950/30 overflow-hidden shadow-2xl p-6 space-y-5 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3.5 text-rose-600 dark:text-rose-400">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 rounded-2xl border border-rose-100 dark:border-rose-900/40 shrink-0">
                <Trash2 className="w-5.5 h-5.5 animate-pulse" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white font-sans uppercase tracking-wider">
                  Permanently Delete Item?
                </h4>
                <p className="text-[9px] text-rose-500 dark:text-rose-400 font-bold font-mono uppercase tracking-widest mt-0.5">
                  Action Cannot Be Undone
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-850 p-4 text-left space-y-3">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider font-mono">
                  NAME
                </span>
                <p className="text-xs font-bold text-slate-850 dark:text-slate-200 break-all leading-snug">
                  {deletingItem.name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1 text-[10px] font-mono leading-none border-t border-slate-200/50 dark:border-slate-800/50 mt-1">
                <div>
                  <span className="text-slate-400 block mb-1 font-mono text-[9px]">TYPE</span>
                  <span className="font-extrabold text-slate-700 dark:text-slate-350 uppercase">
                    {deletingItem.isFolder ? "Folder Link" : "Asset File"}
                  </span>
                </div>
                {deletingItem.size && (
                  <div>
                    <span className="text-slate-400 block mb-1 font-mono text-[9px]">SIZE</span>
                    <span className="font-extrabold text-slate-700 dark:text-slate-350">{deletingItem.size}</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-505 dark:text-slate-400 leading-relaxed text-left">
              Are you absolutely sure you want to permanently delete this {deletingItem.isFolder ? "folder and all its nested content" : "file"} from your integrated Google Drive? Any modules syncing to this specific node will lose connectivity.
            </p>

            <div className="flex items-center justify-end space-x-2.5 pt-1.5 font-sans">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-550 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl bg-transparent transition-all cursor-pointer"
              >
                Cancel, Keep It
              </button>
              <button
                type="button"
                onClick={executeDeleteAction}
                disabled={isDeletingId === deletingItem.id}
                className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl px-4.5 py-2.5 text-xs font-bold shadow-md shadow-rose-200/20 transition-all cursor-pointer"
              >
                {isDeletingId === deletingItem.id ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INDIVIDUAL RENAME / IDENTIFIER MODIFICATION MODAL */}
      {renamingItem && (
        <div 
          className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-md animate-fade-in animate-duration-150"
          onClick={() => { if (!isRenamingItem) setRenamingItem(null); }}
          id="rename-identifier-modal"
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full border border-slate-100 dark:border-slate-805 overflow-hidden shadow-2xl p-6 space-y-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3.5 text-indigo-605 dark:text-indigo-400">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100/50 dark:border-indigo-900/35 shrink-0">
                <Edit3 className="w-5 h-5 text-indigo-550" />
              </div>
              <div className="text-left font-sans">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider leading-none">
                  {renamingItem.isFolder ? "Rename Folder" : "Rename Linked File"}
                </h4>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold font-mono uppercase tracking-widest mt-1.5">
                  Cloud Node Identifier
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed text-left">
              Provide a direct new naming parameter to synchronize this {renamingItem.isFolder ? "folder" : "file"}'s name seamlessly within your connected cloud storage.
            </p>

            <div className="space-y-4 font-sans text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 font-mono">
                  ORIGINAL NAME
                </label>
                <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-455 dark:text-slate-400 border border-slate-100 dark:border-slate-850 break-all text-xs font-mono font-bold leading-relaxed">
                  {renamingItem.name}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 font-mono">
                  NEW RE-NAME
                </label>
                <input
                  type="text"
                  value={newRenameValue}
                  onChange={(e) => setNewRenameValue(e.target.value)}
                  placeholder="e.g. customized_file_name_v2"
                  autoFocus
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 focus:outline-none focus:border-slate-850 dark:focus:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-905 dark:text-white"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newRenameValue.trim() && !isRenamingItem) {
                      executeRenameAction();
                    }
                  }}
                />
              </div>

              {/* Secure Extension Warning Notification */}
              {!renamingItem.isFolder && (() => {
                const origDot = renamingItem.name.lastIndexOf(".");
                const newDot = newRenameValue.lastIndexOf(".");
                const origExt = origDot !== -1 ? renamingItem.name.substring(origDot) : "";
                const newExt = newDot !== -1 ? newRenameValue.substring(newDot) : "";
                if (origExt && origExt !== newExt) {
                  return (
                    <div className="p-3 bg-amber-50 dark:bg-amber-955/35 rounded-2xl border border-amber-100 dark:border-amber-900/40 text-[10px] text-amber-655 dark:text-amber-400 flex items-start gap-2 shadow-3xs leading-relaxed animate-fade-in">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Caution: extension changes.</span> Changing format extension from <strong className="font-mono">{origExt}</strong> to <strong className="font-mono">{newExt || "none"}</strong> may prevent system tools from reading this synced asset.
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 font-sans">
              <button
                type="button"
                onClick={() => setRenamingItem(null)}
                disabled={isRenamingItem}
                className="px-4 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-455 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl bg-transparent transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeRenameAction}
                disabled={isRenamingItem || !newRenameValue.trim() || newRenameValue.trim() === renamingItem.name}
                className="inline-flex items-center gap-1 bg-indigo-605 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl px-4.5 py-2.5 text-xs font-bold shadow-md shadow-indigo-100/20 transition-all cursor-pointer"
              >
                {isRenamingItem ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm Rename</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

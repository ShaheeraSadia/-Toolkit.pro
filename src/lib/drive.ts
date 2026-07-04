import { DriveFile } from "../types";

/**
 * Fetch files created/accessed by this app, sorted by newest first.
 */
export const listDriveFiles = async (accessToken: string): Promise<DriveFile[]> => {
  const fields = "files(id, name, mimeType, createdTime, modifiedTime, size, thumbnailLink, webViewLink, parents)";
  const q = "trashed = false"; // Filter out files in trash
  const url = `https://www.googleapis.com/drive/v3/files?orderBy=createdTime desc&fields=${encodeURIComponent(
    fields
  )}&q=${encodeURIComponent(q)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to fetch files from Drive: ${response.statusText}`);
  }

  const data = await response.json();
  return data.files || [];
};

/**
 * Find a folder or create it under an optional parent folder.
 */
export const getOrCreateFolder = async (
  accessToken: string,
  folderName: string,
  parentFolderId?: string
): Promise<string> => {
  let q = `name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (parentFolderId) {
    q += ` and '${parentFolderId}' in parents`;
  } else {
    q += ` and 'root' in parents`;
  }

  const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`;
  const listResp = await fetch(listUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (listResp.ok) {
    const listData = await listResp.json();
    if (listData.files && listData.files.length > 0) {
      return listData.files[0].id;
    }
  }

  // Create folder if not found
  const createUrl = "https://www.googleapis.com/drive/v3/files";
  const metadata: any = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const createResp = await fetch(createUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });

  if (!createResp.ok) {
    const errData = await createResp.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to create folder ${folderName}: ${createResp.statusText}`);
  }

  const folder = await createResp.json();
  return folder.id;
};

/**
 * Upload an image or JSON (as base64 data url) to Google Drive using multipart upload with base64 encoding.
 */
export const uploadFileToDrive = async (
  accessToken: string,
  filename: string,
  mimeType: string,
  base64DataUrl: string,
  parentId?: string,
  description?: string,
  properties?: Record<string, string>
): Promise<DriveFile> => {
  const boundary = "toolkit_pro_boundary";
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  // Get raw base64 string (remove "data:image/png;base64," prefix)
  const base64Content = base64DataUrl.substring(base64DataUrl.indexOf(",") + 1);

  const metadata: any = {
    name: filename,
    mimeType: mimeType,
  };
  if (parentId) {
    metadata.parents = [parentId];
  }
  if (description) {
    metadata.description = description;
  }
  if (properties) {
    metadata.properties = properties;
  }

  const metadataPart = [
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
  ].join("\r\n");

  const mediaPart = [
    `Content-Type: ${mimeType}`,
    "Content-Transfer-Encoding: base64",
    "",
    base64Content,
  ].join("\r\n");

  // Build the parts as a Blob
  const multipartBody = new Blob(
    [
      delimiter,
      metadataPart,
      delimiter,
      mediaPart,
      closeDelimiter,
    ],
    { type: `multipart/related; boundary=${boundary}` }
  );

  const url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,createdTime,size,thumbnailLink,webViewLink";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: multipartBody,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to upload file to Drive: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Delete a file in Google Drive.
 */
export const deleteDriveFile = async (accessToken: string, fileId: string): Promise<void> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to delete file from Drive: ${response.statusText}`);
  }
};

/**
 * Creates a brand new custom folder under an optional parent folder.
 */
export const createDriveFolder = async (
  accessToken: string,
  folderName: string,
  parentFolderId?: string
): Promise<string> => {
  const url = "https://www.googleapis.com/drive/v3/files";
  const metadata: any = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to create folder ${folderName}: ${response.statusText}`);
  }

  const folder = await response.json();
  return folder.id;
};

/**
 * Move a file or folder under a new parent in Google Drive.
 */
export const moveDriveFile = async (
  accessToken: string,
  fileId: string,
  newParentId: string,
  oldParentId?: string
): Promise<void> => {
  let url = `https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${newParentId}`;
  if (oldParentId) {
    url += `&removeParents=${oldParentId}`;
  }

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to move file to the target folder: ${response.statusText}`);
  }
};

/**
 * Rename a file or folder in Google Drive.
 */
export const renameDriveFile = async (
  accessToken: string,
  fileId: string,
  newFileName: string
): Promise<void> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: newFileName,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to rename file: ${response.statusText}`);
  }
};

/**
 * Retrieve file content as a string or parsed JSON for a specific file in Google Drive.
 */
export const downloadDriveFile = async (accessToken: string, fileId: string): Promise<any> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to download file from Drive: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Update media content of an existing file in Google Drive using PATCH with uploadType=media.
 */
export const updateDriveFile = async (
  accessToken: string,
  fileId: string,
  mimeType: string,
  base64DataUrl: string
): Promise<any> => {
  // Extract binary array
  const base64Content = base64DataUrl.substring(base64DataUrl.indexOf(",") + 1);
  const binaryString = window.atob(base64Content);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": mimeType,
    },
    body: bytes,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to update file: ${response.statusText}`);
  }

  return response.json();
};



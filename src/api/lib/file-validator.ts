

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "pdf", "txt"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function validateUploadedFile(file: {
  originalFilename: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}): { success: true } | { success: false; error: string } {
  const { originalFilename, mimetype, size } = file;

  // 1) Check file size
  if (size > MAX_FILE_SIZE) {
    return { success: false, error: "File size exceeds 5 MB" };
  }

  // 2) Check extension
  const ext = originalFilename.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return { success: false, error: "File type not allowed" };
  }

  // 3) Check MIME‐type (basic)
  //    For simplicity, we allow any image or PDF/TXT MIME that matches extension
  if (
    ext === "jpg" ||
    ext === "jpeg" ||
    ext === "png" ||
    ext === "gif"
  ) {
    if (!mimetype.startsWith("image/")) {
      return { success: false, error: "Invalid image MIME type" };
    }
  } else if (ext === "pdf") {
    if (mimetype !== "application/pdf") {
      return { success: false, error: "Invalid PDF MIME type" };
    }
  } else if (ext === "txt") {
    if (mimetype !== "text/plain") {
      return { success: false, error: "Invalid TXT MIME type" };
    }
  }

  // (Optional) 4) Further “magic-bytes” inspection could go here.

  return { success: true };
}

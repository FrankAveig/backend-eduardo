const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Client } = require('basic-ftp');
const { Readable } = require('stream');
require('dotenv').config();

// Asegurarse de que los directorios temporales existen
// Usar path.resolve para asegurar una ruta absoluta correcta
/* const uploadsDir = path.resolve(__dirname, '../uploads');
const videoUploadsDir = path.resolve(__dirname, '../uploads/videos');
const documentsUploadsDir = path.resolve(__dirname, '../uploads/documents');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(videoUploadsDir)) {
  fs.mkdirSync(videoUploadsDir, { recursive: true });
}

if (!fs.existsSync(documentsUploadsDir)) {
  fs.mkdirSync(documentsUploadsDir, { recursive: true });
} */

// Filtro para validar tipos de archivos - imágenes
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes'), false);
  }
};

// Filtro para validar tipos de archivos - videos
const videoFilter = (req, file, cb) => {
  const acceptedTypes = [
    'video/mp4', 
    'video/mpeg', 
    'video/quicktime', 
    'video/x-msvideo', 
    'video/x-ms-wmv',
    'video/webm'
  ];
  
  if (acceptedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten formatos de video: MP4, MPEG, MOV, AVI, WMV, WEBM'), false);
  }
};

// Filtro para validar tipos de archivos - documentos
const documentFilter = (req, file, cb) => {
  const acceptedTypes = [
    // Documentos de texto y presentaciones
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    
    // Archivos comprimidos
    'application/zip',
    'application/x-rar-compressed',
    
    // Imágenes
    'image/jpeg',
    'image/png',
    'image/gif'
  ];
  
  if (acceptedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de documento no aceptado. Formatos permitidos: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP, RAR, JPG, PNG, GIF'), false);
  }
};

// Configuración de multer para usar memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB para imágenes
  },
  fileFilter: imageFilter
});

const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1.5 * 1024 * 1024 * 1024 // 1.5GB para videos
  },
  fileFilter: videoFilter
});

const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB para documentos
  },
  fileFilter: documentFilter
});

// Función para limpiar nombre de archivo
const cleanFileName = (name) => {
  if (!name) return 'untitled';
  
  let cleaned = name
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, '_')
    .replace(/^_+/, '');
    
  return cleaned || 'untitled';
};

// Función para subir buffer al FTP
const uploadBufferToFtp = async (buffer, fileName, remotePath) => {
  const client = new Client();
  
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: parseInt(process.env.FTP_PORT || '21'),
      secure: process.env.FTP_SECURE === 'true'
    });

    // Crear stream desde el buffer
    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);

    // Asegurar que el directorio existe
    const dirPath = path.dirname(remotePath);
    await client.ensureDir(dirPath);

    // Subir el archivo
    await client.uploadFrom(readableStream, remotePath);

    // Construir la URL pública correcta
    // Extraer la ruta relativa desde el directorio base del FTP
    let relativePath;
    let publicUrl;
    // Función para limpiar la ruta de "certifications"
    const cleanPath = (path) => {
      return path.replace('/certifications/', '/');
    };
    
    if (remotePath.startsWith(process.env.FTP_VIDEOS_DIR)) {
      // Para videos: solo usar el nombre del archivo
      relativePath = fileName;
      publicUrl = `${process.env.FTP_VIDEOS_PUBLIC_URL}${relativePath}`;
    } else if (remotePath.startsWith(process.env.FTP_IMAGES_DIR)) {
      // Para imágenes: solo usar el nombre del archivo
      relativePath = fileName;
      publicUrl = `${process.env.FTP_PUBLIC_URL}${relativePath}`;
    } else if (remotePath.startsWith(process.env.FTP_DOCUMENTS_DIR)) {
      // Para documentos: manejar subdirectorios si existen
      const pathParts = remotePath.split('/');
      const fileNameIndex = pathParts.indexOf(fileName);
      if (fileNameIndex > -1) {
        // Si hay subdirectorios (como video_name_id/), incluirlos
        const subPath = pathParts.slice(-2).join('/'); // Tomar los últimos 2 segmentos
        // Limpiar "certifications" del subPath si existe
        const cleanSubPath = cleanPath(subPath);
        relativePath = cleanSubPath;
        publicUrl = `${process.env.FTP_DOCUMENTS_PUBLIC_URL}${relativePath}`;
      } else {
        relativePath = fileName;
        publicUrl = `${process.env.FTP_DOCUMENTS_PUBLIC_URL}${relativePath}`;
      }
    } else {
      // Fallback: intentar extraer la ruta relativa manualmente
      // Buscar patrones comunes en la ruta
      if (remotePath.includes('/videos/')) {
        const videoIndex = remotePath.indexOf('/videos/');
        const afterVideos = remotePath.substring(videoIndex + 8); // +8 para saltar '/videos/'
        relativePath = afterVideos;
        publicUrl = `${process.env.FTP_VIDEOS_PUBLIC_URL}${relativePath}`;
      } else if (remotePath.includes('/images/')) {
        const imageIndex = remotePath.indexOf('/images/');
        const afterImages = remotePath.substring(imageIndex + 8); // +8 para saltar '/images/'
        relativePath = afterImages;
        publicUrl = `${process.env.FTP_PUBLIC_URL}${relativePath}`;
      } else if (remotePath.includes('/documents/')) {
        const docIndex = remotePath.indexOf('/documents/');
        const afterDocs = remotePath.substring(docIndex + 11); // +11 para saltar '/documents/'
        relativePath = afterDocs;
        publicUrl = `${process.env.FTP_DOCUMENTS_PUBLIC_URL}${relativePath}`;
      } else {
        relativePath = fileName; // Fallback final
        publicUrl = `${process.env.FTP_PUBLIC_URL}${relativePath}`;
      }
    }

    // 🎯 AQUÍ SE DEFINE LA RUTA QUE SE GUARDA EN LA BASE DE DATOS
    return {
      success: true,
      url: publicUrl
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  } finally {
    client.close();
  }
};

// Función para subir archivo al FTP (imágenes)
const uploadToFtp = async (fileBuffer, certification) => {
  if (!fileBuffer) {
    return { 
      success: false, 
      error: 'No se proporcionó ningún archivo'
    };
  }

  const ext = '.jpg'; // Extensión por defecto para imágenes
  let fileName;

  if (certification && certification.id) {
    const cleanCertId = String(certification.id).trim().replace(/\s+/g, '');
    const certName = certification.certification_name || certification.nombre_certificacion || 'certification';
    const cleanedName = cleanFileName(certName);
    fileName = `${cleanedName}_${cleanCertId}${ext}`;
  } else if (certification && certification.certification_name) {
    const certName = certification.certification_name;
    const cleanedName = cleanFileName(certName);
    const temporalId = Date.now();
    fileName = `${cleanedName}_${temporalId}${ext}`;
    certification.temporalId = temporalId;
  } else {
    fileName = `certification_${Date.now()}${ext}`;
  }

  const remotePath = `${process.env.FTP_IMAGES_DIR}${fileName}`;
  return await uploadBufferToFtp(fileBuffer, fileName, remotePath);
};

// Función para subir video al FTP
const uploadVideoToFtp = async (fileBuffer, videoData) => {
  if (!fileBuffer) {
    return { 
      success: false, 
      error: 'No se proporcionó ningún archivo de video'
    };
  }

  const ext = '.mp4'; // Extensión por defecto para videos
  let fileName;

  if (videoData && videoData.id) {
    const videoName = videoData.video_name || 'video';
    const cleanedName = cleanFileName(videoName);
    fileName = `${cleanedName}_${videoData.id}${ext}`;
  } else if (videoData && videoData.video_name) {
    const cleanedName = cleanFileName(videoData.video_name);
    const temporalId = Date.now();
    fileName = `${cleanedName}_${temporalId}${ext}`;
    videoData.temporalId = temporalId;
  } else {
    fileName = `video_${Date.now()}${ext}`;
  }

  const remotePath = `${process.env.FTP_VIDEOS_DIR}${fileName}`;
  const result = await uploadBufferToFtp(fileBuffer, fileName, remotePath);

  if (result.success) {
    return {
      success: true,
      url: result.url,
      temporalId: videoData?.temporalId
    };
  }
  return result;
};

// Función para subir documento al FTP
const uploadDocumentToFtp = async (fileBuffer, documentData) => {
  if (!fileBuffer) {
    return { 
      success: false, 
      error: 'No se proporcionó ningún archivo de documento'
    };
  }

  // Obtener la extensión del archivo original si está disponible
  let ext = path.extname(documentData.originalname || documentData.document_name || 'doc.pdf');
  if (!ext) ext = '.pdf'; // Fallback por si acaso
  let fileName;

  if (documentData && documentData.id) {
    const docName = documentData.document_name || documentData.originalname || 'document';
    const cleanedName = cleanFileName(docName);
    fileName = `${cleanedName}_${documentData.id}${ext}`;
  } else if (documentData && (documentData.document_name || documentData.originalname)) {
    const cleanedName = cleanFileName(documentData.document_name || documentData.originalname);
    const temporalId = Date.now();
    fileName = `${cleanedName}_${temporalId}${ext}`;
    documentData.temporalId = temporalId;
  } else {
    fileName = `document_${Date.now()}${ext}`;
  }

  // Si hay video_id y video_name, crear subdirectorio
  let remotePath;
  if (documentData.video_id && documentData.video_name) {
    const videoDir = cleanFileName(`${documentData.video_name}_${documentData.video_id}`);
    remotePath = `${process.env.FTP_DOCUMENTS_DIR}${videoDir}/${fileName}`;
  } else {
    remotePath = `${process.env.FTP_DOCUMENTS_DIR}${fileName}`;
  }

  const result = await uploadBufferToFtp(fileBuffer, fileName, remotePath);

  if (result.success) {
    return {
      success: true,
      url: result.url,
      temporalId: documentData?.temporalId
    };
  }
  return result;
};

// Función para eliminar archivo del FTP
const deleteFromFtp = async (fileUrl) => {
  const client = new Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: parseInt(process.env.FTP_PORT || '21'),
      secure: process.env.FTP_SECURE === 'true'
    });

    // Detectar la base URL correcta según el tipo de archivo
    let baseUrl = process.env.FTP_PUBLIC_URL;
    if (fileUrl.includes('/documents/')) {
      baseUrl = process.env.FTP_DOCUMENTS_PUBLIC_URL;
    } else if (fileUrl.includes('/videos/')) {
      baseUrl = process.env.FTP_VIDEOS_PUBLIC_URL;
    } else if (fileUrl.includes('/images/')) {
      baseUrl = process.env.FTP_PUBLIC_URL;
    }
    const relativePath = fileUrl.replace(baseUrl, '');

    // Determinar el directorio FTP correcto basado en la extensión del archivo
    let ftpPath;
    const ext = path.extname(relativePath).toLowerCase();
    if (['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'].includes(ext)) {
      ftpPath = `${process.env.FTP_VIDEOS_DIR}${relativePath}`;
    } else if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(ext)) {
      ftpPath = `${process.env.FTP_IMAGES_DIR}${relativePath}`;
    } else {
      ftpPath = `${process.env.FTP_DOCUMENTS_DIR}${relativePath}`;
    }

    // Intentar eliminar el archivo
    await client.remove(ftpPath);
    return {
      success: true,
      message: 'Archivo eliminado correctamente'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  } finally {
    client.close();
  }
};

module.exports = {
  upload,
  videoUpload,
  documentUpload,
  uploadToFtp,
  uploadVideoToFtp,
  uploadDocumentToFtp,
  deleteFromFtp
}; 
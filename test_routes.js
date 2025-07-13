require('dotenv').config();

// Simular las variables de entorno
const FTP_PUBLIC_URL = process.env.FTP_PUBLIC_URL || 'https://eduardospandre.com/eduardo/storage/';
const FTP_VIDEOS_DIR = process.env.FTP_VIDEOS_DIR || '/eduardospandre/eduardo/storage/videos/';
const FTP_IMAGES_DIR = process.env.FTP_IMAGES_DIR || '/eduardospandre/eduardo/storage/images/';
const FTP_DOCUMENTS_DIR = process.env.FTP_DOCUMENTS_DIR || '/eduardospandre/eduardo/storage/documents/';

console.log('=== Configuración FTP ===');
console.log('FTP_PUBLIC_URL:', FTP_PUBLIC_URL);
console.log('FTP_VIDEOS_DIR:', FTP_VIDEOS_DIR);
console.log('FTP_IMAGES_DIR:', FTP_IMAGES_DIR);
console.log('FTP_DOCUMENTS_DIR:', FTP_DOCUMENTS_DIR);
console.log('');

// Función para construir URL pública (simulando la lógica del middleware)
function buildPublicUrl(remotePath, fileName) {
  let relativePath;
  
  if (remotePath.startsWith(FTP_VIDEOS_DIR)) {
    relativePath = `videos/${fileName}`;
  } else if (remotePath.startsWith(FTP_IMAGES_DIR)) {
    relativePath = `images/${fileName}`;
  } else if (remotePath.startsWith(FTP_DOCUMENTS_DIR)) {
    const pathParts = remotePath.split('/');
    const fileNameIndex = pathParts.indexOf(fileName);
    if (fileNameIndex > -1) {
      const subPath = pathParts.slice(-2).join('/');
      relativePath = `documents/${subPath}`;
    } else {
      relativePath = `documents/${fileName}`;
    }
  } else {
    relativePath = fileName;
  }
  
  return `${FTP_PUBLIC_URL}${relativePath}`;
}

// Casos de prueba
console.log('=== Casos de Prueba ===');

// Test 1: Video
const videoRemotePath = `${FTP_VIDEOS_DIR}new_video_1752353268341.mp4`;
const videoFileName = 'new_video_1752353268341.mp4';
const videoUrl = buildPublicUrl(videoRemotePath, videoFileName);
console.log('Video:');
console.log('  Remote Path:', videoRemotePath);
console.log('  File Name:', videoFileName);
console.log('  Public URL:', videoUrl);
console.log('  Expected:', 'https://eduardospandre.com/eduardo/storage/videos/new_video_1752353268341.mp4');
console.log('  ✅ Correcto:', videoUrl === 'https://eduardospandre.com/eduardo/storage/videos/new_video_1752353268341.mp4');
console.log('');

// Test 2: Imagen
const imageRemotePath = `${FTP_IMAGES_DIR}certification_1.jpg`;
const imageFileName = 'certification_1.jpg';
const imageUrl = buildPublicUrl(imageRemotePath, imageFileName);
console.log('Imagen:');
console.log('  Remote Path:', imageRemotePath);
console.log('  File Name:', imageFileName);
console.log('  Public URL:', imageUrl);
console.log('  Expected:', 'https://eduardospandre.com/eduardo/storage/images/certification_1.jpg');
console.log('  ✅ Correcto:', imageUrl === 'https://eduardospandre.com/eduardo/storage/images/certification_1.jpg');
console.log('');

// Test 3: Documento simple
const docRemotePath = `${FTP_DOCUMENTS_DIR}document_1.pdf`;
const docFileName = 'document_1.pdf';
const docUrl = buildPublicUrl(docRemotePath, docFileName);
console.log('Documento simple:');
console.log('  Remote Path:', docRemotePath);
console.log('  File Name:', docFileName);
console.log('  Public URL:', docUrl);
console.log('  Expected:', 'https://eduardospandre.com/eduardo/storage/documents/document_1.pdf');
console.log('  ✅ Correcto:', docUrl === 'https://eduardospandre.com/eduardo/storage/documents/document_1.pdf');
console.log('');

// Test 4: Documento con subdirectorio
const docSubRemotePath = `${FTP_DOCUMENTS_DIR}video_name_1/document_2.pdf`;
const docSubFileName = 'document_2.pdf';
const docSubUrl = buildPublicUrl(docSubRemotePath, docSubFileName);
console.log('Documento con subdirectorio:');
console.log('  Remote Path:', docSubRemotePath);
console.log('  File Name:', docSubFileName);
console.log('  Public URL:', docSubUrl);
console.log('  Expected:', 'https://eduardospandre.com/eduardo/storage/documents/video_name_1/document_2.pdf');
console.log('  ✅ Correcto:', docSubUrl === 'https://eduardospandre.com/eduardo/storage/documents/video_name_1/document_2.pdf');
console.log(''); 
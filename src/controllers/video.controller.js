const Video = require('../models/video.model');
const Certificacion = require('../models/certificacion.model');
const { uploadVideoToFtp, deleteFromFtp } = require('../middleware/upload.middleware');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/db');

// Función auxiliar para transformar propiedades de videos a inglés
const transformVideoToEnglish = (video) => {
  if (!video) return null;
  
  return {
    id: video.id,
    video_name: video.nombre_video,
    video_path: video.ruta_video,
    duration: video.duracion,
    certification_id: video.certificacion_id,
    certification_name: video.nombre_certificacion
  };
};

// Get all videos
const getAllVideos = async (req, res) => {
  try {
    // Parámetros de paginación y filtrado
    const limite = parseInt(req.query.limite) || 10;
    const pagina = parseInt(req.query.pagina) || 1;
    const offset = (pagina - 1) * limite;
    const nombre_video = req.query.nombre_video;
    const certificacion_id = req.query.certificacion_id;
    
    // Construir objeto de filtros
    const filtros = {};
    if (nombre_video) filtros.nombre_video = nombre_video;
    if (certificacion_id) filtros.certificacion_id = certificacion_id;
    
    // Obtener el total de registros para calcular total de páginas
    const totalRegistros = await Video.count(filtros);
    const totalPaginas = Math.ceil(totalRegistros / limite);
    
    // Obtener los videos paginados y filtrados
    const videos = await Video.getAll(limite, offset, filtros);
    
    // Obtener documentos para cada video
    const videosWithDocuments = await Promise.all(videos.map(async (video) => {
      const documents = await Video.getDocumentosByVideoId(video.id);
      const transformedVideo = transformVideoToEnglish(video);
      return {
        ...transformedVideo,
        documents: documents || [] // Si no hay documentos, devolver array vacío
      };
    }));
    
    res.json({
      title: "Successful videos query",
      statusCode: 200,
      data: {
        videos: videosWithDocuments,
        pagination: {
          total: totalRegistros,
          totalPages: totalPaginas,
          currentPage: pagina,
          limit: limite
        }
      }
    });
  } catch (error) {
    console.error('Error retrieving videos:', error);
    res.status(500).json({ 
      title: "Error retrieving videos",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Get a video by ID
const getVideoById = async (req, res) => {
  try {
    const id = req.params.id;
    const video = await Video.getById(id);
    
    if (!video) {
      return res.status(404).json({ 
        title: "Video not found",
        statusCode: 404,
        message: 'Video not found' 
      });
    }
    
    // Transformar video a formato en inglés
    const transformedVideo = transformVideoToEnglish(video);
    
    res.json({
      title: "Successful video query",
      statusCode: 200,
      data: transformedVideo
    });
  } catch (error) {
    console.error(`Error retrieving video with id ${req.params.id}:`, error);
    res.status(500).json({ 
      title: "Error retrieving video",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Get videos by certification ID
const getVideosByCertificationId = async (req, res) => {
  try {
    const certificationId = req.params.certificationId;
    
    // Verify if the certification exists
    const certification = await Certificacion.getById(certificationId);
    if (!certification) {
      return res.status(404).json({ 
        title: "Certification not found",
        statusCode: 404,
        message: 'Certification not found' 
      });
    }
    
    const videos = await Video.getByCertificacionId(certificationId);
    
    // Obtener documentos para cada video
    const videosWithDocuments = await Promise.all(videos.map(async (video) => {
      const documents = await Video.getDocumentosByVideoId(video.id);
      const transformedVideo = transformVideoToEnglish(video);
      return {
        ...transformedVideo,
        documents: documents || [] // Si no hay documentos, devolver array vacío
      };
    }));
    
    res.json({
      title: "Successful videos by certification query",
      statusCode: 200,
      data: {
        certification: {
          id: certification.id,
          certification_name: certification.nombre_certificacion
        },
        videos: videosWithDocuments,
        total: videos.length
      }
    });
  } catch (error) {
    console.error(`Error retrieving videos for certification with id ${req.params.certificationId}:`, error);
    res.status(500).json({ 
      title: "Error retrieving videos",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Get documents by video ID
const getDocumentsByVideoId = async (req, res) => {
  try {
    const videoId = req.params.id;
    
    // Verify if the video exists
    const video = await Video.getById(videoId);
    if (!video) {
      return res.status(404).json({ 
        title: "Video not found",
        statusCode: 404,
        message: 'Video not found' 
      });
    }
    
    const documents = await Video.getDocumentsByVideoId(videoId);
    
    res.json({
      title: "Successful documents by video query",
      statusCode: 200,
      data: {
        video: transformVideoToEnglish(video),
        documents,
        total: documents.length
      }
    });
  } catch (error) {
    console.error(`Error retrieving documents for video with id ${req.params.id}:`, error);
    res.status(500).json({ 
      title: "Error retrieving documents",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Create a new video
const createVideo = async (req, res) => {
  try {
    const { video_name, duration, certification_id } = req.body;
    
    // Validar campos obligatorios
    if (!video_name || !certification_id) {
      return res.status(400).json({ 
        title: "Incomplete data",
        statusCode: 400,
        message: 'Required fields: video_name, certification_id' 
      });
    }
    
    // Verificar si la certificación existe
    const certification = await Certificacion.getById(certification_id);
    if (!certification) {
      return res.status(404).json({ 
        title: "Certification not found",
        statusCode: 404,
        message: 'The specified certification does not exist' 
      });
    }
    
    // Verificar que se proporcione un video
    if (!req.file && !req.body.video_path) {
      return res.status(400).json({
        title: "Video required",
        statusCode: 400,
        message: 'Either upload a video file or provide a video_path'
      });
    }
    
    // Variable para almacenar la ruta del video
    let video_path = null;
    
    // Si se proporciona un archivo, subirlo a FTP
    if (req.file) {
      // Primero necesitamos tener un ID para este video
      // Vamos a generar un ID temporal único basado en timestamp
      const tempId = Date.now();
      
      // Subir el video con el ID temporal usando el buffer
      const videoUploadResult = await uploadVideoToFtp(req.file.buffer, {
        video_name: video_name,
        id: tempId, // ID temporal para subida
        certification_id: certification_id,
        certification_name: certification.nombre_certificacion
      });
      
      if (!videoUploadResult.success) {
        return res.status(500).json({
          title: "Error uploading video",
          statusCode: 500,
          error: videoUploadResult.error,
          details: videoUploadResult.details
        });
      }
      
      // Guardar la URL del video
      video_path = videoUploadResult.url;
    } else if (req.body.video_path) {
      // Si se proporciona una URL en lugar de un archivo
      video_path = req.body.video_path;
    }
    
    // Ahora que tenemos la ruta del video, crear el registro en la base de datos
    const newVideo = await Video.create({ 
      nombre_video: video_name,
      ruta_video: video_path, // Ya tenemos la URL
      duracion: duration || null,
      certificacion_id: certification_id
    });
    
    // Si subimos un archivo con ID temporal, renombrar para usar el ID real
    if (req.file && video_path) {
      try {
        // URL actual tiene el ID temporal
        // Necesitamos reemplazarlo con el ID real
        const newVideoPath = video_path.replace(`_${tempId}`, `_${newVideo.id}`);
        
        // Actualizar la ruta en la base de datos
        await Video.update(newVideo.id, { ruta_video: newVideoPath });
        video_path = newVideoPath;
      } catch (renameError) {
        console.error('Error al renombrar el archivo de video:', renameError);
        // Continuamos aunque falle el renombrado
      }
    }
    
    // Obtener el video completo con el nombre de la certificación
    const completeVideo = await Video.getById(newVideo.id);
    
    // Transformar a formato en inglés para la respuesta
    const transformedVideo = transformVideoToEnglish(completeVideo);
    
    res.status(201).json({
      title: "Video created successfully",
      statusCode: 201,
      data: transformedVideo
    });
  } catch (error) {
    console.error('Error creating video:', error);
    
    // Check if it's a foreign key error (certification doesn't exist)
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        title: "Reference error",
        statusCode: 400,
        message: 'The specified certification does not exist' 
      });
    }
    
    res.status(500).json({ 
      title: "Error creating video",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Update a video
const updateVideo = async (req, res) => {
  try {
    const id = req.params.id;
    const { video_name, duration, certification_id } = req.body;
    
    // Verificar si el video existe
    const existingVideo = await Video.getById(id);
    if (!existingVideo) {
      return res.status(404).json({ 
        title: "Video not found",
        statusCode: 404,
        message: 'Video not found' 
      });
    }
    
    // Si se especifica una certificación, verificar que exista
    let certification = null;
    if (certification_id) {
      certification = await Certificacion.getById(certification_id);
      if (!certification) {
        return res.status(404).json({ 
          title: "Certification not found",
          statusCode: 404,
          message: 'The specified certification does not exist' 
        });
      }
    } else {
      // Si no se especifica, usamos la certificación actual del video
      certification = await Certificacion.getById(existingVideo.certificacion_id);
    }
    
    // Procesar el archivo de video si fue enviado
    let video_path = null;
    if (req.file) {
      // Si hay un video anterior, eliminarlo
      if (existingVideo.ruta_video) {
        try {
          console.log(`Eliminando video anterior: ${existingVideo.ruta_video}`);
          const deleteResult = await deleteFromFtp(existingVideo.ruta_video);
          if (!deleteResult.success) {
            console.warn(`No se pudo eliminar el video anterior, pero continuaremos con la actualización. Detalles: ${deleteResult.error}`);
          } else {
            console.log(`Video anterior eliminado correctamente: ${existingVideo.ruta_video}`);
          }
        } catch (deleteError) {
          console.error('Error eliminando video anterior:', deleteError);
          // Continuar con el proceso aunque falle la eliminación
        }
      }
      
      console.log(`Subiendo nuevo video para reemplazar ID: ${id}`);
      // Subir el nuevo video usando el buffer
      const videoUploadResult = await uploadVideoToFtp(req.file.buffer, {
        video_name: video_name || existingVideo.nombre_video,
        id: existingVideo.id,
        certification_id: certification_id || existingVideo.certificacion_id,
        certification_name: certification ? certification.nombre_certificacion : null
      });
      
      if (!videoUploadResult.success) {
        return res.status(500).json({
          title: "Error uploading video",
          statusCode: 500,
          error: videoUploadResult.error,
          details: videoUploadResult.details
        });
      }
      
      video_path = videoUploadResult.url;
    }
    
    // Preparar objeto de actualización (mapear a nombres en español para el modelo)
    const updateData = {};
    if (video_name) updateData.nombre_video = video_name;
    if (video_path) updateData.ruta_video = video_path;
    if (duration !== undefined) updateData.duracion = duration;
    if (certification_id) updateData.certificacion_id = certification_id;
    
    // Si se proporcionó una URL de video en lugar de un archivo
    if (!video_path && req.body.video_path) {
      updateData.ruta_video = req.body.video_path;
    }
    
    // Actualizar el video
    await Video.update(id, updateData);
    
    // Obtener el video actualizado
    const updatedVideo = await Video.getById(id);
    
    // Transformar a formato en inglés para la respuesta
    const transformedVideo = transformVideoToEnglish(updatedVideo);
    
    res.json({
      title: "Video updated successfully",
      statusCode: 200,
      data: transformedVideo
    });
  } catch (error) {
    console.error(`Error updating video with id ${req.params.id}:`, error);
    
    // Check if it's a foreign key error (certification doesn't exist)
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        title: "Reference error",
        statusCode: 400,
        message: 'The specified certification does not exist' 
      });
    }
    
    res.status(500).json({ 
      title: "Error updating video",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Delete a video
const deleteVideo = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Verify if the video exists
    const existingVideo = await Video.getById(id);
    if (!existingVideo) {
      return res.status(404).json({ 
        title: "Video not found",
        statusCode: 404,
        message: 'Video not found' 
      });
    }
    
    // Intentar eliminar el video del servidor FTP
    if (existingVideo.ruta_video) {
      try {
        await deleteFromFtp(existingVideo.ruta_video);
      } catch (deleteError) {
        console.error('Error deleting video file:', deleteError);
        // Continuar con el proceso aunque falle la eliminación
      }
    }
    
    const deleted = await Video.delete(id);
    
    if (deleted) {
      res.json({ 
        title: "Video deleted successfully",
        statusCode: 200,
        message: 'Video deleted correctly (including associated documents)',
        id 
      });
    } else {
      res.status(400).json({ 
        title: "Delete failed",
        statusCode: 400,
        message: 'Could not delete video' 
      });
    }
  } catch (error) {
    console.error(`Error deleting video with id ${req.params.id}:`, error);
    res.status(500).json({ 
      title: "Error deleting video",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Método de prueba para subir videos vía FTP
const testVideoUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        title: "No file uploaded",
        statusCode: 400,
        message: "Please upload a test video file"
      });
    }
    
    // Obtener información de certificación si se proporciona
    let certificationInfo = {};
    if (req.body.certification_id) {
      try {
        const certification = await Certificacion.getById(req.body.certification_id);
        if (certification) {
          certificationInfo = {
            certification_id: certification.id,
            certification_name: certification.nombre_certificacion
          };
        }
      } catch (certError) {
        console.error('Error al obtener certificación para prueba:', certError);
      }
    }
    
    console.log("Archivo recibido:", req.file);
    
    // Simular un ID para la prueba
    const testId = Date.now(); // Usamos un timestamp como ID simulado de prueba
    
    // Subir el archivo al FTP
    const uploadResult = await uploadVideoToFtp(req.file.buffer, {
      video_name: req.body.video_name || "test_video",
      id: testId, // Agregamos un ID simulado para la prueba
      ...certificationInfo
    });
    
    if (!uploadResult.success) {
      return res.status(500).json({
        title: "Error uploading video",
        statusCode: 500,
        error: uploadResult.error,
        details: uploadResult.details
      });
    }
    
    res.json({
      title: "Test video upload successful",
      statusCode: 200,
      data: {
        file: req.file,
        uploadResult,
        certification: certificationInfo
      }
    });
  } catch (error) {
    console.error('Error in test video upload:', error);
    res.status(500).json({
      title: "Error in test video upload",
      statusCode: 500,
      error: error.message
    });
  }
};

// Nuevo método para obtener videos de certificaciones activas (para clientes)
const getVideosByCertificacionActiva = async (req, res) => {
  try {
    const certificacionId = req.params.certificacionId;
    const clienteId = req.usuario.id;
    
    // Verificar si la certificación existe y está activa
    const certificacion = await Certificacion.getById(certificacionId);
    if (!certificacion) {
      return res.status(404).json({ 
        title: "Certification not found",
        statusCode: 404,
        message: 'Certification not found' 
      });
    }
    
    if (!certificacion.activa) {
      return res.status(403).json({ 
        title: "Certification not active",
        statusCode: 403,
        message: 'This certification is not currently active' 
      });
    }
    
    // Verificar si el cliente tiene acceso a esta certificación
    const [clienteCertificacion] = await pool.query(`
      SELECT activa FROM clientes_certificaciones 
      WHERE cliente_id = ? AND certificacion_id = ?
    `, [clienteId, certificacionId]);
    
    if (clienteCertificacion.length === 0) {
      return res.status(403).json({ 
        title: "Access denied",
        statusCode: 403,
        message: 'You do not have access to this certification' 
      });
    }
    
    if (!clienteCertificacion[0].activa) {
      return res.status(403).json({ 
        title: "Access denied",
        statusCode: 403,
        message: 'Your access to this certification has been deactivated' 
      });
    }
    
    const videos = await Video.getByCertificacionActivaId(certificacionId);
    
    // Obtener documentos para cada video
    const videosWithDocuments = await Promise.all(videos.map(async (video) => {
      const documents = await Video.getDocumentosByVideoId(video.id);
      const transformedVideo = transformVideoToEnglish(video);
      return {
        ...transformedVideo,
        documents: documents || []
      };
    }));
    
    res.json({
      title: "Successful videos by active certification query",
      statusCode: 200,
      data: {
        certification: {
          id: certificacion.id,
          certification_name: certificacion.nombre_certificacion
        },
        videos: videosWithDocuments,
        total: videos.length
      }
    });
  } catch (error) {
    console.error(`Error retrieving videos for active certification with id ${req.params.certificacionId}:`, error);
    res.status(500).json({ 
      title: "Error retrieving videos",
      statusCode: 500,
      error: error.message 
    });
  }
};

module.exports = {
  getAllVideos,
  getVideoById,
  getVideosByCertificationId,
  getDocumentsByVideoId,
  createVideo,
  updateVideo,
  deleteVideo,
  testVideoUpload,
  getVideosByCertificacionActiva
}; 
const Documento = require('../models/documento.model');
const Video = require('../models/video.model');
const { uploadDocumentToFtp, deleteFromFtp } = require('../middleware/upload.middleware');

// Get all documents
const getAllDocuments = async (req, res) => {
  try {
    // Parámetros de paginación y filtrado
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    // Aquí podrías agregar más filtros si lo deseas

    const documents = await Documento.getAll(limit, offset);
    const total = await Documento.count();
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      title: "Successful documents query",
      statusCode: 200,
      data: {
        documents,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Error retrieving documents:', error);
    res.status(500).json({ 
      title: "Error retrieving documents",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Get a document by ID
const getDocumentById = async (req, res) => {
  try {
    const id = req.params.id;
    const document = await Documento.getById(id);
    
    if (!document) {
      return res.status(404).json({ 
        title: "Document not found",
        statusCode: 404,
        message: 'Document not found' 
      });
    }
    
    res.json({
      title: "Successful document query",
      statusCode: 200,
      data: document
    });
  } catch (error) {
    console.error(`Error retrieving document with id ${req.params.id}:`, error);
    res.status(500).json({ 
      title: "Error retrieving document",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Get documents by video ID
const getDocumentsByVideoId = async (req, res) => {
  try {
    const videoId = req.params.videoId;
    
    // Verify if the video exists
    const video = await Video.getById(videoId);
    if (!video) {
      return res.status(404).json({ 
        title: "Video not found",
        statusCode: 404,
        message: 'Video not found' 
      });
    }
    
    const documents = await Documento.getByVideoId(videoId);
    
    res.json({
      title: "Successful documents by video query",
      statusCode: 200,
      data: {
        video: {
          id: video.id,
          name: video.nombre_video
        },
        documents,
        total: documents.length
      }
    });
  } catch (error) {
    console.error(`Error retrieving documents for video with id ${req.params.videoId}:`, error);
    res.status(500).json({ 
      title: "Error retrieving documents",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Create a new document
const createDocument = async (req, res) => {
  try {
    // Aceptar tanto nombre_documento como document_name (preferencia por document_name)
    let { nombre_documento, document_name, video_id } = req.body;
    
    // Si se proporciona document_name, usarlo en lugar de nombre_documento
    if (document_name) {
      nombre_documento = document_name;
    }
    
    // Validate required fields
    if (!nombre_documento || !video_id) {
      return res.status(400).json({ 
        title: "Datos incompletos",
        statusCode: 400,
        message: 'Campos requeridos: document_name, video_id' 
      });
    }
    
    // Verify if the video exists
    const video = await Video.getById(video_id);
    if (!video) {
      return res.status(404).json({ 
        title: "Video no encontrado",
        statusCode: 404,
        message: 'El video especificado no existe' 
      });
    }
    
    let ruta_documento = null;
    let temporalId = null;
    
    // Procesar el archivo si existe
    if (req.file) {
      const uploadResult = await uploadDocumentToFtp(
        req.file.buffer, 
        {
          document_name: nombre_documento,
          originalname: req.file.originalname, // <-- Agregado
          video_id: video_id,
          video_name: video.nombre_video
        }
      );
      
      if (!uploadResult.success) {
        return res.status(500).json({
          title: "Error en la carga del documento",
          statusCode: 500,
          error: uploadResult.error,
          details: uploadResult.details
        });
      }
      
      ruta_documento = uploadResult.url;
      temporalId = uploadResult.temporalId;
    } else {
      return res.status(400).json({
        title: "Archivo no proporcionado",
        statusCode: 400,
        message: "Debe proporcionar un archivo de documento"
      });
    }
    
    // Crear el documento en la base de datos
    const newDocument = await Documento.create({ 
      nombre_documento, 
      ruta_documento, 
      video_id 
    });
    
    // Si se utilizó un ID temporal, actualizar la ruta con el ID real
    if (temporalId && ruta_documento) {
      const tempFilePath = ruta_documento;
      
      // Reemplazar el ID temporal con el ID real en la ruta
      const updatedPath = tempFilePath.replace(`_${temporalId}`, `_${newDocument.id}`);
      
      // Intentar renombrar el archivo en el FTP
      try {
        // Aquí iría la lógica para renombrar en el FTP si es necesario
        // Por ahora, solo actualizamos la ruta en la base de datos
        await Documento.update(newDocument.id, { 
          ruta_documento: updatedPath 
        });
        
        // Actualizar el objeto a devolver
        newDocument.ruta_documento = updatedPath;
      } catch (renameError) {
        console.error('Error renombrando archivo de documento:', renameError);
        // Continuar con la ruta temporal si no se puede renombrar
      }
    }
    
    // Get the complete document with video name
    const completeDocument = await Documento.getById(newDocument.id);
    
    res.status(201).json({
      title: "Documento creado exitosamente",
      statusCode: 201,
      data: completeDocument
    });
  } catch (error) {
    console.error('Error creando documento:', error);
    
    // Check if it's a foreign key error (video doesn't exist)
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        title: "Error de referencia",
        statusCode: 400,
        message: 'El video especificado no existe' 
      });
    }
    
    res.status(500).json({ 
      title: "Error creando documento",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Update an existing document
const updateDocument = async (req, res) => {
  try {
    const id = req.params.id;
    // Aceptar tanto nombre_documento como document_name (preferencia por document_name)
    let { nombre_documento, document_name, video_id } = req.body;
    
    // Si se proporciona document_name, usarlo en lugar de nombre_documento
    if (document_name) {
      nombre_documento = document_name;
    }
    
    // Validate required fields
    if (!nombre_documento || !video_id) {
      return res.status(400).json({ 
        title: "Datos incompletos",
        statusCode: 400,
        message: 'Campos requeridos: document_name, video_id' 
      });
    }
    
    // Verify if the document exists
    const existingDocument = await Documento.getById(id);
    if (!existingDocument) {
      return res.status(404).json({ 
        title: "Documento no encontrado",
        statusCode: 404,
        message: 'Documento no encontrado' 
      });
    }
    
    // Verify if the video exists
    const video = await Video.getById(video_id);
    if (!video) {
      return res.status(404).json({ 
        title: "Video no encontrado",
        statusCode: 404,
        message: 'El video especificado no existe' 
      });
    }
    
    let ruta_documento = existingDocument.ruta_documento;
    
    // Procesar el archivo si existe uno nuevo
    if (req.file) {
      // Intentar eliminar el archivo anterior si existe
      if (existingDocument.ruta_documento) {
        try {
          console.log(`Eliminando documento anterior: ${existingDocument.ruta_documento}`);
          await deleteFromFtp(existingDocument.ruta_documento);
          console.log('Documento anterior eliminado correctamente');
        } catch (deleteError) {
          console.error('Error eliminando documento anterior:', deleteError);
          // Continuar incluso si falla la eliminación
        }
      }
      
      // Subir el nuevo documento usando el buffer
      const uploadResult = await uploadDocumentToFtp(
        req.file.buffer, 
        {
          document_name: nombre_documento,
          originalname: req.file.originalname, // <-- Agregado
          id: id, // Ya tenemos el ID real
          video_id: video_id,
          video_name: video.nombre_video
        }
      );
      
      if (!uploadResult.success) {
        return res.status(500).json({
          title: "Error en la carga del documento",
          statusCode: 500,
          error: uploadResult.error,
          details: uploadResult.details
        });
      }
      
      ruta_documento = uploadResult.url;
    }
    
    // Actualizar el documento en la base de datos
    const updated = await Documento.update(id, { 
      nombre_documento, 
      ruta_documento, 
      video_id 
    });
    
    if (updated) {
      // Get the updated document with video name
      const updatedDocument = await Documento.getById(id);
      
      res.json({ 
        title: "Documento actualizado exitosamente",
        statusCode: 200,
        data: updatedDocument
      });
    } else {
      res.status(400).json({ 
        title: "Actualización fallida",
        statusCode: 400,
        message: 'No se pudo actualizar el documento' 
      });
    }
  } catch (error) {
    console.error(`Error actualizando documento con id ${req.params.id}:`, error);
    
    // Check if it's a foreign key error (video doesn't exist)
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        title: "Error de referencia",
        statusCode: 400,
        message: 'El video especificado no existe' 
      });
    }
    
    res.status(500).json({ 
      title: "Error actualizando documento",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Delete a document
const deleteDocument = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Verify if the document exists
    const existingDocument = await Documento.getById(id);
    if (!existingDocument) {
      return res.status(404).json({ 
        title: "Documento no encontrado",
        statusCode: 404,
        message: 'Documento no encontrado' 
      });
    }
    
    // Intentar eliminar el archivo si existe
    if (existingDocument.ruta_documento) {
      try {
        console.log(`Eliminando documento: ${existingDocument.ruta_documento}`);
        await deleteFromFtp(existingDocument.ruta_documento);
        console.log('Documento eliminado correctamente del FTP');
      } catch (deleteError) {
        console.error('Error eliminando documento de FTP:', deleteError);
        // Continuar incluso si falla la eliminación del archivo
      }
    }
    
    const deleted = await Documento.delete(id);
    
    if (deleted) {
      res.json({ 
        title: "Documento eliminado exitosamente",
        statusCode: 200,
        message: 'Documento eliminado correctamente'
      });
    } else {
      res.status(400).json({ 
        title: "Eliminación fallida",
        statusCode: 400,
        message: 'No se pudo eliminar el documento' 
      });
    }
  } catch (error) {
    console.error(`Error eliminando documento con id ${req.params.id}:`, error);
    
    res.status(500).json({ 
      title: "Error eliminando documento",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Test document upload
const testUploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        title: "Archivo no proporcionado",
        statusCode: 400,
        message: "Debe proporcionar un archivo de documento"
      });
    }
    
    // Extraer datos del video si existen
    const videoData = {
      video_id: req.body.video_id || null,
      video_name: req.body.video_name || null,
      document_name: req.body.document_name || req.file.originalname
    };
    
    const uploadResult = await uploadDocumentToFtp(req.file.buffer, videoData);
    
    if (!uploadResult.success) {
      return res.status(500).json({
        title: "Error en la carga del documento",
        statusCode: 500,
        error: uploadResult.error,
        details: uploadResult.details
      });
    }
    
    res.status(200).json({
      title: "Documento subido exitosamente",
      statusCode: 200,
      data: {
        originalName: req.file.originalname,
        uploadedUrl: uploadResult.url,
        temporalId: uploadResult.temporalId,
        message: uploadResult.message
      }
    });
  } catch (error) {
    console.error('Error en prueba de carga de documento:', error);
    res.status(500).json({
      title: "Error en prueba de carga",
      statusCode: 500,
      error: error.message
    });
  }
};

module.exports = {
  getAllDocuments,
  getDocumentById,
  getDocumentsByVideoId,
  createDocument,
  updateDocument,
  deleteDocument,
  testUploadDocument
}; 
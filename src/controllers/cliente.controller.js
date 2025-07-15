const Cliente = require('../models/cliente.model');
const Certificacion = require('../models/certificacion.model');
const Video = require('../models/video.model');

// Obtener empresas asociadas al cliente autenticado
const getMyCompanies = async (req, res) => {
  try {
    const clienteId = req.usuario.id;
    
    // Verificar si el cliente existe
    const cliente = await Cliente.getById(clienteId);
    if (!cliente) {
      return res.status(404).json({ 
        title: "Cliente no encontrado",
        statusCode: 404,
        message: 'Cliente no encontrado' 
      });
    }
    
    const empresas = await Cliente.getEmpresasByClienteId(clienteId);
    
    res.json({
      title: "Consulta de empresas del cliente exitosa",
      statusCode: 200,
      data: {
        companies: empresas,
        total: empresas.length
      }
    });
  } catch (error) {
    console.error(`Error al obtener empresas del cliente con id ${req.usuario.id}:`, error);
    res.status(500).json({ 
      title: "Error al obtener empresas",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Obtener certificaciones activas asociadas al cliente autenticado (solo las que puede acceder)
const getMyCertifications = async (req, res) => {
  try {
    const clienteId = req.usuario.id;
    
    // Verificar si el cliente existe
    const cliente = await Cliente.getById(clienteId);
    if (!cliente) {
      return res.status(404).json({ 
        title: "Cliente no encontrado",
        statusCode: 404,
        message: 'Cliente no encontrado' 
      });
    }
    
    const certificaciones = await Cliente.getCertificacionesActivasByClienteId(clienteId);
    
    res.json({
      title: "Consulta de certificaciones activas del cliente exitosa",
      statusCode: 200,
      data: {
        certifications: certificaciones,
        total: certificaciones.length
      }
    });
  } catch (error) {
    console.error(`Error al obtener certificaciones del cliente con id ${req.usuario.id}:`, error);
    res.status(500).json({ 
      title: "Error al obtener certificaciones",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Obtener todas las certificaciones del cliente (activas e inactivas) - para historial
const getAllMyCertifications = async (req, res) => {
  try {
    const clienteId = req.usuario.id;
    
    // Verificar si el cliente existe
    const cliente = await Cliente.getById(clienteId);
    if (!cliente) {
      return res.status(404).json({ 
        title: "Cliente no encontrado",
        statusCode: 404,
        message: 'Cliente no encontrado' 
      });
    }
    
    const certificaciones = await Cliente.getCertificacionesByClienteId(clienteId);
    
    res.json({
      title: "Consulta de historial de certificaciones del cliente exitosa",
      statusCode: 200,
      data: {
        certifications: certificaciones,
        total: certificaciones.length
      }
    });
  } catch (error) {
    console.error(`Error al obtener historial de certificaciones del cliente con id ${req.usuario.id}:`, error);
    res.status(500).json({ 
      title: "Error al obtener historial de certificaciones",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Obtener perfil del cliente autenticado
const getMyProfile = async (req, res) => {
  try {
    const clienteId = req.usuario.id;
    
    const cliente = await Cliente.getById(clienteId);
    if (!cliente) {
      return res.status(404).json({ 
        title: "Cliente no encontrado",
        statusCode: 404,
        message: 'Cliente no encontrado' 
      });
    }
    
    // Excluir la contraseña del objeto cliente
    const { contrasenia, ...clienteSinPassword } = cliente;
    
    res.json({
      title: "Consulta de perfil exitosa",
      statusCode: 200,
      data: clienteSinPassword
    });
  } catch (error) {
    console.error(`Error al obtener perfil del cliente con id ${req.usuario.id}:`, error);
    res.status(500).json({ 
      title: "Error al obtener perfil",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Obtener todos los videos y documentos relacionados de una certificación para el cliente autenticado
const getMyVideosAndDocumentsByCertification = async (req, res) => {
  try {
    const clienteId = req.usuario.id;
    const certificationId = req.params.certificationId;

    // Verificar si el cliente tiene acceso a la certificación
    const certificaciones = await Cliente.getCertificacionesByClienteId(clienteId);
    const certificacion = certificaciones.find(c => c.id == certificationId);
    if (!certificacion) {
      return res.status(403).json({
        title: "Acceso denegado",
        statusCode: 403,
        message: 'No tienes acceso a esta certificación'
      });
    }

    // Verificar si la certificación está activa
    if (!certificacion.activa) {
      return res.status(403).json({
        title: "Certificación inactiva",
        statusCode: 403,
        message: 'Esta certificación se encuentra inactiva en este momento.'
      });
    }

    // Obtener los videos de la certificación
    const videos = await Video.getByCertificacionId(certificationId);
    // Para cada video, obtener sus documentos
    const videosWithDocuments = await Promise.all(videos.map(async (video) => {
      const documents = await Video.getDocumentosByVideoId(video.id);
      return {
        id: video.id,
        video_name: video.nombre_video,
        video_path: video.ruta_video,
        duration: video.duracion,
        certification_id: video.certificacion_id,
        documents: documents || []
      };
    }));

    res.json({
      title: "Consulta de videos y documentos exitosa",
      statusCode: 200,
      data: {
        certification_id: certificationId,
        videos: videosWithDocuments,
        total: videosWithDocuments.length
      }
    });
  } catch (error) {
    console.error(`Error al obtener videos y documentos para certificación ${req.params.certificationId}:`, error);
    res.status(500).json({
      title: "Error al obtener videos y documentos",
      statusCode: 500,
      error: error.message
    });
  }
};

module.exports = {
  getMyCompanies,
  getMyCertifications,
  getAllMyCertifications,
  getMyProfile,
  getMyVideosAndDocumentsByCertification
}; 
const Certificacion = require('../models/certificacion.model');
const Empresa = require('../models/empresa.model');
const { uploadToFtp, deleteFromFtp } = require('../middleware/upload.middleware');
const path = require('path');
const { Client } = require('basic-ftp');
const fs = require('fs');
require('dotenv').config();

// Helper function to transform certification objects from Spanish properties to English properties
const transformCertificationToEnglish = (certification) => {
  return {
    id: certification.id,
    certification_name: certification.nombre_certificacion,
    certification_photo: certification.foto_certificacion,
    company_id: certification.empresa_id,
    company_name: certification.nombre_empresa
  };
};

// Helper function to transform video objects from Spanish to English properties
const transformVideoToEnglish = (video) => {
  return {
    id: video.id,
    video_name: video.nombre_video,
    video_path: video.ruta_video,
    duration: video.duracion,
    certification_id: video.certificacion_id,
    documents: video.documents || []
  };
};

// Get all certifications with pagination and filters
const getAllCertifications = async (req, res) => {
  try {
    // Pagination and filtering parameters
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    const name = req.query.name;
    const company_id = req.query.company_id;
    const company_name = req.query.company_name;
    
    // Get total records to calculate total pages
    const filters = {};
    if (name) filters.nombre = name;
    if (company_id) filters.empresa_id = company_id;
    if (company_name) filters.empresa_nombre = company_name;
    
    const totalRecords = await Certificacion.count(filters);
    const totalPages = Math.ceil(totalRecords / limit);
    
    // Get paginated and filtered data
    const certifications = await Certificacion.getAll(limit, offset, filters);
    
    // Transform certifications to use English property names
    const transformedCertifications = certifications.map(cert => transformCertificationToEnglish(cert));
    
    // Structured response
    res.json({
      title: "Successful certifications query",
      statusCode: 200,
      data: {
        certifications: transformedCertifications,
        pagination: {
          total: totalRecords,
          totalPages: totalPages,
          currentPage: page,
          limit: limit
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      title: "Error retrieving certifications",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Get a certification by ID
const getCertificationById = async (req, res) => {
  try {
    const id = req.params.id;
    const certification = await Certificacion.getById(id);
    
    if (!certification) {
      return res.status(404).json({ 
        title: "Certification not found",
        statusCode: 404,
        message: 'Certification not found' 
      });
    }
    
    // Transform certification to use English property names
    const transformedCertification = transformCertificationToEnglish(certification);
    
    res.json({
      title: "Successful certification query",
      statusCode: 200,
      data: transformedCertification
    });
  } catch (error) {
    res.status(500).json({ 
      title: "Error retrieving certification",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Get certifications by company ID
const getCertificationsByCompanyId = async (req, res) => {
  try {
    const companyId = req.params.companyId;
    
    // Verify if the company exists
    const company = await Empresa.getById(companyId);
    if (!company) {
      return res.status(404).json({ 
        title: "Company not found",
        statusCode: 404,
        message: 'Company not found' 
      });
    }
    
    const certifications = await Certificacion.getByEmpresaId(companyId);
    
    // Transformar certificaciones para usar nombres de propiedades en inglés
    const transformedCertifications = certifications.map(cert => transformCertificationToEnglish(cert));
    
    res.json({
      title: "Successful certifications by company query",
      statusCode: 200,
      data: {
        company: {
          id: company.id,
          company_name: company.nombre
        },
        certifications: transformedCertifications,
        total: certifications.length
      }
    });
  } catch (error) {
    res.status(500).json({ 
      title: "Error retrieving certifications",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Create a new certification
const createCertification = async (req, res) => {
  try {
    const { nombre_certificacion, empresa_id  } = req.body;
    
    // Validar campos requeridos
    if (!nombre_certificacion || !empresa_id) {
      return res.status(400).json({ 
        title: "Incomplete data",
        statusCode: 400,
        message: 'Required fields: nombre_certificacion, empresa_id' 
      });
    }
    
    // Verificar si la empresa existe
    const empresa = await Empresa.getById(empresa_id);
    if (!empresa) {
      return res.status(400).json({ 
        title: "Company not found",
        statusCode: 400,
        message: 'The specified company does not exist' 
      });
    }
    
    // Variable para almacenar la ruta de la foto
    let ruta_foto = null;
    let temporalId = null;
    
    // Procesar la foto si existe
    if (req.file && req.file.buffer) {
      const uploadResult = await uploadToFtp(req.file.buffer, { 
        certification_name: nombre_certificacion,
        originalname: req.file.originalname 
      });
      
      if (!uploadResult.success) {
        return res.status(500).json({
          title: "Error uploading photo",
          statusCode: 500,
          error: uploadResult.error,
          details: uploadResult.details
        });
      }
      
      ruta_foto = uploadResult.url;
      temporalId = uploadResult.temporalId;
    }
    
    // Crear la certificación
    const nuevaCertificacion = await Certificacion.create({ 
      nombre_certificacion, 
      foto_certificacion: ruta_foto, 
      empresa_id 
    });
    
    // Si se utilizó un ID temporal, actualizar la ruta con el ID real
    if (temporalId && ruta_foto) {
      const tempFilePath = ruta_foto;
      
      // Reemplazar el ID temporal con el ID real en la ruta
      const updatedPath = tempFilePath.replace(`_${temporalId}`, `_${nuevaCertificacion.id}`);
      
      // Actualizar la ruta en la base de datos
      await Certificacion.update(nuevaCertificacion.id, { 
        foto_certificacion: updatedPath 
      });
      
      // Actualizar el objeto a devolver
      nuevaCertificacion.foto_certificacion = updatedPath;
    }
      
    // Obtener la certificación completa con el nombre de la empresa
    const completeCertification = await Certificacion.getById(nuevaCertificacion.id);
    // Transformar a formato en inglés para la respuesta (siempre incluye certification_photo)
    const transformedCertification = completeCertification;
    
    res.status(201).json({
      title: "Certification created successfully",
      statusCode: 201,
      data: transformedCertification
    });
  } catch (error) {
    console.error('Error creating certification:', error);
    
    // Check if it's a foreign key error (company doesn't exist)
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        title: "Reference error",
        statusCode: 400,
        message: 'The specified company does not exist' 
      });
    }
    
    res.status(500).json({ 
      title: "Error creating certification",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Update a certification
const updateCertification = async (req, res) => {
  try {
    const id = req.params.id;
    const { nombre_certificacion, empresa_id } = req.body;
    
    // Verificar si la certificación existe
    const existingCertification = await Certificacion.getById(id);
    if (!existingCertification) {
      return res.status(404).json({ 
        title: "Certification not found",
        statusCode: 404,
        message: 'Certification not found' 
      });
    }
    
    // Si se especifica una empresa, verificar que exista
    if (empresa_id) {
      const empresa = await Empresa.getById(empresa_id);
      if (!empresa) {
        return res.status(400).json({ 
          title: "Company not found",
          statusCode: 400,
          message: 'The specified company does not exist' 
        });
      }
    }
    
    // Variable para almacenar la ruta de la foto
    let ruta_foto = existingCertification.foto_certificacion;
    
    // Procesar la foto si existe una nueva
    if (req.file && req.file.buffer) {
      // Intentar eliminar la foto anterior si existe
      if (existingCertification.foto_certificacion) {
        try {
          await deleteFromFtp(existingCertification.foto_certificacion);
        } catch (deleteError) {
          console.error('Error deleting previous photo:', deleteError);
          // Continuar con el proceso aunque falle la eliminación
        }
      }
      
      // Subir la nueva foto
      const uploadResult = await uploadToFtp(req.file.buffer, { 
        certification_name: nombre_certificacion || existingCertification.nombre_certificacion, 
        id,
        originalname: req.file.originalname 
      });
      
      if (!uploadResult.success) {
        return res.status(500).json({
          title: "Error uploading photo",
          statusCode: 500,
          error: uploadResult.error,
          details: uploadResult.details
        });
      }
      
      ruta_foto = uploadResult.url;
    }
    
    // Actualizar la certificación
    const updateData = {};
    if (nombre_certificacion) updateData.nombre_certificacion = nombre_certificacion;
    if (ruta_foto) updateData.foto_certificacion = ruta_foto;
    if (empresa_id) updateData.empresa_id = empresa_id;
    
    await Certificacion.update(id, updateData);
    
    // Obtener la certificación actualizada
    const updatedCertification = await Certificacion.getById(id);
    const transformedCertification = transformCertificationToEnglish(updatedCertification);
    
    res.json({
      title: "Certification updated successfully",
      statusCode: 200,
      data: transformedCertification
    });
  } catch (error) {
    console.error(`Error updating certification with id ${req.params.id}:`, error);
    
    // Check if it's a foreign key error (company doesn't exist)
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        title: "Reference error",
        statusCode: 400,
        message: 'The specified company does not exist' 
      });
    }
    
    res.status(500).json({ 
      title: "Error updating certification",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Delete a certification
const deleteCertification = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Verify if the certification exists
    const existingCertification = await Certificacion.getById(id);
    if (!existingCertification) {
      return res.status(404).json({ 
        title: "Certification not found",
        statusCode: 404,
        message: 'Certification not found' 
      });
    }
    
    // Intentar eliminar la imagen asociada
    if (existingCertification.foto_certificacion) {
      try {
        await deleteFromFtp(existingCertification.foto_certificacion);
      } catch (deleteError) {
        // Continuar con el proceso aunque falle la eliminación de la imagen
      }
    }
    
    const deleted = await Certificacion.delete(id);
    
    if (deleted) {
      res.json({ 
        title: "Certification deleted successfully",
        statusCode: 200,
        message: 'Certification deleted correctly',
        id 
      });
    } else {
      res.status(400).json({ 
        title: "Delete failed",
        statusCode: 400,
        message: 'Could not delete certification' 
      });
    }
  } catch (error) {
    // Check if it's an error because the certification has associated videos
    if (error.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(400).json({ 
        title: "Certification in use",
        statusCode: 400,
        message: 'Cannot delete certification because it has associated videos' 
      });
    }
    
    res.status(500).json({ 
      title: "Error deleting certification",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Get clients by certification ID
const getClientsByCertificationId = async (req, res) => {
  try {
    const certificationId = req.params.id;
    
    // Verify if the certification exists
    const certification = await Certificacion.getById(certificationId);
    if (!certification) {
      return res.status(404).json({ 
        title: "Certification not found",
        statusCode: 404,
        message: 'Certification not found' 
      });
    }
    
    const clients = await Certificacion.getClientesByCertificacionId(certificationId);
    
    res.json({
      title: "Successful clients by certification query",
      statusCode: 200,
      data: {
        certification: {
          id: certification.id,
          certification_name: certification.nombre_certificacion
        },
        clients: clients,
        total: clients.length
      }
    });
  } catch (error) {
    res.status(500).json({ 
      title: "Error retrieving clients",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Get videos by certification ID
const getVideosByCertificationId = async (req, res) => {
  try {
    const certificationId = req.params.id;
    
    // Verify if the certification exists
    const certification = await Certificacion.getById(certificationId);
    if (!certification) {
      return res.status(404).json({ 
        title: "Certification not found",
        statusCode: 404,
        message: 'Certification not found' 
      });
    }
    
    const videos = await Certificacion.getVideosByCertificacionId(certificationId);
    
    // Transformar los videos y sus documentos a formato en inglés
    const transformedVideos = videos.map(video => transformVideoToEnglish(video));
    
    res.json({
      title: "Successful videos by certification query",
      statusCode: 200,
      data: {
        certification: {
          id: certification.id,
          certification_name: certification.nombre_certificacion
        },
        videos: transformedVideos,
        total: videos.length
      }
    });
  } catch (error) {
    res.status(500).json({ 
      title: "Error retrieving videos",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Add a client to a certification
const addClientToCertification = async (req, res) => {
  try {
    const certificationId = req.params.id;
    const { client_id } = req.body;
    
    // Validate required fields
    if (!client_id) {
      return res.status(400).json({ 
        title: "Incomplete data",
        statusCode: 400,
        message: 'Required field: client_id' 
      });
    }
    
    // Verify if the certification exists
    const certification = await Certificacion.getById(certificationId);
    if (!certification) {
      return res.status(404).json({ 
        title: "Certification not found",
        statusCode: 404,
        message: 'Certification not found' 
      });
    }
    
    // Convertir client_id a cliente_id para el modelo
    const result = await Certificacion.addClienteToCertificacion(certificationId, client_id);
    
    if (result.success) {
      res.json({ 
        title: "Client assigned successfully",
        statusCode: 200,
        message: result.message || 'Client correctly assigned to certification',
        data: { certificationId: certificationId, clientId: client_id }
      });
    } else {
      res.status(400).json({ 
        title: "Assignment failed",
        statusCode: 400,
        message: 'Could not assign client to certification' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      title: "Error assigning client",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Remove a client from a certification
const removeClientFromCertification = async (req, res) => {
  try {
    const certificationId = req.params.certificationId;
    const clientId = req.params.clientId;
    
    // Verify if the certification exists
    const certification = await Certificacion.getById(certificationId);
    if (!certification) {
      return res.status(404).json({ 
        title: "Certification not found",
        statusCode: 404,
        message: 'Certification not found' 
      });
    }
    
    const deleted = await Certificacion.removeClienteFromCertificacion(certificationId, clientId);
    
    if (deleted) {
      res.json({ 
        title: "Client removed successfully",
        statusCode: 200,
        message: 'Client correctly removed from certification',
        data: { certificationId: certificationId, clientId: clientId }
      });
    } else {
      res.status(400).json({ 
        title: "Removal failed",
        statusCode: 400,
        message: 'Could not remove client from certification' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      title: "Error removing client",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Test FTP connection
const testFtpConnection = async (req, res) => {
  const client = new Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: parseInt(process.env.FTP_PORT || '21'),
      secure: process.env.FTP_SECURE === 'true'
    });
    
    // Explorar directorios
    const dirStructure = {};
    
    // Listar directorios en la raíz
    const rootList = await client.list('/');
    dirStructure['/'] = rootList;
    
    // Identificar los directorios potenciales en la raíz
    const rootDirs = rootList.filter(item => item.type === 2 || item.isDirectory);
    
    // Explorar cada directorio de primer nivel
    for (const dir of rootDirs) {
      try {
        const dirPath = `/${dir.name}`;
        await client.cd(dirPath);
        
        const subList = await client.list();
        dirStructure[dirPath] = subList;
        
        // Explorar subdirectorios de segundo nivel
        const subDirs = subList.filter(item => item.type === 2 || item.isDirectory);
        for (const subDir of subDirs) {
          try {
            const subDirPath = `${dirPath}/${subDir.name}`;
            await client.cd(subDirPath);
            
            const subSubList = await client.list();
            dirStructure[subDirPath] = subSubList;
            
            // Volver al directorio de primer nivel
            await client.cd(dirPath);
          } catch (subDirError) {
            // No se pudo acceder al subdirectorio
          }
        }
        
        // Volver a la raíz
        await client.cd('/');
      } catch (dirError) {
        // No se pudo acceder al directorio
      }
    }
    
    // Intentar ver si podemos crear el directorio deseado
    const targetDir = process.env.FTP_IMAGES_DIR;
    
    let canCreateDir = false;
    try {
      // Intentar navegar a algún directorio padre donde podríamos crear nuestro directorio
      if (targetDir.startsWith('/')) {
        const parts = targetDir.split('/').filter(Boolean);
        let currentPath = '/';
        let navigableDepth = 0;
        
        for (let i = 0; i < parts.length; i++) {
          const newPath = currentPath + parts[i] + '/';
          try {
            await client.cd(newPath);
            currentPath = newPath;
            navigableDepth = i + 1;
          } catch (e) {
            break; // No podemos navegar más profundo
          }
        }
        
        if (navigableDepth > 0 || currentPath === '/') {
          canCreateDir = true;
        }
      }
    } catch (err) {
      // Error al verificar
    }
    
    return res.json({
      title: "FTP connection successful",
      statusCode: 200,
      message: "FTP directory structure explored",
      directoryStructure: dirStructure,
      canPotentiallyCreateTargetDir: canCreateDir,
      recommendedActions: [
        "Revise la estructura de directorios mostrada",
        "Elija un directorio existente para almacenar las imágenes",
        "Actualice la variable FTP_IMAGES_DIR en el archivo .env"
      ]
    });
  } catch (error) {
    return res.status(500).json({
      title: "FTP connection failed",
      statusCode: 500,
      message: "Could not connect to FTP server",
      error: error.message,
      config: {
        host: process.env.FTP_HOST,
        user: process.env.FTP_USER,
        port: process.env.FTP_PORT
      }
    });
  } finally {
    client.close();
  }
};

// Test FTP connection and file uploads
const testFileUpload = async (req, res) => {
  try {
    // Verificar si hay un archivo en la solicitud
    if (!req.file) {
      return res.status(400).json({
        title: "No file provided",
        statusCode: 400,
        message: "No se ha proporcionado ningún archivo para la prueba"
      });
    }
    
    // Verificar si el archivo existe físicamente
    if (!fs.existsSync(req.file.path)) {
      return res.status(500).json({
        title: "File not found",
        statusCode: 500,
        message: "El archivo se recibió pero no se encuentra en la ruta esperada",
        fileInfo: req.file
      });
    }
    
    // Información sobre el directorio de uploads
    const uploadsDir = path.resolve(__dirname, '../uploads');
    const dirExists = fs.existsSync(uploadsDir);
    
    let dirContents = [];
    if (dirExists) {
      try {
        dirContents = fs.readdirSync(uploadsDir);
      } catch (e) {
        // Error al leer directorio
      }
    }
    
    // Intentar subir el archivo al FTP
    const certificationData = { certification_name: 'test_upload' };
    const result = await uploadToFtp(req.file.path, certificationData);
    
    if (!result.success) {
      return res.status(500).json({
        title: "FTP upload failed",
        statusCode: 500,
        message: "Error al subir archivo al FTP",
        ftpError: result,
        systemInfo: {
          uploadsDir,
          dirExists,
          dirContents,
          fileInfo: req.file,
          env: {
            FTP_HOST: process.env.FTP_HOST,
            FTP_USER: process.env.FTP_USER, 
            FTP_PORT: process.env.FTP_PORT,
            FTP_IMAGES_DIR: process.env.FTP_IMAGES_DIR,
            FTP_PUBLIC_URL: process.env.FTP_PUBLIC_URL
          }
        }
      });
    }
    
    return res.json({
      title: "File upload test successful",
      statusCode: 200,
      message: "Prueba de carga de archivos completada con éxito",
      result,
      systemInfo: {
        uploadsDir,
        dirExists,
        dirContents,
        fileInfo: req.file
      }
    });
  } catch (error) {
    return res.status(500).json({
      title: "File upload test error",
      statusCode: 500,
      message: "Error en la prueba de carga de archivos",
      error: error.message,
      stack: error.stack
    });
  }
};

module.exports = {
  getAllCertifications,
  getCertificationById,
  getCertificationsByCompanyId,
  createCertification,
  updateCertification,
  deleteCertification,
  getClientsByCertificationId,
  getVideosByCertificationId,
  addClientToCertification,
  removeClientFromCertification,
  testFtpConnection,
  testFileUpload
}; 
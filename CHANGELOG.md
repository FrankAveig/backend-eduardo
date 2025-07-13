# Changelog - Actualización de Base de Datos y API

## Versión 2.0.0 - Control de Acceso por Estado Activo/Inactivo

### 🗄️ Cambios en la Base de Datos

#### Nuevos Campos Agregados:
- **Tabla `empresas`**: Campo `activa` (TINYINT(1)) - Controla si la empresa está activa
- **Tabla `certificaciones`**: Campo `activa` (TINYINT(1)) - Controla si la certificación está activa
- **Tabla `clientes_certificaciones`**: 
  - Campo `fecha_asignacion` (DATETIME) - Fecha cuando se asignó la certificación al cliente
  - Campo `activa` (TINYINT(1)) - Controla si la relación cliente-certificación está activa

#### Cambios en Tipos de Datos:
- **Tabla `videos`**: Campo `duracion` cambiado de VARCHAR(20) a INT - Duración en segundos

### 🔧 Nuevas Funcionalidades

#### 1. Control de Estado de Certificaciones
- **Activar/Desactivar Certificaciones**: Los administradores pueden activar o desactivar certificaciones
- **Acceso Controlado**: Los clientes solo pueden acceder a videos de certificaciones activas
- **Historial Visible**: Los clientes pueden ver todas sus certificaciones (activas e inactivas) en su historial

#### 2. Control de Relaciones Cliente-Certificación
- **Activación Individual**: Se puede activar/desactivar el acceso de un cliente específico a una certificación
- **Fecha de Asignación**: Se registra automáticamente cuándo se asignó la certificación al cliente
- **Estado Independiente**: El estado de la relación es independiente del estado de la certificación

#### 3. Control de Estado de Empresas
- **Activar/Desactivar Empresas**: Los administradores pueden activar o desactivar empresas
- **Filtros por Estado**: Se pueden filtrar empresas por su estado activo/inactivo

### 🚀 Nuevos Endpoints

#### Certificaciones:
```
PATCH /certificaciones/:id/toggle-active
- Activa/desactiva una certificación
- Requiere: Administrador

PATCH /certificaciones/:id/clientes/:clienteId/toggle-active
- Activa/desactiva la relación cliente-certificación
- Requiere: Administrador
```

#### Clientes:
```
GET /clientes/mis-certificaciones
- Obtiene solo certificaciones activas del cliente
- Requiere: Cliente autenticado

GET /clientes/mi-historial-certificaciones
- Obtiene todas las certificaciones del cliente (activas e inactivas)
- Requiere: Cliente autenticado
```

#### Empresas:
```
PATCH /empresas/:id/toggle-active
- Activa/desactiva una empresa
- Requiere: Administrador
```

#### Videos:
```
GET /videos/certificacion-activa/:certificacionId
- Obtiene videos de certificaciones activas (solo para clientes)
- Verifica que el cliente tenga acceso activo a la certificación
- Requiere: Cliente autenticado
```

### 🔒 Lógica de Control de Acceso

#### Para Clientes:
1. **Certificaciones Activas**: Solo pueden ver certificaciones donde:
   - La certificación esté activa (`certificaciones.activa = 1`)
   - La relación cliente-certificación esté activa (`clientes_certificaciones.activa = 1`)

2. **Acceso a Videos**: Solo pueden acceder a videos de certificaciones activas donde:
   - La certificación esté activa
   - El cliente tenga acceso activo a la certificación

3. **Historial**: Pueden ver todas sus certificaciones (activas e inactivas) para mantener un historial completo

#### Para Administradores:
- Pueden activar/desactivar certificaciones globalmente
- Pueden activar/desactivar el acceso individual de clientes a certificaciones
- Pueden activar/desactivar empresas
- Tienen acceso completo a todos los recursos

### 📊 Respuestas de API Actualizadas

#### Certificaciones:
```json
{
  "id": 1,
  "nombre_certificacion": "ISO 9001",
  "empresa_id": 1,
  "activa": true,
  "fecha_asignacion": "2024-01-15T10:30:00Z",
  "relacion_activa": true
}
```

#### Relaciones Cliente-Certificación:
```json
{
  "certificacionId": 1,
  "clienteId": 2,
  "activa": true,
  "fecha_asignacion": "2024-01-15T10:30:00Z"
}
```

### 🛠️ Scripts de Migración

#### Para Actualizar Base de Datos Existente:
1. Ejecutar `database_migration.sql` para agregar los nuevos campos
2. Los datos existentes se marcarán como activos por defecto
3. La duración de videos se convertirá automáticamente a formato entero

### 🔄 Compatibilidad

#### Cambios Compatibles:
- Los endpoints existentes siguen funcionando
- Los datos existentes se migran automáticamente
- Las respuestas incluyen los nuevos campos sin romper la compatibilidad

#### Nuevas Funcionalidades:
- Los nuevos endpoints proporcionan control granular sobre el acceso
- La lógica de control de acceso es transparente para el frontend
- Se mantiene la seguridad y auditoría de cambios

### 📝 Notas de Implementación

1. **Migración Automática**: Los datos existentes se marcan como activos por defecto
2. **Control Granular**: Se puede controlar el acceso a nivel de certificación y cliente individual
3. **Auditoría**: Se registra la fecha de asignación de certificaciones
4. **Seguridad**: Se verifica el estado activo en cada acceso a recursos
5. **Flexibilidad**: Se pueden activar/desactivar elementos sin eliminarlos

### 🎯 Beneficios

1. **Control de Acceso**: Los administradores pueden controlar qué certificaciones están disponibles
2. **Gestión Individual**: Se puede desactivar el acceso de un cliente específico sin afectar a otros
3. **Historial Completo**: Los clientes mantienen un historial de todas sus certificaciones
4. **Seguridad Mejorada**: Solo se permite acceso a recursos activos
5. **Flexibilidad**: Se pueden reactivar certificaciones y relaciones sin pérdida de datos 
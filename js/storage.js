

if (typeof almacenamiento === 'undefined') {
    console.error('❌ El sistema de almacenamiento no está cargado');
    // Cargar storage.js dinámicamente si es necesario
    const script = document.createElement('script');
    script.src = 'js/storage.js';
    script.onload = () => {
        console.log('✅ Sistema de almacenamiento cargado correctamente');
        window.gestorAlumnos = new GestorAlumnos();
    };
    document.head.appendChild(script);
} else {
    console.log('✅ Sistema de almacenamiento listo');
    window.gestorAlumnos = new GestorAlumnos();
}
// storage.js - Sistema Centralizado de Almacenamiento
class SistemaAlmacenamiento {
    constructor() {
        this.version = '1.0.0';
        this.estructura = {
            alumnos: [],
            anotaciones: [],
            aulas: [
                { id: '1', nombre: 'Aula 1', capacidad: 10, estado: 'disponible', color: '#3498db' },
                { id: '2', nombre: 'Aula 2', capacidad: 8, estado: 'disponible', color: '#e74c3c' },
                { id: '3', nombre: 'Aula 3', capacidad: 12, estado: 'disponible', color: '#2ecc71' }
            ],
            configuracion: {
                escuela: {
                    nombre: 'Music School Pro',
                    telefono: '',
                    email: '',
                    direccion: '',
                    horario: '16:00 - 20:00'
                },
                instrumentos: [
                    { id: 'bateria', nombre: 'Batería', color: '#e74c3c', emoji: '🥁' },
                    { id: 'canto', nombre: 'Canto', color: '#9b59b6', emoji: '🎤' },
                    { id: 'guitarra', nombre: 'Guitarra', color: '#f39c12', emoji: '🎸' },
                    { id: 'bajo', nombre: 'Bajo', color: '#1abc9c', emoji: '🎸' }
                ],
                diasSemana: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
                horasClase: ['16:00', '17:00', '18:00', '19:00']
            },
            usuarios: [
                { id: 'admin', nombre: 'Administrador', email: 'admin@music-school.com', rol: 'admin', activo: true }
            ],
            backup: {
                ultimoBackup: null,
                frecuencia: 'diaria'
            }
        };
        this.init();
    }

    init() {
        this.inicializarEstructura();
        this.configurarAutoBackup();
        this.mostrarEstadisticasStorage();
    }

    // ========== OPERACIONES CRUD PARA ALUMNOS ==========
    obtenerAlumnos(filtros = {}) {
        let alumnos = this.leer('alumnos');
        
        // Aplicar filtros
        if (filtros.estado) {
            alumnos = alumnos.filter(alumno => alumno.estado === filtros.estado);
        }
        if (filtros.instrumento) {
            alumnos = alumnos.filter(alumno => alumno.horario?.instrumento === filtros.instrumento);
        }
        if (filtros.texto) {
            const texto = filtros.texto.toLowerCase();
            alumnos = alumnos.filter(alumno => 
                alumno.nombre.toLowerCase().includes(texto) ||
                alumno.apellido.toLowerCase().includes(texto) ||
                alumno.telefono?.toLowerCase().includes(texto) ||
                alumno.correo?.toLowerCase().includes(texto)
            );
        }
        
        return alumnos;
    }

    guardarAlumno(alumnoData) {
        const alumnos = this.leer('alumnos');
        const existe = alumnoData.id && alumnos.find(a => a.id === alumnoData.id);
        
        if (existe) {
            // Actualizar alumno existente
            const index = alumnos.findIndex(a => a.id === alumnoData.id);
            alumnos[index] = {
                ...alumnos[index],
                ...alumnoData,
                fechaActualizacion: new Date().toISOString()
            };
        } else {
            // Crear nuevo alumno
            const nuevoAlumno = {
                id: 'alumno_' + Date.now(),
                ...alumnoData,
                fechaRegistro: new Date().toISOString(),
                fechaActualizacion: new Date().toISOString()
            };
            alumnos.push(nuevoAlumno);
        }
        
        this.guardar('alumnos', alumnos);
        this.actualizarEstadisticas();
        return true;
    }

    eliminarAlumno(id) {
        const alumnos = this.leer('alumnos');
        const alumnosFiltrados = alumnos.filter(alumno => alumno.id !== id);
        this.guardar('alumnos', alumnosFiltrados);
        this.actualizarEstadisticas();
        return true;
    }

    obtenerAlumnoPorId(id) {
        const alumnos = this.leer('alumnos');
        return alumnos.find(alumno => alumno.id === id);
    }

    obtenerAlumnosPorHorario(dia, hora, aula) {
        const alumnos = this.leer('alumnos');
        return alumnos.filter(alumno => 
            alumno.estado === 'activo' && 
            alumno.horario && 
            alumno.horario.dia === dia && 
            alumno.horario.hora === hora && 
            alumno.horario.aula === aula
        );
    }

    // ========== OPERACIONES CRUD PARA ANOTACIONES ==========
    obtenerAnotaciones(filtros = {}) {
        let anotaciones = this.leer('anotaciones');
        
        if (filtros.fecha) {
            anotaciones = anotaciones.filter(anotacion => anotacion.fecha === filtros.fecha);
        }
        if (filtros.alumnoId) {
            anotaciones = anotaciones.filter(anotacion => anotacion.alumnoId === filtros.alumnoId);
        }
        if (filtros.tipo) {
            anotaciones = anotaciones.filter(anotacion => anotacion.tipo === filtros.tipo);
        }
        if (filtros.fechaInicio && filtros.fechaFin) {
            anotaciones = anotaciones.filter(anotacion => 
                anotacion.fecha >= filtros.fechaInicio && anotacion.fecha <= filtros.fechaFin
            );
        }
        
        return anotaciones.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
    }

    guardarAnotacion(anotacionData) {
        const anotaciones = this.leer('anotaciones');
        const nuevaAnotacion = {
            id: 'anotacion_' + Date.now(),
            ...anotacionData,
            fechaCreacion: new Date().toISOString(),
            usuario: 'Administrador'
        };
        
        anotaciones.unshift(nuevaAnotacion);
        this.guardar('anotaciones', anotaciones);
        return nuevaAnotacion;
    }

    eliminarAnotacion(id) {
        const anotaciones = this.leer('anotaciones');
        const anotacionesFiltradas = anotaciones.filter(anotacion => anotacion.id !== id);
        this.guardar('anotaciones', anotacionesFiltradas);
        return true;
    }

    // ========== OPERACIONES PARA AULAS ==========
    obtenerAulas() {
        return this.leer('aulas');
    }

    obtenerAula(id) {
        const aulas = this.leer('aulas');
        return aulas.find(aula => aula.id === id);
    }

    actualizarAula(aulaId, datosActualizados) {
        const aulas = this.leer('aulas');
        const index = aulas.findIndex(aula => aula.id === aulaId);
        
        if (index !== -1) {
            aulas[index] = { ...aulas[index], ...datosActualizados };
            this.guardar('aulas', aulas);
            return true;
        }
        return false;
    }

    // ========== OPERACIONES DE CONFIGURACIÓN ==========
    obtenerConfiguracion() {
        return this.leer('configuracion');
    }

    actualizarConfiguracion(nuevaConfig) {
        const configActual = this.leer('configuracion');
        const configActualizada = { ...configActual, ...nuevaConfig };
        this.guardar('configuracion', configActualizada);
        return true;
    }

    // ========== OPERACIONES DE RESPALDO ==========
    crearRespaldo() {
        const respaldo = {
            fecha: new Date().toISOString(),
            version: this.version,
            datos: {
                alumnos: this.leer('alumnos'),
                anotaciones: this.leer('anotaciones'),
                aulas: this.leer('aulas'),
                configuracion: this.leer('configuracion')
            }
        };
        
        localStorage.setItem('music_school_backup', JSON.stringify(respaldo));
        this.actualizarUltimoBackup();
        return respaldo;
    }

    restaurarRespaldo(datosRespaldo) {
        if (datosRespaldo.datos.alumnos) this.guardar('alumnos', datosRespaldo.datos.alumnos);
        if (datosRespaldo.datos.anotaciones) this.guardar('anotaciones', datosRespaldo.datos.anotaciones);
        if (datosRespaldo.datos.aulas) this.guardar('aulas', datosRespaldo.datos.aulas);
        if (datosRespaldo.datos.configuracion) this.guardar('configuracion', datosRespaldo.datos.configuracion);
        
        return true;
    }

    exportarDatos(formato = 'json') {
        const datos = {
            exportado: new Date().toISOString(),
            version: this.version,
            alumnos: this.leer('alumnos'),
            anotaciones: this.leer('anotaciones'),
            aulas: this.leer('aulas'),
            configuracion: this.leer('configuracion')
        };

        if (formato === 'json') {
            return JSON.stringify(datos, null, 2);
        } else if (formato === 'csv') {
            return this.convertirACSV(datos);
        }
    }

    importarDatos(datos, tipo = 'json') {
        try {
            let datosParseados;
            
            if (tipo === 'json') {
                datosParseados = JSON.parse(datos);
            } else if (tipo === 'csv') {
                datosParseados = this.convertirDesdeCSV(datos);
            }

            // Validar estructura básica
            if (!datosParseados.alumnos || !datosParseados.anotaciones) {
                throw new Error('Formato de datos inválido');
            }

            this.guardar('alumnos', datosParseados.alumnos);
            this.guardar('anotaciones', datosParseados.anotaciones);
            if (datosParseados.aulas) this.guardar('aulas', datosParseados.aulas);
            if (datosParseados.configuracion) this.guardar('configuracion', datosParseados.configuracion);

            return true;
        } catch (error) {
            console.error('Error importando datos:', error);
            return false;
        }
    }

    // ========== OPERACIONES DE LIMPIEZA Y MANTENIMIENTO ==========
    limpiarDatosAntiguos(dias = 30) {
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - dias);

        const anotaciones = this.leer('anotaciones');
        const anotacionesFiltradas = anotaciones.filter(anotacion => 
            new Date(anotacion.fechaCreacion) > fechaLimite
        );

        this.guardar('anotaciones', anotacionesFiltradas);
        return anotaciones.length - anotacionesFiltradas.length;
    }

    calcularEstadisticas() {
        const alumnos = this.leer('alumnos');
        const anotaciones = this.leer('anotaciones');
        const aulas = this.leer('aulas');

        return {
            totalAlumnos: alumnos.length,
            alumnosActivos: alumnos.filter(a => a.estado === 'activo').length,
            totalAnotaciones: anotaciones.length,
            anotacionesHoy: anotaciones.filter(a => a.fecha === new Date().toISOString().split('T')[0]).length,
            aulasDisponibles: aulas.filter(a => a.estado === 'disponible').length,
            usoAlmacenamiento: this.calcularUsoAlmacenamiento()
        };
    }

    // ========== MÉTODOS PRIVADOS ==========
    inicializarEstructura() {
        Object.keys(this.estructura).forEach(key => {
            if (!localStorage.getItem(`music_school_${key}`)) {
                this.guardar(key, this.estructura[key]);
            }
        });
    }

    leer(clave) {
        const datos = localStorage.getItem(`music_school_${clave}`);
        return datos ? JSON.parse(datos) : this.estructura[clave] || [];
    }

    guardar(clave, datos) {
        try {
            localStorage.setItem(`music_school_${clave}`, JSON.stringify(datos));
            return true;
        } catch (error) {
            console.error('Error guardando datos:', error);
            return false;
        }
    }

    configurarAutoBackup() {
        // Realizar backup automático cada 24 horas
        setInterval(() => {
            this.crearRespaldo();
        }, 24 * 60 * 60 * 1000);
    }

    actualizarUltimoBackup() {
        const backupInfo = {
            ultimoBackup: new Date().toISOString(),
            version: this.version
        };
        localStorage.setItem('music_school_backup_info', JSON.stringify(backupInfo));
    }

    calcularUsoAlmacenamiento() {
        let totalBytes = 0;
        for (let key in localStorage) {
            if (key.startsWith('music_school_')) {
                totalBytes += localStorage[key].length * 2;
            }
        }
        return (totalBytes / 1024 / 1024).toFixed(2);
    }

    mostrarEstadisticasStorage() {
        const stats = this.calcularEstadisticas();
        console.log('📊 Estadísticas del Sistema:', stats);
    }

    actualizarEstadisticas() {
        window.dispatchEvent(new CustomEvent('datosActualizados', {
            detail: this.calcularEstadisticas()
        }));
    }

    // ========== MÉTODOS DE CONVERSIÓN CSV ==========
    convertirACSV(datos) {
        let csv = 'Tipo,Datos\n';
        
        // Alumnos
        csv += 'ALUMNOS\n';
        csv += 'Nombre,Apellido,Telefono,Email,Instrumento,Dia,Hora,Aula,Estado\n';
        datos.alumnos.forEach(alumno => {
            csv += `"${alumno.nombre}","${alumno.apellido}","${alumno.telefono || ''}","${alumno.correo || ''}",` +
                   `"${alumno.horario?.instrumento || ''}","${alumno.horario?.dia || ''}","${alumno.horario?.hora || ''}",` +
                   `"${alumno.horario?.aula || ''}","${alumno.estado}"\n`;
        });
        
        // Anotaciones
        csv += '\nANOTACIONES\n';
        csv += 'Fecha,Hora,Alumno,Tipo,Contenido\n';
        datos.anotaciones.forEach(anotacion => {
            csv += `"${anotacion.fecha}","${anotacion.hora}","${anotacion.alumnoNombre}","${anotacion.tipo}","${anotacion.contenido.replace(/"/g, '""')}"\n`;
        });
        
        return csv;
    }

    convertirDesdeCSV(csv) {
        const lineas = csv.split('\n');
        const datos = { alumnos: [], anotaciones: [] };
        let seccionActual = '';
        
        lineas.forEach(linea => {
            if (linea === 'ALUMNOS') seccionActual = 'alumnos';
            else if (linea === 'ANOTACIONES') seccionActual = 'anotaciones';
            else if (linea && !linea.startsWith('Tipo') && !linea.startsWith('Nombre')) {
                const campos = linea.split(',').map(campo => campo.replace(/^"|"$/g, ''));
                
                if (seccionActual === 'alumnos' && campos.length >= 9) {
                    datos.alumnos.push({
                        id: 'alumno_' + Date.now() + Math.random(),
                        nombre: campos[0],
                        apellido: campos[1],
                        telefono: campos[2],
                        correo: campos[3],
                        horario: {
                            instrumento: campos[4],
                            dia: campos[5],
                            hora: campos[6],
                            aula: campos[7]
                        },
                        estado: campos[8],
                        color: this.generarColorAleatorio(),
                        fechaRegistro: new Date().toISOString(),
                        fechaActualizacion: new Date().toISOString()
                    });
                } else if (seccionActual === 'anotaciones' && campos.length >= 5) {
                    datos.anotaciones.push({
                        id: 'anotacion_' + Date.now() + Math.random(),
                        fecha: campos[0],
                        hora: campos[1],
                        alumnoNombre: campos[2],
                        tipo: campos[3],
                        contenido: campos[4],
                        fechaCreacion: new Date().toISOString(),
                        usuario: 'Administrador'
                    });
                }
            }
        });
        
        return datos;
    }

    generarColorAleatorio() {
        const colores = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
        return colores[Math.floor(Math.random() * colores.length)];
    }
}

// Inicializar sistema de almacenamiento
const almacenamiento = new SistemaAlmacenamiento();
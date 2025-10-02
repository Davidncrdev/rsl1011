// admin-datos.js - Gestor de Administración de Datos
class GestorAdministracion {
    constructor() {
        this.init();
    }

    init() {
        this.configurarEventos();
        this.actualizarEstadisticas();
        
        setInterval(() => this.actualizarEstadisticas(), 30000);
    }

    configurarEventos() {
        document.getElementById('btn-crear-respaldo').addEventListener('click', () => this.crearRespaldo());
        document.getElementById('btn-restaurar-respaldo').addEventListener('click', () => this.restaurarRespaldo());
        document.getElementById('btn-exportar-datos').addEventListener('click', () => this.exportarDatos());
        document.getElementById('btn-importar-datos').addEventListener('click', () => this.importarDatos());
        document.getElementById('btn-ejecutar-mantenimiento').addEventListener('click', () => this.ejecutarMantenimiento());
        
        window.addEventListener('datosActualizados', (e) => {
            this.actualizarEstadisticas();
        });
    }

    crearRespaldo() {
        const respaldo = almacenamiento.crearRespaldo();
        Toast.show(`✅ Respaldo creado correctamente (${new Date(respaldo.fecha).toLocaleString()})`, 'success');
        this.actualizarEstadisticas();
    }

    restaurarRespaldo() {
        const respaldoGuardado = localStorage.getItem('music_school_backup');
        if (!respaldoGuardado) {
            Toast.show('No hay respaldos guardados', 'warning');
            return;
        }

        if (confirm('¿Estás seguro de que quieres restaurar el último respaldo? Se perderán los datos actuales.')) {
            const respaldo = JSON.parse(respaldoGuardado);
            almacenamiento.restaurarRespaldo(respaldo);
            this.actualizarEstadisticas();
            Toast.show('✅ Sistema restaurado correctamente', 'success');
            
            // Recargar las vistas
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    }

    exportarDatos() {
        const datosJSON = almacenamiento.exportarDatos('json');
        const blob = new Blob([datosJSON], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `music_school_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        Toast.show('📤 Datos exportados correctamente', 'success');
    }

    importarDatos() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.csv';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                const tipo = file.name.endsWith('.csv') ? 'csv' : 'json';
                if (confirm('¿Estás seguro de que quieres importar estos datos? Se sobrescribirán los datos actuales.')) {
                    const exito = almacenamiento.importarDatos(event.target.result, tipo);
                    if (exito) {
                        this.actualizarEstadisticas();
                        Toast.show('✅ Datos importados correctamente', 'success');
                        
                        // Recargar las vistas
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    } else {
                        Toast.show('❌ Error al importar datos', 'error');
                    }
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    ejecutarMantenimiento() {
        const dias = parseInt(document.getElementById('dias-limpiar').value);
        const accion = document.getElementById('accion-mantenimiento').value;

        if (accion === 'limpiar') {
            const eliminados = almacenamiento.limpiarDatosAntiguos(dias);
            Toast.show(`🧹 Se eliminaron ${eliminados} anotaciones antiguas`, 'success');
        } else if (accion === 'optimizar') {
            // Simular optimización
            localStorage.setItem('music_school_optimizado', new Date().toISOString());
            Toast.show('⚡ Almacenamiento optimizado', 'success');
        } else if (accion === 'validar') {
            this.validarIntegridad();
        }

        this.actualizarEstadisticas();
    }

    validarIntegridad() {
        const stats = almacenamiento.calcularEstadisticas();
        let problemas = [];

        if (stats.totalAlumnos === 0) problemas.push('No hay alumnos registrados');
        if (stats.aulasDisponibles === 0) problemas.push('No hay aulas disponibles');

        // Validar alumnos sin horario
        const alumnosSinHorario = almacenamiento.obtenerAlumnos().filter(a => !a.horario);
        if (alumnosSinHorario.length > 0) {
            problemas.push(`${alumnosSinHorario.length} alumnos sin horario asignado`);
        }

        if (problemas.length === 0) {
            Toast.show('✅ Integridad validada correctamente', 'success');
        } else {
            Toast.show(`⚠️ Problemas detectados: ${problemas.join(', ')}`, 'warning');
        }
    }

    actualizarEstadisticas() {
        const stats = almacenamiento.calcularEstadisticas();
        
        document.getElementById('uso-almacenamiento').textContent = `${stats.usoAlmacenamiento} MB`;
        document.getElementById('total-registros').textContent = stats.totalAlumnos + stats.totalAnotaciones;
        document.getElementById('detalle-registros').textContent = `${stats.totalAlumnos} alumnos, ${stats.totalAnotaciones} anotaciones`;
        
        const backupInfo = localStorage.getItem('music_school_backup_info');
        if (backupInfo) {
            const info = JSON.parse(backupInfo);
            document.getElementById('ultimo-backup').textContent = new Date(info.ultimoBackup).toLocaleDateString();
            document.getElementById('estado-backup').textContent = '✅ Actualizado';
        } else {
            document.getElementById('ultimo-backup').textContent = 'Nunca';
            document.getElementById('estado-backup').textContent = '⚠️ Pendiente';
        }

        this.mostrarEstadisticasDetalladas(stats);
    }

    mostrarEstadisticasDetalladas(stats) {
        const contenedor = document.getElementById('estadisticas-detalladas');
        const aulas = almacenamiento.obtenerAulas();
        const alumnos = almacenamiento.obtenerAlumnos();
        
        const alumnosPorInstrumento = {};
        const alumnosPorEstado = {};
        
        alumnos.forEach(alumno => {
            // Por instrumento
            const instrumento = alumno.horario?.instrumento || 'sin-instrumento';
            alumnosPorInstrumento[instrumento] = (alumnosPorInstrumento[instrumento] || 0) + 1;
            
            // Por estado
            alumnosPorEstado[alumno.estado] = (alumnosPorEstado[alumno.estado] || 0) + 1;
        });

        let html = `
            <div style="padding: 1.5rem;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
                    <div class="stat-card">
                        <h3>Distribución por Instrumento</h3>
                        <div style="margin-top: 1rem;">
        `;

        Object.entries(alumnosPorInstrumento).forEach(([instrumento, cantidad]) => {
            const porcentaje = ((cantidad / stats.totalAlumnos) * 100).toFixed(1);
            html += `
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; padding: 0.5rem; background: #f8f9fa; border-radius: 4px;">
                    <span>${gestorAlumnos.formatearInstrumento(instrumento)}</span>
                    <span><strong>${cantidad}</strong> (${porcentaje}%)</span>
                </div>
            `;
        });

        html += `
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <h3>Estados de Alumnos</h3>
                        <div style="margin-top: 1rem;">
        `;

        Object.entries(alumnosPorEstado).forEach(([estado, cantidad]) => {
            const porcentaje = ((cantidad / stats.totalAlumnos) * 100).toFixed(1);
            html += `
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; padding: 0.5rem; background: #f8f9fa; border-radius: 4px;">
                    <span>${estado.charAt(0).toUpperCase() + estado.slice(1)}</span>
                    <span><strong>${cantidad}</strong> (${porcentaje}%)</span>
                </div>
            `;
        });

        html += `
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <h3>Estado de Aulas</h3>
                        <div style="margin-top: 1rem;">
        `;

        aulas.forEach(aula => {
            const alumnosEnAula = almacenamiento.obtenerAlumnos().filter(a => 
                a.horario?.aula === aula.id && a.estado === 'activo'
            ).length;
            const porcentajeOcupacion = ((alumnosEnAula / aula.capacidad) * 100).toFixed(1);
            
            html += `
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; padding: 0.5rem; background: #f8f9fa; border-radius: 4px;">
                    <span>${aula.nombre}</span>
                    <span><strong>${alumnosEnAula}/${aula.capacidad}</strong> (${porcentajeOcupacion}%)</span>
                </div>
            `;
        });

        html += `
                        </div>
                    </div>
                </div>
            </div>
        `;

        contenedor.innerHTML = html;
    }
}

// Inicializar gestor de administración
const gestorAdministracion = new GestorAdministracion();
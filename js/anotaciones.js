// anotaciones.js - Gestor de Anotaciones Actualizado
class GestorAnotaciones {
    constructor() {
        this.init();
    }

    init() {
        this.cargarFormulario();
        this.cargarListaAnotaciones();
        this.configurarEventos();
    }

    configurarEventos() {
        document.getElementById('form-anotacion').addEventListener('submit', (e) => this.guardarAnotacion(e));
        document.getElementById('filtro-fecha').addEventListener('change', () => this.cargarListaAnotaciones());
        document.getElementById('filtro-alumno-anotacion').addEventListener('change', () => this.cargarListaAnotaciones());
        document.getElementById('filtro-tipo-anotacion').addEventListener('change', () => this.cargarListaAnotaciones());
        
        // Establecer fecha actual por defecto
        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('fecha-anotacion').value = hoy;
        document.getElementById('hora-anotacion').value = new Date().toTimeString().substring(0, 5);
    }

    guardarAnotacion(e) {
        e.preventDefault();
        
        const fecha = document.getElementById('fecha-anotacion').value;
        const hora = document.getElementById('hora-anotacion').value;
        const alumnoId = document.getElementById('alumno-anotacion').value;
        const tipo = document.getElementById('tipo-anotacion').value;
        const contenido = document.getElementById('contenido-anotacion').value;
        
        const alumno = almacenamiento.obtenerAlumnoPorId(alumnoId);
        
        if (!alumno) {
            Toast.show('Selecciona un alumno válido', 'warning');
            return;
        }
        
        const anotacionData = {
            fecha,
            hora,
            alumnoId,
            alumnoNombre: `${alumno.nombre} ${alumno.apellido}`,
            alumnoColor: alumno.color,
            tipo,
            contenido
        };
        
        const anotacionGuardada = almacenamiento.guardarAnotacion(anotacionData);
        
        if (anotacionGuardada) {
            this.cargarListaAnotaciones();
            document.getElementById('contenido-anotacion').value = '';
            
            // Restablecer fecha y hora actual
            const hoy = new Date().toISOString().split('T')[0];
            document.getElementById('fecha-anotacion').value = hoy;
            document.getElementById('hora-anotacion').value = new Date().toTimeString().substring(0, 5);
            
            Toast.show('✅ Anotación guardada correctamente', 'success');
        }
    }

    eliminarAnotacion(id) {
        if (confirm('¿Estás seguro de que quieres eliminar esta anotación?')) {
            const exito = almacenamiento.eliminarAnotacion(id);
            if (exito) {
                this.cargarListaAnotaciones();
                Toast.show('Anotación eliminada correctamente', 'success');
            }
        }
    }

    cargarListaAnotaciones() {
        const contenedor = document.getElementById('lista-anotaciones-container');
        const filtroFecha = document.getElementById('filtro-fecha').value;
        const filtroAlumno = document.getElementById('filtro-alumno-anotacion').value;
        const filtroTipo = document.getElementById('filtro-tipo-anotacion').value;
        
        const anotaciones = almacenamiento.obtenerAnotaciones({
            fecha: filtroFecha,
            alumnoId: filtroAlumno,
            tipo: filtroTipo
        });
        
        if (anotaciones.length === 0) {
            contenedor.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <h3>No se encontraron anotaciones</h3>
                    <p>Comienza agregando tu primera anotación</p>
                </div>
            `;
            return;
        }
        
        let html = '<div style="padding: 1rem;">';
        
        anotaciones.forEach(anotacion => {
            const alumno = almacenamiento.obtenerAlumnoPorId(anotacion.alumnoId);
            
            html += `
                <div class="anotacion-item" style="border-left: 4px solid ${anotacion.alumnoColor}">
                    <div class="anotacion-header">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 12px; height: 12px; background-color: ${anotacion.alumnoColor}; border-radius: 50%;"></div>
                            <strong>${anotacion.alumnoNombre}</strong>
                            <span style="color: #666;">- ${this.formatearFecha(anotacion.fecha)} a las ${anotacion.hora}</span>
                        </div>
                        <span class="anotacion-tipo tipo-${anotacion.tipo}">
                            ${this.formatearTipo(anotacion.tipo)}
                        </span>
                    </div>
                    <div class="anotacion-contenido" style="margin: 1rem 0; line-height: 1.6; white-space: pre-line;">
                        ${anotacion.contenido}
                    </div>
                    <div class="anotacion-acciones" style="display: flex; justify-content: space-between; align-items: center; font-size: 0.875rem; color: #666;">
                        <div>
                            Por: ${anotacion.usuario} • 
                            Creado: ${this.formatearFechaHora(anotacion.fechaCreacion)}
                        </div>
                        <button class="btn btn-danger btn-sm" onclick="gestorAnotaciones.eliminarAnotacion('${anotacion.id}')">
                            🗑️ Eliminar
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        contenedor.innerHTML = html;
    }

    formatearFecha(fecha) {
        const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', opciones);
    }

    formatearFechaHora(fechaHora) {
        const fecha = new Date(fechaHora);
        return fecha.toLocaleDateString('es-ES') + ' ' + fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }

    formatearTipo(tipo) {
        const tipos = {
            'general': 'General',
            'academica': 'Académica',
            'conducta': 'Conducta',
            'asistencia': 'Asistencia',
            'pago': 'Pago'
        };
        return tipos[tipo] || tipo;
    }

    cargarFormulario() {
        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('fecha-anotacion').value = hoy;
        document.getElementById('hora-anotacion').value = new Date().toTimeString().substring(0, 5);
    }

    obtenerAnotaciones() {
        return almacenamiento.obtenerAnotaciones();
    }
}

// Inicializar gestor de anotaciones
const gestorAnotaciones = new GestorAnotaciones();
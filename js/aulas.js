// aulas.js - Gestor de Aulas Actualizado
class GestorAulas {
    constructor() {
        this.aulas = almacenamiento.obtenerAulas();
        this.init();
    }

    init() {
        this.actualizarEstadoAulas();
        this.configurarEventos();
    }

    configurarEventos() {
        document.getElementById('btn-guardar-aula').addEventListener('click', () => this.guardarConfiguracionAula());
        document.getElementById('config-aula').addEventListener('change', () => this.cargarDatosAula());
        
        this.cargarDatosAula();
    }

    cargarDatosAula() {
        const aulaId = document.getElementById('config-aula').value;
        const aula = almacenamiento.obtenerAula(aulaId);
        
        if (aula) {
            document.getElementById('capacidad-aula').value = aula.capacidad;
            document.getElementById('estado-aula').value = aula.estado;
        }
    }

    guardarConfiguracionAula() {
        const aulaId = document.getElementById('config-aula').value;
        const capacidad = parseInt(document.getElementById('capacidad-aula').value);
        const estado = document.getElementById('estado-aula').value;
        
        const exito = almacenamiento.actualizarAula(aulaId, {
            capacidad: capacidad,
            estado: estado
        });
        
        if (exito) {
            const aula = almacenamiento.obtenerAula(aulaId);
            this.actualizarEstadoAulas();
            Toast.show(`✅ Configuración del ${aula.nombre} guardada correctamente`, 'success');
        }
    }

    actualizarEstadoAulas() {
        const alumnos = almacenamiento.obtenerAlumnos();
        const hoy = new Date().toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
        
        this.aulas.forEach(aula => {
            const alumnosEnAula = alumnos.filter(alumno => 
                alumno.estado === 'activo' && 
                alumno.horario && 
                alumno.horario.dia === hoy && 
                alumno.horario.aula === aula.id
            ).length;
            
            const elementoEstado = document.getElementById(`estado-aula-${aula.id}`);
            const elementoCapacidad = document.getElementById(`capacidad-aula-${aula.id}`);
            
            if (elementoEstado && elementoCapacidad) {
                elementoEstado.textContent = aula.estado === 'disponible' ? 'Disponible' : 
                                           aula.estado === 'mantenimiento' ? 'En Mantenimiento' : 'Ocupada';
                elementoCapacidad.textContent = `${alumnosEnAula}/${aula.capacidad}`;
                
                // Actualizar tendencias
                const tendencia = document.getElementById(`trend-aula-${aula.id}`);
                if (tendencia) {
                    const porcentaje = (alumnosEnAula / aula.capacidad) * 100;
                    if (porcentaje >= 80) {
                        tendencia.textContent = '⚠️ Alta ocupación';
                        tendencia.className = 'stat-trend trend-warning';
                    } else if (porcentaje >= 50) {
                        tendencia.textContent = '📊 Ocupación media';
                        tendencia.className = 'stat-trend trend-info';
                    } else {
                        tendencia.textContent = '✅ Buena capacidad';
                        tendencia.className = 'stat-trend trend-success';
                    }
                }
            }
        });
    }

    obtenerAula(aulaId) {
        return almacenamiento.obtenerAula(aulaId);
    }

    obtenerAulas() {
        return almacenamiento.obtenerAulas();
    }

    estaAulaDisponible(aulaId, dia, hora) {
        const aula = this.obtenerAula(aulaId);
        if (!aula || aula.estado !== 'disponible') return false;
        
        const alumnosEnAula = almacenamiento.obtenerAlumnosPorHorario(dia, hora, aulaId).length;
        return alumnosEnAula < aula.capacidad;
    }
}

// Inicializar gestor de aulas
const gestorAulas = new GestorAulas();
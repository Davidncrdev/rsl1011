class GestorAulas {
    constructor() {
        this.aulas = JSON.parse(localStorage.getItem('aulas')) || this.inicializarAulas();
        this.init();
    }

    inicializarAulas() {
        return [
            { id: '1', nombre: 'Aula 1', capacidad: 10, estado: 'disponible', color: '#3498db' },
            { id: '2', nombre: 'Aula 2', capacidad: 8, estado: 'disponible', color: '#e74c3c' },
            { id: '3', nombre: 'Aula 3', capacidad: 12, estado: 'disponible', color: '#2ecc71' }
        ];
    }

    init() {
        this.actualizarEstadoAulas();
        this.configurarEventos();
    }

    configurarEventos() {
        document.getElementById('btn-guardar-aula').addEventListener('click', () => this.guardarConfiguracionAula());
        document.getElementById('config-aula').addEventListener('change', () => this.cargarDatosAula());
        
        // Cargar datos del aula por defecto
        this.cargarDatosAula();
    }

    cargarDatosAula() {
        const aulaId = document.getElementById('config-aula').value;
        const aula = this.aulas.find(a => a.id === aulaId);
        
        if (aula) {
            document.getElementById('capacidad-aula').value = aula.capacidad;
            document.getElementById('estado-aula').value = aula.estado;
        }
    }

    guardarConfiguracionAula() {
        const aulaId = document.getElementById('config-aula').value;
        const capacidad = parseInt(document.getElementById('capacidad-aula').value);
        const estado = document.getElementById('estado-aula').value;
        
        const aulaIndex = this.aulas.findIndex(a => a.id === aulaId);
        if (aulaIndex !== -1) {
            this.aulas[aulaIndex].capacidad = capacidad;
            this.aulas[aulaIndex].estado = estado;
            
            this.guardarEnLocalStorage();
            this.actualizarEstadoAulas();
            
            alert(`✅ Configuración del ${this.aulas[aulaIndex].nombre} guardada correctamente`);
        }
    }

    actualizarEstadoAulas() {
        // Calcular ocupación actual de las aulas
        const alumnos = gestorAlumnos.obtenerAlumnos();
        const hoy = new Date().toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
        const horaActual = new Date().getHours() + ':00';
        
        this.aulas.forEach(aula => {
            // Contar alumnos en esta aula para hoy
            const alumnosEnAula = alumnos.filter(alumno => 
                alumno.estado === 'activo' && 
                alumno.horario && 
                alumno.horario.dia === hoy && 
                alumno.horario.aula === aula.id
            ).length;
            
            // Actualizar elementos del DOM
            const elementoEstado = document.getElementById(`estado-aula-${aula.id}`);
            const elementoCapacidad = document.getElementById(`capacidad-aula-${aula.id}`);
            
            if (elementoEstado && elementoCapacidad) {
                elementoEstado.textContent = aula.estado === 'disponible' ? 'Disponible' : 
                                           aula.estado === 'mantenimiento' ? 'En Mantenimiento' : 'Ocupada';
                elementoCapacidad.textContent = `${alumnosEnAula}/${aula.capacidad}`;
            }
        });
    }

    obtenerAula(aulaId) {
        return this.aulas.find(aula => aula.id === aulaId);
    }

    obtenerAulas() {
        return this.aulas;
    }

    estaAulaDisponible(aulaId, dia, hora) {
        const aula = this.obtenerAula(aulaId);
        if (!aula || aula.estado !== 'disponible') return false;
        
        // Verificar capacidad
        const alumnosEnAula = gestorAlumnos.obtenerAlumnosPorHorario(dia, hora, aulaId).length;
        return alumnosEnAula < aula.capacidad;
    }

    guardarEnLocalStorage() {
        localStorage.setItem('aulas', JSON.stringify(this.aulas));
    }
}

// Inicializar gestor de aulas
const gestorAulas = new GestorAulas();
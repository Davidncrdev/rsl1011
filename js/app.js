class App {
    constructor() {
        this.gestorAlumnos = new GestorAlumnos();
        this.gestorAnotaciones = new GestorAnotaciones();
        this.gestorHorario = new GestorHorario();
        this.gestorAulas = new GestorAulas();
        this.gestorReportes = new GestorReportes();
        
        this.init();
    }

    init() {
        this.configurarNavegacion();
        this.inicializarDashboard();
        this.configurarEventosGlobales();
        
        console.log('🎵 Music School Pro - Sistema inicializado');
    }

    configurarNavegacion() {
        const navLinks = document.querySelectorAll('.nav-link');
        const pageTitle = document.getElementById('page-title');
        
        const titulos = {
            'dashboard': 'Dashboard',
            'alumnos': 'Gestión de Alumnos',
            'horario': 'Horario Escolar',
            'anotaciones': 'Anotaciones y Seguimiento',
            'aulas': 'Gestión de Aulas',
            'reportes': 'Reportes y Analytics'
        };

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remover clase active de todos los links
                navLinks.forEach(l => l.classList.remove('active'));
                
                // Agregar clase active al link clickeado
                link.classList.add('active');
                
                // Ocultar todos los contenidos
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                // Mostrar el contenido correspondiente
                const tabId = link.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
                
                // Actualizar título de página
                pageTitle.textContent = titulos[tabId] || 'Music School Pro';
                
                // Ejecutar acciones específicas por pestaña
                this.ejecutarAccionesTab(tabId);
            });
        });
    }

    ejecutarAccionesTab(tabId) {
        switch(tabId) {
            case 'dashboard':
                this.actualizarDashboard();
                break;
            case 'horario':
                this.gestorHorario.cargarHorario();
                break;
            case 'alumnos':
                this.gestorAlumnos.cargarTabla();
                break;
            case 'anotaciones':
                this.gestorAnotaciones.cargarListaAnotaciones();
                break;
            case 'aulas':
                this.gestorAulas.actualizarEstadoAulas();
                break;
        }
    }

    inicializarDashboard() {
        this.actualizarDashboard();
        // Actualizar dashboard cada 30 segundos
        setInterval(() => this.actualizarDashboard(), 30000);
    }

    actualizarDashboard() {
        const alumnos = this.gestorAlumnos.obtenerAlumnos();
        const anotaciones = this.gestorAnotaciones.obtenerAnotaciones();
        const hoy = new Date().toISOString().split('T')[0];
        
        // Estadísticas
        document.getElementById('total-alumnos').textContent = alumnos.filter(a => a.estado === 'activo').length;
        document.getElementById('clases-hoy').textContent = this.contarClasesHoy();
        document.getElementById('aulas-ocupadas').textContent = this.contarAulasOcupadas();
        document.getElementById('nuevas-anotaciones').textContent = 
            anotaciones.filter(a => a.fecha === hoy).length;
        
        // Horario de hoy
        this.mostrarHorarioHoy();
    }

    contarClasesHoy() {
        const hoy = new Date().toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
        const alumnos = this.gestorAlumnos.obtenerAlumnos();
        return alumnos.filter(alumno => 
            alumno.estado === 'activo' && 
            alumno.horario && 
            alumno.horario.dia === hoy
        ).length;
    }

    contarAulasOcupadas() {
        const aulas = this.gestorAulas.obtenerAulas();
        return aulas.filter(aula => aula.estado === 'ocupada').length;
    }

    mostrarHorarioHoy() {
        const hoy = new Date().toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
        const contenedor = document.getElementById('horario-hoy');
        
        if (hoy === 'sábado' || hoy === 'domingo') {
            contenedor.innerHTML = '<p>🎉 No hay clases hoy - Fin de semana</p>';
            return;
        }
        
        const horarioHoy = this.gestorHorario.generarHorarioDia(hoy);
        contenedor.innerHTML = horarioHoy;
    }

    configurarEventosGlobales() {
        // Botón "Hoy" en horario
        document.getElementById('btn-hoy').addEventListener('click', () => {
            const hoy = new Date().toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
            if (hoy !== 'sábado' && hoy !== 'domingo') {
                document.getElementById('filtro-dia-horario').value = hoy;
                this.gestorHorario.cargarHorario();
            }
        });
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
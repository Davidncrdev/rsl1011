class GestorHorario {
    constructor() {
        this.horas = ['16:00', '17:00', '18:00', '19:00'];
        this.dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
        this.aulas = ['1', '2', '3'];
        this.init();
    }

    init() {
        this.cargarHorario();
        this.configurarEventos();
    }

    configurarEventos() {
        document.getElementById('filtro-dia-horario').addEventListener('change', () => this.cargarHorario());
        
        // Establecer día actual por defecto
        const hoy = new Date().toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
        if (this.dias.includes(hoy)) {
            document.getElementById('filtro-dia-horario').value = hoy;
        }
    }

    cargarHorario() {
        const diaSeleccionado = document.getElementById('filtro-dia-horario').value;
        const grid = document.getElementById('horario-grid');
        const diaActual = document.getElementById('dia-actual');
        
        // Actualizar título del día
        diaActual.textContent = this.formatearDiaCompleto(diaSeleccionado);
        
        let html = `
            <div class="horario-cell horario-time"></div>
            <div class="horario-cell horario-aula aula-1">Aula 1</div>
            <div class="horario-cell horario-aula aula-2">Aula 2</div>
            <div class="horario-cell horario-aula aula-3">Aula 3</div>
        `;
        
        this.horas.forEach(hora => {
            html += `<div class="horario-cell horario-time">${hora}</div>`;
            
            this.aulas.forEach(aula => {
                const alumnos = gestorAlumnos.obtenerAlumnosPorHorario(diaSeleccionado, hora, aula);
                html += `<div class="horario-cell" data-hora="${hora}" data-aula="${aula}">`;
                
                if (alumnos.length > 0) {
                    alumnos.forEach(alumno => {
                        const instrumento = alumno.horario.instrumento;
                        html += `
                            <div class="clase-item instrumento-${instrumento}" 
                                 style="background-color: ${alumno.color}"
                                 title="${alumno.nombre} ${alumno.apellido} - ${this.formatearInstrumento(instrumento)}">
                                <strong>${alumno.nombre}</strong><br>
                                <small>${this.formatearInstrumento(instrumento)}</small>
                            </div>
                        `;
                    });
                } else {
                    html += `<div style="color: #999; font-size: 0.875rem; text-align: center; padding: 1rem;">Disponible</div>`;
                }
                
                html += `</div>`;
            });
        });
        
        grid.innerHTML = html;
        
        // Agregar eventos a las celdas para crear clases rápidamente
        this.agregarEventosCeldas();
    }

    agregarEventosCeldas() {
        document.querySelectorAll('.horario-cell[data-hora]').forEach(celda => {
            celda.addEventListener('click', (e) => {
                if (e.target.classList.contains('clase-item')) return;
                
                const hora = celda.getAttribute('data-hora');
                const aula = celda.getAttribute('data-aula');
                const dia = document.getElementById('filtro-dia-horario').value;
                
                // Redirigir a gestión de alumnos con los datos prellenados
                document.querySelector('[data-tab="alumnos"]').click();
                
                document.getElementById('dia-clase').value = dia;
                document.getElementById('hora-clase').value = hora;
                document.getElementById('aula-clase').value = aula;
                
                // Scroll al formulario
                document.getElementById('form-alumno').scrollIntoView({ behavior: 'smooth' });
            });
        });
    }

    generarHorarioDia(dia) {
        let html = `<div style="display: grid; grid-template-columns: 80px repeat(3, 1fr); gap: 8px; margin-top: 1rem;">`;
        
        // Header
        html += `<div style="font-weight: bold; padding: 8px;"></div>`;
        html += `<div style="font-weight: bold; padding: 8px; background: var(--aula-1); color: white; text-align: center;">Aula 1</div>`;
        html += `<div style="font-weight: bold; padding: 8px; background: var(--aula-2); color: white; text-align: center;">Aula 2</div>`;
        html += `<div style="font-weight: bold; padding: 8px; background: var(--aula-3); color: white; text-align: center;">Aula 3</div>`;
        
        this.horas.forEach(hora => {
            html += `<div style="font-weight: bold; padding: 8px; background: #f8f9fa; text-align: center;">${hora}</div>`;
            
            this.aulas.forEach(aula => {
                const alumnos = gestorAlumnos.obtenerAlumnosPorHorario(dia, hora, aula);
                html += `<div style="padding: 8px; background: white; border: 1px solid #e9ecef; min-height: 60px; border-radius: 4px;">`;
                
                if (alumnos.length > 0) {
                    alumnos.forEach(alumno => {
                        html += `
                            <div style="background: ${alumno.color}; color: white; padding: 4px; margin-bottom: 2px; border-radius: 2px; font-size: 0.75rem;">
                                ${alumno.nombre} - ${this.formatearInstrumento(alumno.horario.instrumento)}
                            </div>
                        `;
                    });
                } else {
                    html += `<div style="color: #999; font-size: 0.75rem; text-align: center;">Libre</div>`;
                }
                
                html += `</div>`;
            });
        });
        
        html += `</div>`;
        return html;
    }

    formatearDiaCompleto(dia) {
        const dias = {
            'lunes': 'Lunes',
            'martes': 'Martes',
            'miercoles': 'Miércoles',
            'jueves': 'Jueves',
            'viernes': 'Viernes'
        };
        return dias[dia] || dia;
    }

    formatearInstrumento(instrumento) {
        const instrumentos = {
            'bateria': 'Batería',
            'canto': 'Canto',
            'guitarra': 'Guitarra',
            'bajo': 'Bajo'
        };
        return instrumentos[instrumento] || instrumento;
    }
}

// Inicializar gestor de horario
const gestorHorario = new GestorHorario();
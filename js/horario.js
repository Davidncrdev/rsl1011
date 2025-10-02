class GestorHorario {
    constructor() {
        this.horas = ['16:00', '17:00', '18:00', '19:00'];
        this.dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
        this.aulas = ['1', '2', '3'];
        this.modoVista = 'diario'; // 'diario' o 'semanal'
        this.init();
    }

    init() {
        this.cargarHorario();
        this.configurarEventos();
        this.actualizarEstadisticas();
    }

    configurarEventos() {
        document.getElementById('filtro-dia-horario').addEventListener('change', () => this.cargarHorario());
        document.getElementById('btn-hoy').addEventListener('click', () => this.mostrarHoy());
        document.getElementById('btn-vista-semanal').addEventListener('click', () => this.cambiarVista('semanal'));
        document.getElementById('btn-vista-diaria').addEventListener('click', () => this.cambiarVista('diario'));
        document.getElementById('btn-imprimir-horario').addEventListener('click', () => this.imprimirHorario());
        
        // Establecer día actual por defecto
        this.mostrarHoy();
    }

    cambiarVista(modo) {
        this.modoVista = modo;
        document.getElementById('btn-vista-diaria').classList.toggle('active', modo === 'diario');
        document.getElementById('btn-vista-semanal').classList.toggle('active', modo === 'semanal');
        this.cargarHorario();
    }

    mostrarHoy() {
        const hoy = new Date().toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
        if (this.dias.includes(hoy)) {
            document.getElementById('filtro-dia-horario').value = hoy;
            this.cargarHorario();
            Toast.show('Mostrando horario de hoy', 'info');
        } else {
            Toast.show('No hay clases los fines de semana', 'warning');
        }
    }

    cargarHorario() {
        if (this.modoVista === 'diario') {
            this.cargarHorarioDiario();
        } else {
            this.cargarHorarioSemanal();
        }
        this.actualizarEstadisticas();
    }

    cargarHorarioDiario() {
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
            html += `<div class="horario-cell horario-time">${hora}<br><small>a ${this.obtenerHoraSiguiente(hora)}</small></div>`;
            
            this.aulas.forEach(aula => {
                const alumnos = this.obtenerAlumnosPorHorario(diaSeleccionado, hora, aula);
                const capacidadAula = this.obtenerCapacidadAula(aula);
                const porcentajeOcupacion = capacidadAula > 0 ? Math.round((alumnos.length / capacidadAula) * 100) : 0;
                
                html += `<div class="horario-cell" data-hora="${hora}" data-aula="${aula}" data-dia="${diaSeleccionado}">`;
                
                if (alumnos.length > 0) {
                    alumnos.forEach(alumno => {
                        const instrumento = alumno.horario.instrumento;
                        html += `
                            <div class="clase-item instrumento-${instrumento}" 
                                 style="background-color: ${alumno.color}"
                                 title="${alumno.nombre} ${alumno.apellido} - ${this.formatearInstrumento(instrumento)} - ${alumno.telefono || 'Sin teléfono'}">
                                <div class="clase-header">
                                    <strong>${alumno.nombre.split(' ')[0]}</strong>
                                    <span class="clase-instrumento">${this.formatearInstrumento(instrumento).substring(0, 3)}</span>
                                </div>
                                <div class="clase-info">
                                    <small>${alumno.apellido.split(' ')[0]}</small>
                                </div>
                            </div>
                        `;
                    });
                } else {
                    html += `
                        <div class="celda-vacia" title="Hacer clic para agregar clase">
                            <div class="disponible-text">Disponible</div>
                            <div class="capacidad-info">Capacidad: ${capacidadAula}</div>
                        </div>
                    `;
                }
                
                // Mostrar información de ocupación
                if (alumnos.length > 0) {
                    html += `<div class="ocupacion-info">${alumnos.length}/${capacidadAula} (${porcentajeOcupacion}%)</div>`;
                }
                
                html += `</div>`;
            });
        });
        
        grid.innerHTML = html;
        this.agregarEventosCeldas();
    }

    cargarHorarioSemanal() {
        const grid = document.getElementById('horario-grid');
        const diaActual = document.getElementById('dia-actual');
        
        // Actualizar título
        diaActual.textContent = 'Semana Completa';
        
        let html = `
            <div class="horario-cell horario-time"></div>
        `;
        
        // Encabezados de días
        this.dias.forEach(dia => {
            html += `<div class="horario-cell horario-dia">${this.formatearDiaCompleto(dia)}</div>`;
        });
        
        // Filas de horas
        this.horas.forEach(hora => {
            html += `<div class="horario-cell horario-time">${hora}<br><small>a ${this.obtenerHoraSiguiente(hora)}</small></div>`;
            
            this.dias.forEach(dia => {
                const clasesDiaHora = this.obtenerClasesPorDiaHora(dia, hora);
                html += `<div class="horario-cell horario-semanal" data-hora="${hora}" data-dia="${dia}">`;
                
                if (clasesDiaHora.length > 0) {
                    // Agrupar por aula
                    const clasesPorAula = {};
                    clasesDiaHora.forEach(clase => {
                        if (!clasesPorAula[clase.aula]) {
                            clasesPorAula[clase.aula] = [];
                        }
                        clasesPorAula[clase.aula].push(clase);
                    });
                    
                    Object.entries(clasesPorAula).forEach(([aula, clases]) => {
                        html += `
                            <div class="clase-resumen aula-${aula}">
                                <div class="clase-aula">Aula ${aula}</div>
                                <div class="clase-cantidad">${clases.length} alumno${clases.length !== 1 ? 's' : ''}</div>
                                <div class="clase-instrumentos">
                                    ${this.obtenerInstrumentosUnicos(clases).map(inst => 
                                        `<span class="instrumento-badge">${this.formatearInstrumento(inst).substring(0, 3)}</span>`
                                    ).join('')}
                                </div>
                            </div>
                        `;
                    });
                } else {
                    html += `<div class="celda-vacia-semanal">Sin clases</div>`;
                }
                
                html += `</div>`;
            });
        });
        
        grid.innerHTML = html;
        this.agregarEventosCeldasSemanal();
    }

    obtenerClasesPorDiaHora(dia, hora) {
        const alumnos = gestorAlumnos.obtenerAlumnos();
        return alumnos.filter(alumno => 
            alumno.estado === 'activo' && 
            alumno.horario && 
            alumno.horario.dia === dia && 
            alumno.horario.hora === hora
        ).map(alumno => ({
            ...alumno,
            aula: alumno.horario.aula,
            instrumento: alumno.horario.instrumento
        }));
    }

    obtenerInstrumentosUnicos(clases) {
        const instrumentos = new Set();
        clases.forEach(clase => instrumentos.add(clase.instrumento));
        return Array.from(instrumentos);
    }

    obtenerAlumnosPorHorario(dia, hora, aula) {
        const alumnos = gestorAlumnos.obtenerAlumnos();
        return alumnos.filter(alumno => 
            alumno.estado === 'activo' && 
            alumno.horario && 
            alumno.horario.dia === dia && 
            alumno.horario.hora === hora && 
            alumno.horario.aula === aula
        );
    }

    obtenerCapacidadAula(aulaId) {
        const aula = gestorAulas.obtenerAula(aulaId);
        return aula ? aula.capacidad : 10; // Valor por defecto
    }

    obtenerHoraSiguiente(hora) {
        const [horas, minutos] = hora.split(':').map(Number);
        const siguienteHora = (horas + 1) % 24;
        return `${siguienteHora.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
    }

    agregarEventosCeldas() {
        document.querySelectorAll('.horario-cell[data-hora]').forEach(celda => {
            celda.addEventListener('click', (e) => {
                if (e.target.classList.contains('clase-item')) {
                    // Click en una clase existente - mostrar detalles
                    this.mostrarDetallesClase(e.target);
                    return;
                }
                
                // Click en celda vacía - crear nueva clase
                const hora = celda.getAttribute('data-hora');
                const aula = celda.getAttribute('data-aula');
                const dia = celda.getAttribute('data-dia');
                
                this.crearNuevaClase(dia, hora, aula);
            });
        });
    }

    agregarEventosCeldasSemanal() {
        document.querySelectorAll('.horario-semanal').forEach(celda => {
            celda.addEventListener('click', (e) => {
                const hora = celda.getAttribute('data-hora');
                const dia = celda.getAttribute('data-dia');
                
                // Cambiar a vista diaria y mostrar ese día/hora
                this.cambiarVista('diario');
                document.getElementById('filtro-dia-horario').value = dia;
                this.cargarHorario();
                
                // Resaltar la hora específica
                setTimeout(() => {
                    const celdasHora = document.querySelectorAll(`.horario-cell[data-hora="${hora}"]`);
                    celdasHora.forEach(celdaHora => {
                        celdaHora.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
                        setTimeout(() => {
                            celdaHora.style.backgroundColor = '';
                        }, 2000);
                    });
                }, 100);
            });
        });
    }

    crearNuevaClase(dia, hora, aula) {
        // Redirigir a gestión de alumnos con los datos prellenados
        document.querySelector('[data-tab="alumnos"]').click();
        
        document.getElementById('dia-clase').value = dia;
        document.getElementById('hora-clase').value = hora;
        document.getElementById('aula-clase').value = aula;
        
        // Scroll al formulario
        document.getElementById('form-alumno').scrollIntoView({ behavior: 'smooth' });
        
        Toast.show(`Formulario preparado para ${this.formatearDiaCompleto(dia)} ${hora} - Aula ${aula}`, 'info');
    }

    mostrarDetallesClase(elementoClase) {
        // Encontrar la información del alumno
        const titulo = elementoClase.getAttribute('title');
        const alumnoNombre = elementoClase.querySelector('strong').textContent;
        
        // Buscar alumno en los datos
        const alumnos = gestorAlumnos.obtenerAlumnos();
        const alumno = alumnos.find(a => 
            a.nombre.includes(alumnoNombre) || 
            a.apellido.includes(alumnoNombre)
        );
        
        if (alumno) {
            const detalles = `
                <strong>${alumno.nombre} ${alumno.apellido}</strong><br>
                Instrumento: ${this.formatearInstrumento(alumno.horario.instrumento)}<br>
                ${alumno.telefono ? `Teléfono: ${alumno.telefono}<br>` : ''}
                ${alumno.correo ? `Email: ${alumno.correo}` : ''}
            `;
            
            Toast.show(detalles, 'info', 5000);
        }
    }

    actualizarEstadisticas() {
        const totalClases = this.calcularTotalClases();
        const aulasDisponibles = this.calcularAulasDisponibles();
        const ocupacionPromedio = this.calcularOcupacionPromedio();
        
        document.getElementById('total-clases-dia').textContent = `${totalClases} clases`;
        document.getElementById('aulas-disponibles').textContent = `${aulasDisponibles} aulas disponibles`;
        
        // Actualizar estadísticas adicionales si existen
        const estadisticasExtra = document.getElementById('estadisticas-extra');
        if (estadisticasExtra) {
            estadisticasExtra.innerHTML = `
                <span class="badge badge-info">${ocupacionPromedio}% ocupación</span>
                <span class="badge badge-warning">${this.calcularAlumnosTotales()} alumnos</span>
            `;
        }
    }

    calcularTotalClases() {
        if (this.modoVista === 'diario') {
            const dia = document.getElementById('filtro-dia-horario').value;
            return this.horas.reduce((total, hora) => {
                return total + this.aulas.reduce((aulaTotal, aula) => {
                    return aulaTotal + this.obtenerAlumnosPorHorario(dia, hora, aula).length;
                }, 0);
            }, 0);
        } else {
            // Vista semanal - total de la semana
            return this.dias.reduce((diaTotal, dia) => {
                return diaTotal + this.horas.reduce((horaTotal, hora) => {
                    return horaTotal + this.aulas.reduce((aulaTotal, aula) => {
                        return aulaTotal + this.obtenerAlumnosPorHorario(dia, hora, aula).length;
                    }, 0);
                }, 0);
            }, 0);
        }
    }

    calcularAulasDisponibles() {
        const aulas = gestorAulas.obtenerAulas();
        return aulas.filter(aula => aula.estado === 'disponible').length;
    }

    calcularOcupacionPromedio() {
        const totalClases = this.calcularTotalClases();
        const totalCapacidad = this.aulas.reduce((total, aula) => {
            return total + this.obtenerCapacidadAula(aula);
        }, 0) * this.horas.length * (this.modoVista === 'diario' ? 1 : this.dias.length);
        
        return totalCapacidad > 0 ? Math.round((totalClases / totalCapacidad) * 100) : 0;
    }

    calcularAlumnosTotales() {
        const alumnos = gestorAlumnos.obtenerAlumnos();
        return alumnos.filter(alumno => alumno.estado === 'activo').length;
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
                const alumnos = this.obtenerAlumnosPorHorario(dia, hora, aula);
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

    imprimirHorario() {
        const dia = this.modoVista === 'diario' ? document.getElementById('filtro-dia-horario').value : 'semanal';
        const titulo = this.modoVista === 'diario' ? 
            `Horario - ${this.formatearDiaCompleto(dia)}` : 
            'Horario Semanal Completo';
        
        // Crear ventana de impresión
        const ventanaImpresion = window.open('', '_blank');
        ventanaImpresion.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${titulo} - Music School Pro</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .horario-impresion { width: 100%; border-collapse: collapse; }
                    .horario-impresion th, .horario-impresion td { 
                        border: 1px solid #ddd; padding: 8px; text-align: center; 
                    }
                    .horario-impresion th { background: #f5f5f5; }
                    .clase-impresion { margin: 2px 0; padding: 4px; border-radius: 3px; color: white; font-size: 12px; }
                    .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${titulo}</h1>
                    <p>Music School Pro - Generado ${new Date().toLocaleDateString()}</p>
                </div>
                ${this.generarHTMLImpresion()}
                <div class="footer">
                    <p>Sistema Music School Pro - ${new Date().getFullYear()}</p>
                </div>
            </body>
            </html>
        `);
        ventanaImpresion.document.close();
        ventanaImpresion.print();
    }

    generarHTMLImpresion() {
        if (this.modoVista === 'diario') {
            return this.generarHorarioDiarioImpresion();
        } else {
            return this.generarHorarioSemanalImpresion();
        }
    }

    generarHorarioDiarioImpresion() {
        const dia = document.getElementById('filtro-dia-horario').value;
        let html = `<table class="horario-impresion"><tr><th>Hora</th>`;
        
        this.aulas.forEach(aula => {
            html += `<th>Aula ${aula}</th>`;
        });
        html += `</tr>`;
        
        this.horas.forEach(hora => {
            html += `<tr><td><strong>${hora}</strong></td>`;
            this.aulas.forEach(aula => {
                const alumnos = this.obtenerAlumnosPorHorario(dia, hora, aula);
                html += `<td>`;
                if (alumnos.length > 0) {
                    alumnos.forEach(alumno => {
                        html += `<div class="clase-impresion" style="background: ${alumno.color}">
                            ${alumno.nombre} - ${this.formatearInstrumento(alumno.horario.instrumento)}
                        </div>`;
                    });
                } else {
                    html += `<div style="color: #999;">Libre</div>`;
                }
                html += `</td>`;
            });
            html += `</tr>`;
        });
        
        html += `</table>`;
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
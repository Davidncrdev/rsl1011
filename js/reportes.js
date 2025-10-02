class GestorReportes {
    constructor() {
        this.init();
    }

    init() {
        this.configurarEventos();
    }

    configurarEventos() {
        document.getElementById('btn-generar-reporte').addEventListener('click', () => this.generarReporte());
        document.getElementById('btn-exportar').addEventListener('click', () => this.exportarPDF());
        
        // Establecer fechas por defecto (última semana)
        const hoy = new Date();
        const haceUnaSemana = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        document.getElementById('fecha-inicio').value = haceUnaSemana.toISOString().split('T')[0];
        document.getElementById('fecha-fin').value = hoy.toISOString().split('T')[0];
    }

    generarReporte() {
        const tipoReporte = document.getElementById('tipo-reporte').value;
        const fechaInicio = document.getElementById('fecha-inicio').value;
        const fechaFin = document.getElementById('fecha-fin').value;
        
        if (!fechaInicio || !fechaFin) {
            alert('Por favor selecciona un rango de fechas');
            return;
        }
        
        let contenido = '';
        let titulo = '';
        
        switch(tipoReporte) {
            case 'asistencia':
                contenido = this.generarReporteAsistencia(fechaInicio, fechaFin);
                titulo = 'Reporte de Asistencia';
                break;
            case 'horarios':
                contenido = this.generarReporteHorarios();
                titulo = 'Ocupación de Horarios';
                break;
            case 'instrumentos':
                contenido = this.generarReporteInstrumentos();
                titulo = 'Distribución por Instrumento';
                break;
            case 'aulas':
                contenido = this.generarReporteAulas();
                titulo = 'Uso de Aulas';
                break;
        }
        
        document.getElementById('titulo-reporte').textContent = titulo;
        document.getElementById('contenido-reporte').innerHTML = contenido;
        document.getElementById('contenedor-reporte').style.display = 'block';
    }

    generarReporteAsistencia(fechaInicio, fechaFin) {
        const anotaciones = gestorAnotaciones.obtenerAnotaciones();
        const alumnos = gestorAlumnos.obtenerAlumnos();
        
        const anotacionesFiltradas = anotaciones.filter(anotacion => {
            return anotacion.fecha >= fechaInicio && anotacion.fecha <= fechaFin;
        });
        
        let html = `
            <div style="padding: 2rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 2rem;">
                    <div>
                        <h4>Período: ${this.formatearFecha(fechaInicio)} - ${this.formatearFecha(fechaFin)}</h4>
                        <p>Total de anotaciones: <strong>${anotacionesFiltradas.length}</strong></p>
                    </div>
                    <div style="text-align: right;">
                        <p>Generado: ${new Date().toLocaleDateString('es-ES')}</p>
                    </div>
                </div>
        `;
        
        // Resumen por tipo
        const resumenTipos = {};
        anotacionesFiltradas.forEach(anotacion => {
            resumenTipos[anotacion.tipo] = (resumenTipos[anotacion.tipo] || 0) + 1;
        });
        
        html += `<h4>Resumen por Tipo:</h4>`;
        html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">`;
        
        Object.entries(resumenTipos).forEach(([tipo, cantidad]) => {
            html += `
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 6px; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary-color);">${cantidad}</div>
                    <div>${this.formatearTipo(tipo)}</div>
                </div>
            `;
        });
        
        html += `</div>`;
        
        // Detalle por alumno
        html += `<h4>Detalle por Alumno:</h4>`;
        html += `<table style="width: 100%; border-collapse: collapse;">`;
        html += `<thead><tr><th style="border: 1px solid #ddd; padding: 0.75rem;">Alumno</th><th style="border: 1px solid #ddd; padding: 0.75rem;">Total Anotaciones</th><th style="border: 1px solid #ddd; padding: 0.75rem;">Última Anotación</th></tr></thead><tbody>`;
        
        alumnos.forEach(alumno => {
            const anotacionesAlumno = anotacionesFiltradas.filter(a => a.alumnoId === alumno.id);
            const ultimaAnotacion = anotacionesAlumno.length > 0 ? 
                anotacionesAlumno[0].fecha : 'Sin anotaciones';
                
            html += `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 0.75rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="width: 12px; height: 12px; background: ${alumno.color}; border-radius: 50%;"></div>
                            ${alumno.nombre} ${alumno.apellido}
                        </div>
                    </td>
                    <td style="border: 1px solid #ddd; padding: 0.75rem; text-align: center;">${anotacionesAlumno.length}</td>
                    <td style="border: 1px solid #ddd; padding: 0.75rem;">${this.formatearFecha(ultimaAnotacion)}</td>
                </tr>
            `;
        });
        
        html += `</tbody></table></div>`;
        return html;
    }

    generarReporteHorarios() {
        const alumnos = gestorAlumnos.obtenerAlumnos().filter(a => a.estado === 'activo');
        const horarios = {};
        
        alumnos.forEach(alumno => {
            if (alumno.horario) {
                const clave = `${alumno.horario.dia}-${alumno.horario.hora}-${alumno.horario.aula}`;
                horarios[clave] = (horarios[clave] || 0) + 1;
            }
        });
        
        let html = `<div style="padding: 2rem;">`;
        html += `<h4>Ocupación de Horarios por Día</h4>`;
        
        const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
        const horas = ['16:00', '17:00', '18:00', '19:00'];
        
        dias.forEach(dia => {
            html += `<h5 style="margin-top: 1.5rem; color: var(--secondary-color);">${this.formatearDiaCompleto(dia)}</h5>`;
            html += `<table style="width: 100%; border-collapse: collapse; margin-bottom: 1rem;">`;
            html += `<thead><tr><th style="border: 1px solid #ddd; padding: 0.5rem;">Hora</th><th style="border: 1px solid #ddd; padding: 0.5rem;">Aula 1</th><th style="border: 1px solid #ddd; padding: 0.5rem;">Aula 2</th><th style="border: 1px solid #ddd; padding: 0.5rem;">Aula 3</th></tr></thead><tbody>`;
            
            horas.forEach(hora => {
                html += `<tr>`;
                html += `<td style="border: 1px solid #ddd; padding: 0.5rem; font-weight: bold;">${hora}</td>`;
                
                ['1', '2', '3'].forEach(aula => {
                    const clave = `${dia}-${hora}-${aula}`;
                    const cantidad = horarios[clave] || 0;
                    const aulaObj = gestorAulas.obtenerAula(aula);
                    const porcentaje = aulaObj ? Math.round((cantidad / aulaObj.capacidad) * 100) : 0;
                    
                    let color = '#2ecc71'; // Verde
                    if (porcentaje >= 90) color = '#e74c3c'; // Rojo
                    else if (porcentaje >= 70) color = '#f39c12'; // Naranja
                    
                    html += `
                        <td style="border: 1px solid #ddd; padding: 0.5rem; text-align: center; background: ${cantidad > 0 ? '#f8f9fa' : 'white'}">
                            ${cantidad > 0 ? 
                                `<div style="color: ${color}; font-weight: bold;">${cantidad}</div>
                                 <div style="font-size: 0.75rem; color: #666;">${porcentaje}% ocupado</div>` : 
                                'Libre'
                            }
                        </td>
                    `;
                });
                
                html += `</tr>`;
            });
            
            html += `</tbody></table>`;
        });
        
        html += `</div>`;
        return html;
    }

    generarReporteInstrumentos() {
        const alumnos = gestorAlumnos.obtenerAlumnos().filter(a => a.estado === 'activo');
        const instrumentos = {
            'bateria': 0,
            'canto': 0,
            'guitarra': 0,
            'bajo': 0
        };
        
        alumnos.forEach(alumno => {
            if (alumno.horario && alumno.horario.instrumento) {
                instrumentos[alumno.horario.instrumento]++;
            }
        });
        
        let html = `<div style="padding: 2rem;">`;
        html += `<h4>Distribución de Alumnos por Instrumento</h4>`;
        
        const totalAlumnos = Object.values(instrumentos).reduce((a, b) => a + b, 0);
        
        html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin: 2rem 0;">`;
        
        Object.entries(instrumentos).forEach(([instrumento, cantidad]) => {
            const porcentaje = totalAlumnos > 0 ? Math.round((cantidad / totalAlumnos) * 100) : 0;
            
            html += `
                <div style="background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 1.5rem; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">${this.getEmojiInstrumento(instrumento)}</div>
                    <h3 style="margin: 0.5rem 0; color: var(--secondary-color);">${this.formatearInstrumento(instrumento)}</h3>
                    <div style="font-size: 2rem; font-weight: bold; color: var(--primary-color);">${cantidad}</div>
                    <div style="color: #666; margin-top: 0.5rem;">${porcentaje}% del total</div>
                </div>
            `;
        });
        
        html += `</div>`;
        
        // Gráfico de distribución por día e instrumento
        html += `<h4>Distribución por Día e Instrumento</h4>`;
        html += `<table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">`;
        html += `<thead><tr><th style="border: 1px solid #ddd; padding: 0.75rem;">Día</th><th style="border: 1px solid #ddd; padding: 0.75rem;">Batería</th><th style="border: 1px solid #ddd; padding: 0.75rem;">Canto</th><th style="border: 1px solid #ddd; padding: 0.75rem;">Guitarra</th><th style="border: 1px solid #ddd; padding: 0.75rem;">Bajo</th><th style="border: 1px solid #ddd; padding: 0.75rem;">Total</th></tr></thead><tbody>`;
        
        const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
        dias.forEach(dia => {
            const counts = { 'bateria': 0, 'canto': 0, 'guitarra': 0, 'bajo': 0 };
            
            alumnos.forEach(alumno => {
                if (alumno.horario && alumno.horario.dia === dia && alumno.horario.instrumento) {
                    counts[alumno.horario.instrumento]++;
                }
            });
            
            const totalDia = Object.values(counts).reduce((a, b) => a + b, 0);
            
            html += `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 0.75rem; font-weight: bold;">${this.formatearDiaCompleto(dia)}</td>
                    <td style="border: 1px solid #ddd; padding: 0.75rem; text-align: center;">${counts.bateria}</td>
                    <td style="border: 1px solid #ddd; padding: 0.75rem; text-align: center;">${counts.canto}</td>
                    <td style="border: 1px solid #ddd; padding: 0.75rem; text-align: center;">${counts.guitarra}</td>
                    <td style="border: 1px solid #ddd; padding: 0.75rem; text-align: center;">${counts.bajo}</td>
                    <td style="border: 1px solid #ddd; padding: 0.75rem; text-align: center; font-weight: bold;">${totalDia}</td>
                </tr>
            `;
        });
        
        html += `</tbody></table></div>`;
        return html;
    }

    generarReporteAulas() {
        const aulas = gestorAulas.obtenerAulas();
        const alumnos = gestorAlumnos.obtenerAlumnos().filter(a => a.estado === 'activo');
        
        let html = `<div style="padding: 2rem;">`;
        html += `<h4>Uso y Ocupación de Aulas</h4>`;
        
        html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin: 2rem 0;">`;
        
        aulas.forEach(aula => {
            const alumnosEnAula = alumnos.filter(alumno => 
                alumno.horario && alumno.horario.aula === aula.id
            ).length;
            
            const porcentajeOcupacion = Math.round((alumnosEnAula / aula.capacidad) * 100);
            
            html += `
                <div style="background: ${aula.color}; color: white; padding: 2rem; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <h3 style="margin: 0 0 1rem 0; font-size: 1.5rem;">${aula.nombre}</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                        <div>
                            <div style="font-size: 0.875rem; opacity: 0.9;">Capacidad</div>
                            <div style="font-size: 1.5rem; font-weight: bold;">${aula.capacidad}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.875rem; opacity: 0.9;">Alumnos Actuales</div>
                            <div style="font-size: 1.5rem; font-weight: bold;">${alumnosEnAula}</div>
                        </div>
                    </div>
                    <div style="background: rgba(255,255,255,0.2); border-radius: 10px; height: 20px; margin: 1rem 0;">
                        <div style="background: white; height: 100%; width: ${porcentajeOcupacion}%; border-radius: 10px; transition: width 0.3s;"></div>
                    </div>
                    <div style="text-align: center; font-size: 1.25rem; font-weight: bold;">
                        ${porcentajeOcupacion}% Ocupado
                    </div>
                    <div style="margin-top: 1rem; font-size: 0.875rem; opacity: 0.9;">
                        Estado: ${aula.estado === 'disponible' ? '✅ Disponible' : 
                                 aula.estado === 'mantenimiento' ? '🔧 En Mantenimiento' : '🚫 Ocupada'}
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
        
        // Detalle de uso por aula
        html += `<h4>Detalle de Uso por Aula y Horario</h4>`;
        html += `<table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">`;
        html += `<thead><tr><th style="border: 1px solid #ddd; padding: 0.75rem;">Aula</th><th style="border: 1px solid #ddd; padding: 0.75rem;">Lunes</th><th style="border: 1px solid #ddd; padding: 0.75rem;">Martes</th><th style="border: 1px solid #ddd; padding: 0.75rem;">Miércoles</th><th style="border: 1px solid #ddd; padding: 0.75rem;">Jueves</th><th style="border: 1px solid #ddd; padding: 0.75rem;">Viernes</th><th style="border: 1px solid #ddd; padding: 0.75rem;">Total Semanal</th></tr></thead><tbody>`;
        
        aulas.forEach(aula => {
            const counts = { 'lunes': 0, 'martes': 0, 'miercoles': 0, 'jueves': 0, 'viernes': 0 };
            
            alumnos.forEach(alumno => {
                if (alumno.horario && alumno.horario.aula === aula.id) {
                    counts[alumno.horario.dia]++;
                }
            });
            
            const totalSemanal = Object.values(counts).reduce((a, b) => a + b, 0);
            
            html += `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 0.75rem; font-weight: bold; background: ${aula.color}; color: white;">${aula.nombre}</td>
                    <td style="border: 1px solid #ddd; padding: 0.75rem; text-align: center;">${counts.lunes}</td>
                    <td style="border: 1px solid #ddd; padding: 0.75rem; text-align: center;">${counts.martes}</td>
                    <td style="border: 1px solid #ddd; padding: 0.75rem; text-align: center;">${counts.miercoles}</td>
                    <td style="border: 1px solid #ddd; padding: 0.75rem; text-align: center;">${counts.jueves}</td>
                    <td style="border: 1px solid #ddd; padding: 0.75rem; text-align: center;">${counts.viernes}</td>
                    <td style="border: 1px solid #ddd; padding: 0.75rem; text-align: center; font-weight: bold;">${totalSemanal}</td>
                </tr>
            `;
        });
        
        html += `</tbody></table></div>`;
        return html;
    }

    exportarPDF() {
        alert('📄 Función de exportación PDF - En un sistema real, aquí se implementaría la generación de PDF');
        // En una implementación real, usarías bibliotecas como jsPDF o html2pdf.js
    }

    // Métodos auxiliares
    formatearFecha(fecha) {
        return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES');
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

    getEmojiInstrumento(instrumento) {
        const emojis = {
            'bateria': '🥁',
            'canto': '🎤',
            'guitarra': '🎸',
            'bajo': '🎸'
        };
        return emojis[instrumento] || '🎵';
    }
}

// Inicializar gestor de reportes
const gestorReportes = new GestorReportes();
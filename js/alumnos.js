// alumnos.js - Gestor de Alumnos Corregido y Completamente Funcional
class GestorAlumnos {
    constructor() {
        this.init();
    }

    init() {
        this.cargarFormulario();
        this.cargarTabla();
        this.configurarEventos();
        this.actualizarSelectoresAlumnos();
    }

    configurarEventos() {
        document.getElementById('form-alumno').addEventListener('submit', (e) => this.guardarAlumno(e));
        document.getElementById('btn-cancelar').addEventListener('click', () => this.limpiarFormulario());
        document.getElementById('btn-limpiar').addEventListener('click', () => this.limpiarFormulario());
        document.getElementById('buscar-alumno').addEventListener('input', () => this.cargarTabla());
        document.getElementById('filtro-estado').addEventListener('change', () => this.cargarTabla());
        document.getElementById('filtro-instrumento').addEventListener('change', () => this.cargarTabla());
        
        // Validar disponibilidad solo si hay datos en horario
        document.getElementById('instrumento').addEventListener('change', () => this.validarDisponibilidadSiAplica());
        document.getElementById('dia-clase').addEventListener('change', () => this.validarDisponibilidadSiAplica());
        document.getElementById('hora-clase').addEventListener('change', () => this.validarDisponibilidadSiAplica());
        document.getElementById('aula-clase').addEventListener('change', () => this.validarDisponibilidadSiAplica());
    }

    validarDisponibilidadSiAplica() {
        const instrumento = document.getElementById('instrumento').value;
        const dia = document.getElementById('dia-clase').value;
        const hora = document.getElementById('hora-clase').value;
        const aula = document.getElementById('aula-clase').value;

        // Solo validar si todos los campos de horario están completos
        if (instrumento && dia && hora && aula) {
            this.validarDisponibilidad();
        }
    }

    validarDisponibilidad() {
        const dia = document.getElementById('dia-clase').value;
        const hora = document.getElementById('hora-clase').value;
        const aula = document.getElementById('aula-clase').value;
        const alumnoId = document.getElementById('alumno-id').value;

        if (!dia || !hora || !aula) return;

        const conflicto = almacenamiento.obtenerAlumnos().find(alumno => {
            if (alumno.id === alumnoId) return false;
            return alumno.estado === 'activo' && 
                   alumno.horario && 
                   alumno.horario.dia === dia && 
                   alumno.horario.hora === hora && 
                   alumno.horario.aula === aula;
        });

        if (conflicto) {
            Toast.show(`⚠️ Conflicto de horario: ${conflicto.nombre} ${conflicto.apellido} ya tiene clase en este horario y aula`, 'warning');
            return true;
        }
        return false;
    }

    cargarFormulario(alumno = null) {
        if (alumno) {
            document.getElementById('alumno-id').value = alumno.id;
            document.getElementById('nombre').value = alumno.nombre || '';
            document.getElementById('apellido').value = alumno.apellido || '';
            document.getElementById('telefono').value = alumno.telefono || '';
            document.getElementById('correo').value = alumno.correo || '';
            document.getElementById('color').value = alumno.color || '#e74c3c';
            document.getElementById('estado').value = alumno.estado || 'activo';
            
            if (alumno.horario) {
                document.getElementById('instrumento').value = alumno.horario.instrumento || '';
                document.getElementById('dia-clase').value = alumno.horario.dia || '';
                document.getElementById('hora-clase').value = alumno.horario.hora || '';
                document.getElementById('aula-clase').value = alumno.horario.aula || '';
            } else {
                // Limpiar campos de horario si no existe
                document.getElementById('instrumento').value = '';
                document.getElementById('dia-clase').value = '';
                document.getElementById('hora-clase').value = '';
                document.getElementById('aula-clase').value = '';
            }
        } else {
            this.limpiarFormulario();
        }
    }

    guardarAlumno(e) {
        e.preventDefault();
        
        const id = document.getElementById('alumno-id').value;
        const nombre = document.getElementById('nombre').value.trim();
        const apellido = document.getElementById('apellido').value.trim();
        const telefono = document.getElementById('telefono').value.trim();
        const correo = document.getElementById('correo').value.trim();
        const color = document.getElementById('color').value;
        const estado = document.getElementById('estado').value;
        const instrumento = document.getElementById('instrumento').value;
        const dia = document.getElementById('dia-clase').value;
        const hora = document.getElementById('hora-clase').value;
        const aula = document.getElementById('aula-clase').value;

        // Validaciones básicas
        if (!nombre && !apellido) {
            Toast.show('Por favor ingresa al menos un nombre o apellido', 'warning');
            return;
        }

        // Validar que si se llena algún campo de horario, se llenen todos
        const camposHorario = [instrumento, dia, hora, aula];
        const horarioCompleto = camposHorario.every(campo => campo);
        const horarioParcial = camposHorario.some(campo => campo) && !horarioCompleto;

        if (horarioParcial) {
            Toast.show('Por favor completa todos los campos del horario o déjalos todos vacíos', 'warning');
            return;
        }

        // Validar conflicto de horario solo si el horario está completo
        if (horarioCompleto && this.validarDisponibilidad()) {
            return; // Detener el guardado si hay conflicto
        }

        // Preparar datos del alumno
        const alumnoData = {
            id: id || undefined,
            nombre: nombre || 'Sin nombre',
            apellido: apellido || 'Sin apellido',
            telefono: telefono || '',
            correo: correo || '',
            color: color || '#e74c3c',
            estado: estado || 'activo'
        };

        // Agregar horario solo si está completo
        if (horarioCompleto) {
            alumnoData.horario = {
                instrumento,
                dia,
                hora,
                aula
            };
        }

        console.log('Guardando alumno:', alumnoData); // Debug
        
        // Guardar en el almacenamiento
        const exito = almacenamiento.guardarAlumno(alumnoData);
        
        if (exito) {
            this.cargarTabla();
            this.limpiarFormulario();
            this.actualizarSelectoresAlumnos();
            
            // Actualizar dashboard y horario si están disponibles
            if (window.app) {
                window.app.actualizarDashboard();
            }
            if (window.gestorHorario) {
                window.gestorHorario.cargarHorario();
            }
            
            Toast.show(`✅ Alumno ${id ? 'actualizado' : 'agregado'} correctamente`, 'success');
        } else {
            Toast.show('❌ Error al guardar el alumno. Verifica la consola para más detalles.', 'error');
        }
    }

    eliminarAlumno(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este alumno?')) {
            const exito = almacenamiento.eliminarAlumno(id);
            if (exito) {
                this.cargarTabla();
                this.actualizarSelectoresAlumnos();
                
                // Actualizar dashboard y horario
                if (window.app) {
                    window.app.actualizarDashboard();
                }
                if (window.gestorHorario) {
                    window.gestorHorario.cargarHorario();
                }
                
                Toast.show('Alumno eliminado correctamente', 'success');
            } else {
                Toast.show('Error al eliminar el alumno', 'error');
            }
        }
    }

    editarAlumno(id) {
        const alumno = almacenamiento.obtenerAlumnoPorId(id);
        if (alumno) {
            this.cargarFormulario(alumno);
            document.querySelector('[data-tab="alumnos"]').click();
            
            // Scroll suave al formulario
            setTimeout(() => {
                document.getElementById('form-alumno').scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }, 300);
        } else {
            Toast.show('No se pudo encontrar el alumno', 'error');
        }
    }

    cargarTabla() {
        const contenedor = document.getElementById('tabla-alumnos-container');
        const filtroTexto = document.getElementById('buscar-alumno').value;
        const filtroEstado = document.getElementById('filtro-estado').value;
        const filtroInstrumento = document.getElementById('filtro-instrumento').value;
        
        const alumnos = almacenamiento.obtenerAlumnos({
            texto: filtroTexto,
            estado: filtroEstado,
            instrumento: filtroInstrumento
        });
        
        if (alumnos.length === 0) {
            contenedor.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <h3>No se encontraron alumnos</h3>
                    <p>${filtroTexto || filtroEstado || filtroInstrumento ? 
                        'Prueba con otros filtros' : 
                        'Comienza agregando tu primer alumno al sistema'}</p>
                </div>
            `;
            return;
        }
        
        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Alumno</th>
                        <th>Contacto</th>
                        <th>Instrumento</th>
                        <th>Horario</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        alumnos.forEach(alumno => {
            const horario = alumno.horario ? 
                `${this.formatearDia(alumno.horario.dia)} ${alumno.horario.hora} (Aula ${alumno.horario.aula})` : 
                'Sin horario';
            
            const instrumento = alumno.horario?.instrumento ? 
                this.formatearInstrumento(alumno.horario.instrumento) : 
                'N/A';
            
            html += `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 16px; height: 16px; background-color: ${alumno.color}; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div>
                            <div>
                                <strong>${alumno.nombre} ${alumno.apellido}</strong>
                                <div style="font-size: 0.75rem; color: #666;">
                                    ${alumno.fechaRegistro ? `Registrado: ${new Date(alumno.fechaRegistro).toLocaleDateString()}` : ''}
                                </div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div>${alumno.telefono || 'N/A'}</div>
                        <div style="font-size: 0.875rem; color: #666;">${alumno.correo || ''}</div>
                    </td>
                    <td>
                        <span class="badge ${alumno.horario?.instrumento ? 'instrumento-' + alumno.horario.instrumento : 'badge-secondary'}">
                            ${instrumento}
                        </span>
                    </td>
                    <td>${horario}</td>
                    <td>
                        <span class="badge ${this.getClaseEstado(alumno.estado)}">
                            ${alumno.estado.charAt(0).toUpperCase() + alumno.estado.slice(1)}
                        </span>
                    </td>
                    <td class="acciones">
                        <button class="btn btn-primary btn-sm" onclick="gestorAlumnos.editarAlumno('${alumno.id}')">✏️ Editar</button>
                        <button class="btn btn-danger btn-sm" onclick="gestorAlumnos.eliminarAlumno('${alumno.id}')">🗑️ Eliminar</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        contenedor.innerHTML = html;
    }

    formatearDia(dia) {
        const dias = {
            'lunes': 'Lun',
            'martes': 'Mar',
            'miercoles': 'Mié',
            'jueves': 'Jue',
            'viernes': 'Vie'
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

    getClaseEstado(estado) {
        const clases = {
            'activo': 'badge-success',
            'inactivo': 'badge-danger',
            'pendiente': 'badge-warning'
        };
        return clases[estado] || 'badge-info';
    }

    limpiarFormulario() {
        document.getElementById('form-alumno').reset();
        document.getElementById('alumno-id').value = '';
        document.getElementById('color').value = '#e74c3c';
        document.getElementById('estado').value = 'activo';
        Toast.show('Formulario limpiado', 'info');
    }

    actualizarSelectoresAlumnos() {
        const selectAlumnoAnotacion = document.getElementById('alumno-anotacion');
        const selectFiltroAlumno = document.getElementById('filtro-alumno-anotacion');
        
        if (!selectAlumnoAnotacion || !selectFiltroAlumno) return;

        // Limpiar opciones existentes (excepto la primera)
        while (selectAlumnoAnotacion.children.length > 1) {
            selectAlumnoAnotacion.removeChild(selectAlumnoAnotacion.lastChild);
        }
        
        while (selectFiltroAlumno.children.length > 1) {
            selectFiltroAlumno.removeChild(selectFiltroAlumno.lastChild);
        }
        
        // Agregar alumnos activos
        const alumnosActivos = almacenamiento.obtenerAlumnos({ estado: 'activo' });
        
        if (alumnosActivos.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No hay alumnos activos';
            selectAlumnoAnotacion.appendChild(option);
            return;
        }
        
        alumnosActivos.forEach(alumno => {
            const option = document.createElement('option');
            option.value = alumno.id;
            option.textContent = `${alumno.nombre} ${alumno.apellido}`;
            
            const optionFiltro = option.cloneNode(true);
            
            selectAlumnoAnotacion.appendChild(option);
            selectFiltroAlumno.appendChild(optionFiltro);
        });
    }

    obtenerAlumnos() {
        return almacenamiento.obtenerAlumnos();
    }

    obtenerAlumnoPorId(id) {
        return almacenamiento.obtenerAlumnoPorId(id);
    }

    obtenerAlumnosPorHorario(dia, hora, aula) {
        return almacenamiento.obtenerAlumnosPorHorario(dia, hora, aula);
    }

    // Método para buscar alumnos por texto
    buscarAlumnos(texto) {
        return almacenamiento.obtenerAlumnos({ texto });
    }
}

// Asegurarse de que el gestor esté disponible globalmente
window.gestorAlumnos = new GestorAlumnos();
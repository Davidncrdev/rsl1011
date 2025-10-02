class GestorAlumnos {
    constructor() {
        this.alumnos = JSON.parse(localStorage.getItem('alumnos')) || [];
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
        document.getElementById('buscar-alumno').addEventListener('input', () => this.cargarTabla());
        document.getElementById('filtro-estado').addEventListener('change', () => this.cargarTabla());
        document.getElementById('filtro-instrumento').addEventListener('change', () => this.cargarTabla());
        
        // Validar disponibilidad de horario
        document.getElementById('dia-clase').addEventListener('change', () => this.validarDisponibilidad());
        document.getElementById('hora-clase').addEventListener('change', () => this.validarDisponibilidad());
        document.getElementById('aula-clase').addEventListener('change', () => this.validarDisponibilidad());
    }

    validarDisponibilidad() {
        const dia = document.getElementById('dia-clase').value;
        const hora = document.getElementById('hora-clase').value;
        const aula = document.getElementById('aula-clase').value;
        const alumnoId = document.getElementById('alumno-id').value;

        if (!dia || !hora || !aula) return;

        const conflicto = this.alumnos.find(alumno => {
            if (alumno.id === alumnoId) return false; // Ignorar el alumno actual en edición
            return alumno.estado === 'activo' && 
                   alumno.horario && 
                   alumno.horario.dia === dia && 
                   alumno.horario.hora === hora && 
                   alumno.horario.aula === aula;
        });

        if (conflicto) {
            alert(`⚠️ Conflicto de horario: ${conflicto.nombre} ${conflicto.apellido} ya tiene clase en este horario y aula`);
        }
    }

    cargarFormulario(alumno = null) {
        if (alumno) {
            document.getElementById('alumno-id').value = alumno.id;
            document.getElementById('nombre').value = alumno.nombre;
            document.getElementById('apellido').value = alumno.apellido;
            document.getElementById('telefono').value = alumno.telefono || '';
            document.getElementById('correo').value = alumno.correo || '';
            document.getElementById('color').value = alumno.color;
            document.getElementById('estado').value = alumno.estado;
            
            if (alumno.horario) {
                document.getElementById('instrumento').value = alumno.horario.instrumento;
                document.getElementById('dia-clase').value = alumno.horario.dia;
                document.getElementById('hora-clase').value = alumno.horario.hora;
                document.getElementById('aula-clase').value = alumno.horario.aula;
            }
        } else {
            this.limpiarFormulario();
        }
    }

    guardarAlumno(e) {
        e.preventDefault();
        
        const id = document.getElementById('alumno-id').value;
        const nombre = document.getElementById('nombre').value;
        const apellido = document.getElementById('apellido').value;
        const telefono = document.getElementById('telefono').value;
        const correo = document.getElementById('correo').value;
        const color = document.getElementById('color').value;
        const estado = document.getElementById('estado').value;
        const instrumento = document.getElementById('instrumento').value;
        const dia = document.getElementById('dia-clase').value;
        const hora = document.getElementById('hora-clase').value;
        const aula = document.getElementById('aula-clase').value;

        // Validaciones
        if (!instrumento || !dia || !hora || !aula) {
            alert('Por favor completa todos los campos del horario');
            return;
        }

        const alumno = {
            id: id || 'alumno_' + Date.now(),
            nombre,
            apellido,
            telefono,
            correo,
            color,
            estado,
            horario: {
                instrumento,
                dia,
                hora,
                aula
            },
            fechaRegistro: id ? this.alumnos.find(a => a.id === id).fechaRegistro : new Date().toISOString(),
            fechaActualizacion: new Date().toISOString()
        };
        
        if (id) {
            // Editar alumno existente
            const index = this.alumnos.findIndex(a => a.id === id);
            if (index !== -1) {
                this.alumnos[index] = alumno;
            }
        } else {
            // Agregar nuevo alumno
            this.alumnos.push(alumno);
        }
        
        this.guardarEnLocalStorage();
        this.cargarTabla();
        this.limpiarFormulario();
        this.actualizarSelectoresAlumnos();
        
        // Actualizar dashboard y horario
        if (window.app) {
            window.app.actualizarDashboard();
            window.app.gestorHorario.cargarHorario();
        }
        
        alert(`✅ Alumno ${id ? 'actualizado' : 'agregado'} correctamente`);
    }

    eliminarAlumno(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este alumno?')) {
            this.alumnos = this.alumnos.filter(alumno => alumno.id !== id);
            this.guardarEnLocalStorage();
            this.cargarTabla();
            this.actualizarSelectoresAlumnos();
            
            if (window.app) {
                window.app.actualizarDashboard();
                window.app.gestorHorario.cargarHorario();
            }
        }
    }

    editarAlumno(id) {
        const alumno = this.alumnos.find(a => a.id === id);
        if (alumno) {
            this.cargarFormulario(alumno);
            document.querySelector('[data-tab="alumnos"]').click();
        }
    }

    cargarTabla() {
        const contenedor = document.getElementById('tabla-alumnos-container');
        const filtroTexto = document.getElementById('buscar-alumno').value.toLowerCase();
        const filtroEstado = document.getElementById('filtro-estado').value;
        const filtroInstrumento = document.getElementById('filtro-instrumento').value;
        
        let alumnosFiltrados = this.alumnos;
        
        // Aplicar filtros
        if (filtroTexto) {
            alumnosFiltrados = alumnosFiltrados.filter(alumno => 
                alumno.nombre.toLowerCase().includes(filtroTexto) ||
                alumno.apellido.toLowerCase().includes(filtroTexto) ||
                alumno.telefono?.toLowerCase().includes(filtroTexto) ||
                alumno.correo?.toLowerCase().includes(filtroTexto)
            );
        }
        
        if (filtroEstado) {
            alumnosFiltrados = alumnosFiltrados.filter(alumno => alumno.estado === filtroEstado);
        }
        
        if (filtroInstrumento) {
            alumnosFiltrados = alumnosFiltrados.filter(alumno => 
                alumno.horario?.instrumento === filtroInstrumento
            );
        }
        
        if (alumnosFiltrados.length === 0) {
            contenedor.innerHTML = '<div style="padding: 2rem; text-align: center; color: #666;">No se encontraron alumnos</div>';
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
        
        alumnosFiltrados.forEach(alumno => {
            const horario = alumno.horario ? 
                `${this.formatearDia(alumno.horario.dia)} ${alumno.horario.hora} (Aula ${alumno.horario.aula})` : 
                'Sin horario';
            
            html += `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 16px; height: 16px; background-color: ${alumno.color}; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div>
                            <div>
                                <strong>${alumno.nombre} ${alumno.apellido}</strong>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div>${alumno.telefono || 'N/A'}</div>
                        <div style="font-size: 0.875rem; color: #666;">${alumno.correo || ''}</div>
                    </td>
                    <td>
                        <span class="badge instrumento-${alumno.horario?.instrumento || 'none'}">
                            ${this.formatearInstrumento(alumno.horario?.instrumento) || 'N/A'}
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
        document.getElementById('color').value = '#3498db';
        document.getElementById('estado').value = 'activo';
    }

    guardarEnLocalStorage() {
        localStorage.setItem('alumnos', JSON.stringify(this.alumnos));
    }

    actualizarSelectoresAlumnos() {
        const selectAlumnoAnotacion = document.getElementById('alumno-anotacion');
        const selectFiltroAlumno = document.getElementById('filtro-alumno-anotacion');
        
        // Limpiar opciones existentes (excepto la primera)
        while (selectAlumnoAnotacion.children.length > 1) {
            selectAlumnoAnotacion.removeChild(selectAlumnoAnotacion.lastChild);
        }
        
        while (selectFiltroAlumno.children.length > 1) {
            selectFiltroAlumno.removeChild(selectFiltroAlumno.lastChild);
        }
        
        // Agregar alumnos activos
        this.alumnos
            .filter(alumno => alumno.estado === 'activo')
            .forEach(alumno => {
                const option = document.createElement('option');
                option.value = alumno.id;
                option.textContent = `${alumno.nombre} ${alumno.apellido}`;
                
                const optionFiltro = option.cloneNode(true);
                
                selectAlumnoAnotacion.appendChild(option);
                selectFiltroAlumno.appendChild(optionFiltro);
            });
    }

    obtenerAlumnos() {
        return this.alumnos;
    }

    obtenerAlumnoPorId(id) {
        return this.alumnos.find(alumno => alumno.id === id);
    }

    obtenerAlumnosPorHorario(dia, hora, aula) {
        return this.alumnos.filter(alumno => 
            alumno.estado === 'activo' && 
            alumno.horario && 
            alumno.horario.dia === dia && 
            alumno.horario.hora === hora && 
            alumno.horario.aula === aula
        );
    }
}

// Inicializar gestor de alumnos
const gestorAlumnos = new GestorAlumnos();
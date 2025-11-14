const DispensaryManager = (() => {
    const state = {
        data: null,
        mode: 'create',
        signaturePad: null,
        preservedSignature: null,
        resizeHandler: null
    };

    const SIGNATURE_PREFIX_REGEX = /^data:image\/[a-zA-Z0-9+\-.]+;base64,/;

    function normalizeSignatureDataUrl(value) {
        if (!value) return null;
        let data = String(value).trim();
        if (!data) return null;

        let prefix = 'data:image/png;base64,';
        let payload = data;

        const initialMatch = data.match(SIGNATURE_PREFIX_REGEX);
        if (initialMatch) {
            prefix = initialMatch[0];
            payload = data.slice(prefix.length);
        }

        while (SIGNATURE_PREFIX_REGEX.test(payload)) {
            const match = payload.match(SIGNATURE_PREFIX_REGEX);
            if (!match) break;
            payload = payload.slice(match[0].length);
        }

        payload = payload.replace(/\s+/g, '');
        return `${prefix}${payload}`;
    }

    const els = {};

    const apiUrl = () => `${window.CONFIG?.API_BASE_URL || ''}/dispensary`;

    const notify = {
        success: (msg) => {
            if (window.notify?.success) {
                window.notify.success(msg);
            } else {
                console.log(`✅ ${msg}`);
            }
        },
        error: (msg) => {
            if (window.notify?.error) {
                window.notify.error(msg);
            } else {
                console.error(msg);
                alert(`⚠️ ${msg}`);
            }
        },
        info: (msg) => {
            if (window.notify?.info) {
                window.notify.info(msg);
            } else {
                console.log(msg);
            }
        }
    };

    const dom = {
        cache() {
            els.card = document.getElementById('dispensaryCard');
            els.content = document.getElementById('dispensaryContent');
            els.createBtn = document.getElementById('createDispensaryBtn');
            els.editBtn = document.getElementById('editDispensaryBtn');
            els.deleteBtn = document.getElementById('deleteDispensaryBtn');
            els.modal = document.getElementById('dispensaryModal');
            els.modalTitle = document.getElementById('dispensaryModalTitle');
            els.modalSubtitle = document.getElementById('dispensaryModalSubtitle');
            els.closeModalBtn = document.getElementById('closeDispensaryModal');
            els.cancelBtn = document.getElementById('cancelDispensaryBtn');
            els.form = document.getElementById('dispensaryForm');
            els.nameInput = document.getElementById('formDispensaryName');
            els.rutInput = document.getElementById('formDispensaryRut');
            els.emailInput = document.getElementById('formDispensaryEmail');
            els.addressInput = document.getElementById('formDispensaryAddress');
            els.signatureCanvas = document.getElementById('dispensarySignatureCanvas');
            els.signatureDropzone = document.getElementById('signatureDropzone');
            els.clearSignatureBtn = document.getElementById('clearSignatureBtn');
            els.uploadSignatureBtn = document.getElementById('uploadSignatureBtn');
            els.signatureUploadInput = document.getElementById('signatureUploadInput');
            els.signaturePreviewWrapper = document.getElementById('signaturePreviewWrapper');
            els.signaturePreviewImage = document.getElementById('signaturePreviewImage');
        },
        bindEvents() {
            els.createBtn?.addEventListener('click', () => openModal('create'));
            els.editBtn?.addEventListener('click', () => openModal('edit'));
            els.deleteBtn?.addEventListener('click', handleDelete);
            els.closeModalBtn?.addEventListener('click', closeModal);
            els.cancelBtn?.addEventListener('click', closeModal);
            els.form?.addEventListener('submit', handleSubmit);
            els.clearSignatureBtn?.addEventListener('click', clearSignature);
            els.uploadSignatureBtn?.addEventListener('click', () => els.signatureUploadInput?.click());
            els.signatureUploadInput?.addEventListener('change', handleSignatureUpload);
            els.modal?.addEventListener('click', (event) => {
                if (event.target?.hasAttribute('data-dismiss-modal')) {
                    closeModal();
                }
            });
            setupSignatureDropzone();
        }
    };

    const utils = {
        formatDate(value) {
            if (!value) return '—';
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return value;
            return date.toLocaleString('es-CL', {
                dateStyle: 'medium',
                timeStyle: 'short'
            });
        },
        escape(value) {
            if (value === null || value === undefined) return '';
            return String(value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }
    };

    async function fetchDispensary() {
        try {
            const apiBaseUrl = window.CONFIG?.API_BASE_URL;
            
            // Si no hay backend disponible (GitHub Pages), usar JSON estático
            if (!apiBaseUrl) {
                console.log('📄 Usando JSON estático para dispensary...');
                try {
                    // Intentar cargar desde JSON estático usando api.loadStaticJSON si está disponible
                    if (window.api && window.api.loadStaticJSON) {
                        const staticData = await window.api.loadStaticJSON('dispensary.json');
                        if (staticData && staticData.success && staticData.data) {
                            state.data = staticData.data;
                            if (state.data) {
                                state.data.signature = normalizeSignatureDataUrl(state.data.signature);
                            }
                            render();
                            updateActions();
                            return;
                        }
                    }
                    
                    // Si api.loadStaticJSON no está disponible, hacer fetch directo
                    const isAdminArea = window.location.pathname.includes('/admin/');
                    let apiPath;
                    
                    if (window.location.hostname.includes('github.io')) {
                        // GitHub Pages - construir ruta basada en la URL actual
                        const pathname = window.location.pathname;
                        const pathParts = pathname.split('/').filter(p => p);
                        let repoIndex = -1;
                        for (let i = 0; i < pathParts.length; i++) {
                            if (pathParts[i].includes('apexremedy')) {
                                repoIndex = i;
                                break;
                            }
                        }
                        
                        if (repoIndex !== -1) {
                            const basePath = '/' + pathParts.slice(0, repoIndex + 1).join('/') + '/';
                            apiPath = basePath + 'api/dispensary.json';
                        } else {
                            apiPath = '/api/dispensary.json';
                        }
                    } else {
                        // Desarrollo local
                        apiPath = isAdminArea ? '../api/dispensary.json' : './api/dispensary.json';
                    }
                    
                    const response = await fetch(apiPath);
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    const result = await response.json();
                    
                    if (result.success && result.data) {
                        state.data = result.data;
                        if (state.data) {
                            state.data.signature = normalizeSignatureDataUrl(state.data.signature);
                        }
                        render();
                        updateActions();
                        return;
                    } else {
                        throw new Error('Formato de JSON inválido');
                    }
                } catch (jsonError) {
                    console.warn('⚠️ No se pudo cargar JSON estático, usando valores por defecto:', jsonError);
                    state.data = null;
                    render();
                    updateActions();
                    return;
                }
            }
            
            // Usar API backend
            try {
                const response = await fetch(apiUrl(), {
                    method: 'GET',
                    credentials: 'include'
                });

                if (response.status === 404) {
                    state.data = null;
                    render();
                    updateActions();
                    return;
                }

                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.message || 'No se pudo obtener la información del dispensario');
                }

                state.data = result.data || null;
                if (state.data) {
                    state.data.signature = normalizeSignatureDataUrl(state.data.signature);
                }
                render();
                updateActions();
            } catch (error) {
                // Si falla el backend, intentar JSON estático como fallback
                if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
                    console.log('📄 Backend no disponible, usando JSON estático como fallback...');
                    try {
                        if (window.api && window.api.loadStaticJSON) {
                            const staticData = await window.api.loadStaticJSON('dispensary.json');
                            if (staticData && staticData.success && staticData.data) {
                                state.data = staticData.data;
                                if (state.data) {
                                    state.data.signature = normalizeSignatureDataUrl(state.data.signature);
                                }
                                render();
                                updateActions();
                                return;
                            }
                        }
                    } catch (jsonError) {
                        console.warn('⚠️ No se pudo cargar JSON estático como fallback:', jsonError);
                    }
                }
                throw error;
            }
        } catch (error) {
            console.error('Error cargando datos del dispensario:', error);
            state.data = null;
            render();
            updateActions();
        }
    }

    function render() {
        if (!els.content) return;

        if (!state.data) {
            els.content.innerHTML = `
                <div class="p-12 text-center text-gray-500">
                    <div class="flex flex-col items-center gap-4">
                        <span class="text-6xl">📋</span>
                        <h3 class="text-xl font-semibold text-gray-700">Sin información registrada</h3>
                        <p class="max-w-md text-sm text-gray-500">
                            Crea un registro con los datos oficiales del dispensario para habilitar los documentos de cesión.
                        </p>
                    </div>
                </div>
            `;
            return;
        }

        const { name, rut, address, email, signature, created_at, updated_at } = state.data;
        const created = utils.formatDate(created_at);
        const updated = utils.formatDate(updated_at);
        const normalizedSignature = normalizeSignatureDataUrl(signature);

        els.content.innerHTML = `
            <div class="p-6 md:p-8 lg:p-10 space-y-8">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="space-y-6">
                        <div>
                            <p class="text-xs font-semibold tracking-wide text-emerald-600 uppercase">Nombre o razón social</p>
                            <p class="text-xl font-semibold text-gray-900 mt-1">${utils.escape(name)}</p>
                        </div>
                        <div>
                            <p class="text-xs font-semibold tracking-wide text-emerald-600 uppercase">RUT</p>
                            <p class="text-lg text-gray-900 mt-1">${utils.escape(rut)}</p>
                        </div>
                    </div>
                    <div class="space-y-6">
                        <div>
                            <p class="text-xs font-semibold tracking-wide text-emerald-600 uppercase">Correo de contacto</p>
                            <p class="text-lg text-gray-900 mt-1">${utils.escape(email)}</p>
                        </div>
                        <div>
                            <p class="text-xs font-semibold tracking-wide text-emerald-600 uppercase">Domicilio comercial</p>
                            <p class="text-lg text-gray-900 mt-1">${utils.escape(address)}</p>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="md:col-span-2 space-y-3">
                        <p class="text-xs font-semibold tracking-wide text-emerald-600 uppercase">Firma digital</p>
                        <div class="flex items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 min-h-[160px] p-6">
                            ${normalizedSignature ? `<img src="${normalizedSignature}" alt="Firma del dispensario" class="max-h-32 object-contain" />`
                            : `<span class="text-sm text-gray-400">No hay firma registrada</span>`}
                        </div>
                    </div>
                    <div class="rounded-xl border border-gray-100 bg-gray-50 p-5 space-y-4">
                        <div>
                            <p class="text-xs font-semibold text-gray-500 uppercase">Creado</p>
                            <p class="text-sm text-gray-700 mt-1">${created}</p>
                        </div>
                        <div>
                            <p class="text-xs font-semibold text-gray-500 uppercase">Última actualización</p>
                            <p class="text-sm text-gray-700 mt-1">${updated}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderError() {
        if (!els.content) return;
        els.content.innerHTML = `
            <div class="p-12 text-center text-red-500">
                <div class="flex flex-col items-center gap-3">
                    <span class="text-5xl">⚠️</span>
                    <p class="text-lg font-semibold">No se pudo cargar la información del dispensario</p>
                    <p class="text-sm text-red-400">Intenta recargar la página o comunícate con soporte.</p>
                </div>
            </div>
        `;
    }

    function updateActions() {
        const hasData = Boolean(state.data);
        toggleButton(els.createBtn, !hasData);
        toggleButton(els.editBtn, hasData);
        toggleButton(els.deleteBtn, hasData);
    }

    function toggleButton(button, show) {
        if (!button) return;
        if (show) {
            button.classList.remove('hidden');
        } else {
            button.classList.add('hidden');
        }
    }

    function openModal(mode) {
        state.mode = mode;
        if (!els.modal) return;

        const isEdit = mode === 'edit';
        els.modalTitle.textContent = isEdit ? 'Editar datos del dispensario' : 'Nuevo registro de dispensario';
        els.modalSubtitle.textContent = isEdit
            ? 'Modifica los campos necesarios y guarda los cambios.'
            : 'Completa los datos oficiales del dispensario para habilitar los documentos de cesión.';

        els.form.reset();
        state.preservedSignature = null;

        if (isEdit && state.data) {
            els.nameInput.value = state.data.name || '';
            els.rutInput.value = state.data.rut || '';
            els.emailInput.value = state.data.email || '';
            els.addressInput.value = state.data.address || '';
            state.preservedSignature = normalizeSignatureDataUrl(state.data.signature || null);
            state.data.signature = state.preservedSignature;
        } else {
            els.nameInput.value = '';
            els.rutInput.value = '';
            els.emailInput.value = '';
            els.addressInput.value = '';
        }

        setupSignaturePad(state.preservedSignature);
        updateSignaturePreview(state.preservedSignature);
        if (els.signatureDropzone) {
            els.signatureDropzone.classList.remove('is-dragover');
        }

        els.modal.classList.remove('hidden');
        els.modal.classList.add('flex');
        document.body.classList.add('overflow-hidden');
    }

    function closeModal() {
        if (!els.modal) return;
        els.modal.classList.add('hidden');
        els.modal.classList.remove('flex');
        document.body.classList.remove('overflow-hidden');
        if (els.signatureDropzone) {
            els.signatureDropzone.classList.remove('is-dragover');
        }
        if (els.signatureUploadInput) {
            els.signatureUploadInput.value = '';
        }
        destroySignaturePad();
    }

    function setupSignaturePad(initialDataUrl) {
        if (!els.signatureCanvas || typeof SignaturePad === 'undefined') return;

        const canvas = els.signatureCanvas;
        const context = canvas.getContext('2d');

        const resize = () => {
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            const width = canvas.offsetWidth;
            const height = canvas.offsetHeight;
            canvas.width = width * ratio;
            canvas.height = height * ratio;
            context.setTransform(1, 0, 0, 1, 0, 0);
            context.scale(ratio, ratio);
            context.clearRect(0, 0, width, height);
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, width, height);
            if (state.signaturePad) {
                const data = state.signaturePad.toData();
                state.signaturePad.clear();
                if (data && data.length) {
                    state.signaturePad.fromData(data);
                }
            }
        };

        destroySignaturePad();
        state.signaturePad = new SignaturePad(canvas, {
            backgroundColor: '#ffffff',
            penColor: '#1f2937',
            throttle: 16
        });

        state.resizeHandler = () => {
            const data = state.signaturePad && !state.signaturePad.isEmpty()
                ? state.signaturePad.toData()
                : null;
            resize();
            if (data && state.signaturePad) {
                state.signaturePad.fromData(data);
            }
        };

        window.addEventListener('resize', state.resizeHandler);
        resize();

        if (initialDataUrl) {
            try {
                state.signaturePad.fromDataURL(initialDataUrl);
            } catch (error) {
                console.warn('No se pudo cargar la firma previa en el canvas:', error);
            }
        } else {
            state.signaturePad.clear();
        }
    }

    function destroySignaturePad() {
        if (state.resizeHandler) {
            window.removeEventListener('resize', state.resizeHandler);
            state.resizeHandler = null;
        }
        if (state.signaturePad) {
            state.signaturePad.off();
            state.signaturePad = null;
        }
    }

    function clearSignature() {
        if (state.signaturePad) {
            state.signaturePad.clear();
        }
        state.preservedSignature = null;
        updateSignaturePreview(null);
    }

    function handleSignatureUpload(event) {
        const file = event.target.files?.[0];
        if (file) {
            processSignatureFile(file);
        }
        event.target.value = '';
    }

    function setupSignatureDropzone() {
        if (!els.signatureDropzone) return;
        const dropzone = els.signatureDropzone;

        const preventDefaults = (event) => {
            event.preventDefault();
            event.stopPropagation();
        };

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
            dropzone.addEventListener(eventName, preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach((eventName) => {
            dropzone.addEventListener(eventName, () => dropzone.classList.add('is-dragover'));
        });

        ['dragleave', 'drop'].forEach((eventName) => {
            dropzone.addEventListener(eventName, () => dropzone.classList.remove('is-dragover'));
        });

        dropzone.addEventListener('drop', (event) => {
            const file = event.dataTransfer?.files?.[0];
            if (file) {
                processSignatureFile(file);
            }
        });

        dropzone.addEventListener('click', (event) => {
            if (event.target === els.signatureCanvas) return;
            const isButton = event.target.closest('.admin-btn-secondary');
            if (!isButton) {
                els.signatureUploadInput?.click();
            }
        });
    }

    function processSignatureFile(file) {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            if (window.notify?.error) {
                window.notify.error('El archivo debe ser una imagen (PNG, JPG, WEBP).');
            } else {
                console.error('El archivo debe ser una imagen (PNG, JPG, WEBP).');
            }
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result;
            if (typeof dataUrl !== 'string') return;
            applySignatureDataUrl(dataUrl);
        };
        reader.readAsDataURL(file);
    }

    function applySignatureDataUrl(dataUrl) {
        const normalized = normalizeSignatureDataUrl(dataUrl);
        if (!normalized) return;
        if (state.signaturePad) {
            const image = new Image();
            image.onload = () => {
                const canvas = els.signatureCanvas;
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                state.signaturePad.fromDataURL(canvas.toDataURL('image/png'));
                state.preservedSignature = normalizeSignatureDataUrl(canvas.toDataURL('image/png'));
                updateSignaturePreview(state.preservedSignature);
            };
            image.src = normalized;
        } else {
            state.preservedSignature = normalized;
            updateSignaturePreview(state.preservedSignature);
        }
    }

    function updateSignaturePreview(dataUrl) {
        if (!els.signaturePreviewWrapper || !els.signaturePreviewImage) return;
        if (dataUrl) {
            const normalized = normalizeSignatureDataUrl(dataUrl);
            els.signaturePreviewWrapper.classList.remove('hidden');
            els.signaturePreviewImage.src = normalized;
        } else {
            els.signaturePreviewWrapper.classList.add('hidden');
            els.signaturePreviewImage.src = '';
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (!els.form) return;

        const button = els.form.querySelector('button[type="submit"]');
        const originalText = button?.innerHTML;
        if (button) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Guardando...';
        }

        try {
            const payload = {
                name: els.nameInput.value.trim(),
                rut: els.rutInput.value.trim(),
                email: els.emailInput.value.trim(),
                address: els.addressInput.value.trim(),
                signature: null
            };

            if (!payload.name || !payload.rut || !payload.email || !payload.address) {
                throw new Error('Completa todos los campos obligatorios');
            }

            if (state.signaturePad && !state.signaturePad.isEmpty()) {
                payload.signature = state.signaturePad.toDataURL('image/png');
            } else if (state.preservedSignature) {
                payload.signature = state.preservedSignature;
            }

            payload.signature = normalizeSignatureDataUrl(payload.signature);

            const csrfToken = (typeof api !== 'undefined' && typeof api.ensureCsrfToken === 'function')
                ? await api.ensureCsrfToken()
                : null;

            const response = await fetch(apiUrl(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {})
                },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'No se pudo guardar la información');
            }

            state.data = result.data;
            if (state.data) {
                state.data.signature = normalizeSignatureDataUrl(state.data.signature);
            }
            if (window.notify?.success) {
                window.notify.success('Datos del dispensario guardados correctamente');
            } else {
                console.log('✅ Datos del dispensario guardados correctamente');
            }
            closeModal();
            render();
            updateActions();
        } catch (error) {
            console.error('Error guardando datos del dispensario:', error);
            if (window.notify?.error) {
                window.notify.error(error.message || 'No fue posible guardar la información');
            } else {
                console.error(error.message || 'No fue posible guardar la información');
            }
        } finally {
            if (button) {
                button.disabled = false;
                button.innerHTML = originalText;
            }
        }
    }

    async function handleDelete() {
        if (!state.data) return;
        const confirmed = window.confirm('¿Seguro que deseas eliminar los datos del dispensario? Esta acción no se puede deshacer.');
        if (!confirmed) return;

        try {
            const csrfToken = (typeof api !== 'undefined' && typeof api.ensureCsrfToken === 'function')
                ? await api.ensureCsrfToken()
                : null;

            const response = await fetch(apiUrl(), {
                method: 'DELETE',
                headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : undefined,
                credentials: 'include'
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'No se pudo eliminar el registro');
            }

            state.data = null;
            if (window.notify?.success) {
                window.notify.success('Registro del dispensario eliminado correctamente');
            } else {
                console.log('✅ Registro del dispensario eliminado correctamente');
            }
            render();
            updateActions();
        } catch (error) {
            console.error('Error eliminando datos del dispensario:', error);
            if (window.notify?.error) {
                window.notify.error(error.message || 'No fue posible eliminar el registro');
            } else {
                console.error(error.message || 'No fue posible eliminar el registro');
            }
        }
    }

    function init() {
        dom.cache();
        dom.bindEvents();
        fetchDispensary();
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
    if (!window.CONFIG) {
        console.warn('CONFIG no está disponible aún. Retrasando inicialización de DispensaryManager.');
        setTimeout(DispensaryManager.init, 200);
    } else {
        DispensaryManager.init();
    }
});

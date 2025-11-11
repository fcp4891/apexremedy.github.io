// ============================================
// USERS GUIDE - Guía de aprobación de usuarios
// ============================================

function showApprovalGuide() {
    const guideHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="approvalGuideModal" data-action="approval-guide-overlay">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-screen overflow-y-auto" data-role="modal-content">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-3">
                            <i class="fas fa-prescription text-green-600"></i>
                            Guía de Aprobación de Usuarios Medicinales
                        </h2>
                        <button class="text-gray-500 hover:text-gray-700" data-action="close-approval-guide">
                            <i class="fas fa-times text-2xl"></i>
                        </button>
                    </div>

                    <div class="space-y-6">
                        <!-- Introducción -->
                        <div class="bg-blue-50 border-l-4 border-blue-400 p-4">
                            <div class="flex">
                                <div class="flex-shrink-0">
                                    <i class="fas fa-info-circle text-blue-400"></i>
                                </div>
                                <div class="ml-3">
                                    <h3 class="text-sm font-medium text-blue-800">¿Qué hace la aprobación?</h3>
                                    <p class="mt-2 text-sm text-blue-700">
                                        Los usuarios aprobados pueden ver y comprar productos medicinales. Sin aprobación, solo ven productos recreativos y accesorios.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Estados de usuario -->
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <i class="fas fa-traffic-light text-orange-500"></i>
                                Estados de Usuario
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div class="border border-yellow-300 bg-yellow-50 rounded-lg p-4">
                                    <div class="flex items-center gap-2 mb-2">
                                        <i class="fas fa-clock text-yellow-600"></i>
                                        <span class="font-medium text-yellow-800">Pendiente</span>
                                    </div>
                                    <p class="text-sm text-yellow-700">Usuario recién registrado. No puede ver productos medicinales.</p>
                                </div>
                                <div class="border border-green-300 bg-green-50 rounded-lg p-4">
                                    <div class="flex items-center gap-2 mb-2">
                                        <i class="fas fa-check text-green-600"></i>
                                        <span class="font-medium text-green-800">Aprobado</span>
                                    </div>
                                    <p class="text-sm text-green-700">Usuario verificado. Puede ver y comprar productos medicinales.</p>
                                </div>
                                <div class="border border-red-300 bg-red-50 rounded-lg p-4">
                                    <div class="flex items-center gap-2 mb-2">
                                        <i class="fas fa-times text-red-600"></i>
                                        <span class="font-medium text-red-800">Rechazado</span>
                                    </div>
                                    <p class="text-sm text-red-700">Usuario no cumple requisitos. No puede iniciar sesión.</p>
                                </div>
                            </div>
                        </div>

                        <!-- Pasos para aprobar -->
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <i class="fas fa-list-ol text-green-500"></i>
                                Cómo Aprobar un Usuario
                            </h3>
                            <div class="space-y-3">
                                <div class="flex items-start gap-3">
                                    <span class="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">1</span>
                                    <div>
                                        <p class="font-medium text-gray-800">Revisar documentos</p>
                                        <p class="text-sm text-gray-600">Haz clic en <i class="fas fa-file-alt text-blue-600"></i> para ver los documentos médicos del usuario.</p>
                                    </div>
                                </div>
                                <div class="flex items-start gap-3">
                                    <span class="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">2</span>
                                    <div>
                                        <p class="font-medium text-gray-800">Verificar información médica</p>
                                        <p class="text-sm text-gray-600">Confirma que los datos médicos, RUT, y autorización sean válidos.</p>
                                    </div>
                                </div>
                                <div class="flex items-start gap-3">
                                    <span class="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">3</span>
                                    <div>
                                        <p class="font-medium text-gray-800">Aprobar o rechazar</p>
                                        <p class="text-sm text-gray-600">Haz clic en <i class="fas fa-check text-green-600"></i> para aprobar o <i class="fas fa-times text-red-600"></i> para rechazar.</p>
                                    </div>
                                </div>
                                <div class="flex items-start gap-3">
                                    <span class="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">4</span>
                                    <div>
                                        <p class="font-medium text-gray-800">Notificar al usuario</p>
                                        <p class="text-sm text-gray-600">El usuario debe cerrar sesión e iniciar sesión nuevamente para acceder a productos medicinales.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Resolución de problemas -->
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <i class="fas fa-tools text-orange-500"></i>
                                Resolución de Problemas
                            </h3>
                            <div class="space-y-3">
                                <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                    <p class="font-medium text-orange-800 mb-2">❓ "El usuario aprobado no ve productos medicinales"</p>
                                    <p class="text-sm text-orange-700">
                                        → Pide al usuario cerrar sesión e iniciar sesión nuevamente.<br>
                                        → En la consola del navegador, ejecuta: <code class="bg-gray-200 px-1 rounded">diagnosticMedicinalAccess()</code>
                                    </p>
                                </div>
                                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p class="font-medium text-blue-800 mb-2">🔍 "Necesito verificar el estado de un usuario"</p>
                                    <p class="text-sm text-blue-700">
                                        → Ve a la tabla de usuarios y revisa la columna "Estado".<br>
                                        → Usa los botones de acción para cambiar el estado si es necesario.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Función de diagnóstico -->
                        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h4 class="font-medium text-gray-800 mb-2 flex items-center gap-2">
                                <i class="fas fa-stethoscope text-purple-600"></i>
                                Herramienta de Diagnóstico
                            </h4>
                            <p class="text-sm text-gray-600 mb-3">
                                Los usuarios pueden ejecutar esta función en la consola del navegador para diagnosticar problemas de acceso:
                            </p>
                            <code class="bg-gray-800 text-green-400 px-3 py-2 rounded block text-sm">
                                diagnosticMedicinalAccess()
                            </code>
                        </div>
                    </div>

                    <div class="mt-6 flex justify-end">
                        <button class="admin-btn admin-btn--primary" data-action="close-approval-guide">
                            Entendido, cerrar guía
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', guideHTML);
}

function closeApprovalGuide() {
    const modal = document.getElementById('approvalGuideModal');
    if (modal) {
        modal.remove();
    }
}

// Exponer funciones globalmente
window.showApprovalGuide = showApprovalGuide;
window.closeApprovalGuide = closeApprovalGuide;


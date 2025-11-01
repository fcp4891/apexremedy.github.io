// frontend/js/checkout.js
// Sistema de checkout con transferencia bancaria - PARTE 1/3

class CheckoutManager {
    constructor() {
        this.cartItems = [];
        this.orderData = null;
        this.paymentMethod = 'transfer';
    }

    // ============================================
    // INICIALIZACIÓN
    // ============================================

    init() {
        this.loadCart();
        this.setupEventListeners();
        this.prefillUserData();
        this.updateOrderSummary();
    }

    loadCart() {
        // Obtener desde el carrito global
        if (typeof cart !== 'undefined' && cart.getItems) {
            this.cartItems = cart.getItems();
        } else {
            // Fallback: localStorage
            const stored = localStorage.getItem('shopping_cart');
            if (stored) {
                try {
                    const data = JSON.parse(stored);
                    this.cartItems = data.items || [];
                } catch (e) {
                    this.cartItems = [];
                }
            }
        }

        // Verificar que hay items
        if (this.cartItems.length === 0) {
            notify.warning('Tu carrito está vacío', 'Carrito Vacío');
            setTimeout(() => {
                window.location.href = './tienda.html';
            }, 2000);
        }
    }

    setupEventListeners() {
        // Método de pago
        const paymentInputs = document.querySelectorAll('input[name="payment"]');
        paymentInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.paymentMethod = e.target.value;
                this.updatePaymentInfo();
            });
        });

        // Formulario
        const form = document.getElementById('checkoutForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.validateAndSubmit();
            });
        }
    }

    prefillUserData() {
        if (typeof authManager !== 'undefined' && authManager.isAuthenticated()) {
            const user = authManager.getCurrentUser();
            
            const fields = {
                'customerName': user.name,
                'customerEmail': user.email,
                'customerPhone': user.phone || '',
                'customerAddress': user.address || ''
            };

            Object.keys(fields).forEach(key => {
                const element = document.getElementById(key);
                if (element && fields[key]) {
                    element.value = fields[key];
                }
            });
        }
    }

    // ============================================
    // VALIDACIÓN Y ENVÍO
    // ============================================

    validateAndSubmit() {
        const form = document.getElementById('checkoutForm');
        
        // Validar términos y condiciones
        const acceptTerms = document.getElementById('acceptTerms');
        if (!acceptTerms || !acceptTerms.checked) {
            notify.error('Debes aceptar los Términos y Condiciones de Envío para continuar', 'Términos Requeridos');
            acceptTerms?.focus();
            return;
        }
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Validar que hay items
        if (this.cartItems.length === 0) {
            notify.error('Tu carrito está vacío', 'Error');
            return;
        }

        this.submitOrder();
    }

    async submitOrder() {
        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Procesando...';

        try {
            // Preparar datos de la orden
            const orderData = {
                customer_name: document.getElementById('customerName').value.trim(),
                customer_email: document.getElementById('customerEmail').value.trim(),
                customer_phone: document.getElementById('customerPhone').value.trim(),
                shipping_address: document.getElementById('customerAddress').value.trim(),
                notes: document.getElementById('orderNotes')?.value.trim() || '',
                payment_method: this.paymentMethod,
                items: this.cartItems.map(item => ({
                    product_id: item.productId,
                    quantity: item.quantity,
                    price: item.price
                }))
            };

            // Enviar a la API
            const response = await api.createOrder(orderData);

            if (response.success) {
                this.orderData = response.data.order;
                
                // Limpiar carrito
                if (typeof cart !== 'undefined' && cart.clearCartSilently) {
                    cart.clearCartSilently();
                }
                localStorage.removeItem('shopping_cart');

                // Mostrar modal según método de pago
                if (this.paymentMethod === 'transfer') {
                    this.showTransferModal();
                } else {
                    this.showSuccessModal();
                }
            } else {
                throw new Error(response.message || 'Error al crear orden');
            }
        } catch (error) {
            notify.error(error.message || 'Error al procesar el pedido', 'Error');
            
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    // ============================================
    // MODALES
    // ============================================

    showTransferModal() {
        // Verificar si ya existe el modal
        let modal = document.getElementById('transferModal');
        
        if (!modal) {
            this.createTransferModal();
            modal = document.getElementById('transferModal');
        }

        // Actualizar datos
        document.getElementById('transferOrderId').textContent = this.orderData.id;
        document.getElementById('transferTotal').textContent = `$${this.orderData.total.toLocaleString('es-CL')}`;
        
        modal.classList.remove('hidden');
    }

    createTransferModal() {
        const modalHTML = `
            <div id="transferModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div class="p-6">
                        <!-- Header -->
                        <div class="text-center mb-6">
                            <div class="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-check-circle text-green-600 text-4xl"></i>
                            </div>
                            <h2 class="text-3xl font-bold text-gray-800 mb-2">¡Pedido Confirmado!</h2>
                            <p class="text-gray-600">Pedido #<span id="transferOrderId" class="font-mono font-bold">${this.orderData.id}</span></p>
                        </div>

                        <!-- Información de Transferencia -->
                        <div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
                            <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                                <i class="fas fa-university text-blue-600 mr-3"></i>
                                Datos para Transferencia
                            </h3>
                            
                            <div class="space-y-3">
                                <div class="flex justify-between items-center p-3 bg-white rounded">
                                    <span class="text-gray-600 font-semibold">Banco:</span>
                                    <span class="font-bold text-gray-800">Banco Estado</span>
                                </div>
                                <div class="flex justify-between items-center p-3 bg-white rounded">
                                    <span class="text-gray-600 font-semibold">Tipo de Cuenta:</span>
                                    <span class="font-bold text-gray-800">Cuenta Corriente</span>
                                </div>
                                <div class="flex justify-between items-center p-3 bg-white rounded">
                                    <span class="text-gray-600 font-semibold">Número de Cuenta:</span>
                                    <span class="font-mono font-bold text-gray-800">12345678-9</span>
                                    <button onclick="copyToClipboard('12345678-9')" class="text-blue-600 hover:text-blue-800 ml-2">
                                        <i class="fas fa-copy"></i>
                                    </button>
                                </div>
                                <div class="flex justify-between items-center p-3 bg-white rounded">
                                    <span class="text-gray-600 font-semibold">RUT:</span>
                                    <span class="font-mono font-bold text-gray-800">76.XXX.XXX-X</span>
                                </div>
                                <div class="flex justify-between items-center p-3 bg-white rounded">
                                    <span class="text-gray-600 font-semibold">Titular:</span>
                                    <span class="font-bold text-gray-800">Apexremedy SpA</span>
                                </div>
                                <div class="flex justify-between items-center p-3 bg-white rounded">
                                    <span class="text-gray-600 font-semibold">Email:</span>
                                    <span class="font-bold text-gray-800">pagos@apexremedy.cl</span>
                                </div>
                            </div>
                        </div>

                        <!-- Monto a Transferir -->
                        <div class="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
                            <div class="flex justify-between items-center">
                                <span class="text-xl font-semibold text-gray-700">Monto a Transferir:</span>
                                <span id="transferTotal" class="text-3xl font-bold text-green-600">$${this.orderData.total.toLocaleString('es-CL')}</span>
                            </div>
                        </div>
                        
                        <!-- Continúa en Parte 2 -->
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    showSuccessModal() {
        const modal = document.getElementById('successModal');
        if (modal) {
            document.getElementById('orderId').textContent = this.orderData.id;
            modal.classList.remove('hidden');
        } else {
            // Redirigir si no existe el modal
            setTimeout(() => {
                window.location.href = './mis-pedidos.html';
            }, 2000);
        }
    }

    // ============================================
    // UI UPDATES
    // ============================================

    updateOrderSummary() {
        const itemsContainer = document.getElementById('orderItems');
        
        if (itemsContainer) {
            itemsContainer.innerHTML = this.cartItems.map(item => `
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">${item.name} x${item.quantity}</span>
                    <span class="font-semibold">$${(item.price * item.quantity).toLocaleString('es-CL')}</span>
                </div>
            `).join('');
        }

        const subtotal = this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = Math.round(subtotal * 0.19);
        const total = subtotal + tax;

        const elements = {
            'summarySubtotal': `$${subtotal.toLocaleString('es-CL')}`,
            'summaryTax': `$${tax.toLocaleString('es-CL')}`,
            'summaryTotal': `$${total.toLocaleString('es-CL')}`
        };

        Object.keys(elements).forEach(key => {
            const element = document.getElementById(key);
            if (element) element.textContent = elements[key];
        });
    }

    updatePaymentInfo() {
        // Mostrar información adicional según método de pago
    }
}

// ============================================
// CONTINUACIÓN DE createTransferModal()
// Esta parte se agrega al HTML generado en la Parte 1
// ============================================

// Modificar el método createTransferModal de la Parte 1
// Reemplazar desde "<!-- Upload Comprobante -->" hasta el final

CheckoutManager.prototype.createTransferModal = function() {
    const modalHTML = `
        <div id="transferModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-6">
                    <!-- Header -->
                    <div class="text-center mb-6">
                        <div class="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-check-circle text-green-600 text-4xl"></i>
                        </div>
                        <h2 class="text-3xl font-bold text-gray-800 mb-2">¡Pedido Confirmado!</h2>
                        <p class="text-gray-600">Pedido #<span id="transferOrderId" class="font-mono font-bold">${this.orderData.id}</span></p>
                    </div>

                    <!-- Información de Transferencia -->
                    <div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
                        <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-university text-blue-600 mr-3"></i>
                            Datos para Transferencia
                        </h3>
                        
                        <div class="space-y-3">
                            <div class="flex justify-between items-center p-3 bg-white rounded">
                                <span class="text-gray-600 font-semibold">Banco:</span>
                                <span class="font-bold text-gray-800">Banco Estado</span>
                            </div>
                            <div class="flex justify-between items-center p-3 bg-white rounded">
                                <span class="text-gray-600 font-semibold">Tipo de Cuenta:</span>
                                <span class="font-bold text-gray-800">Cuenta Corriente</span>
                            </div>
                            <div class="flex justify-between items-center p-3 bg-white rounded">
                                <span class="text-gray-600 font-semibold">Número de Cuenta:</span>
                                <span class="font-mono font-bold text-gray-800">12345678-9</span>
                                <button onclick="copyToClipboard('12345678-9')" class="text-blue-600 hover:text-blue-800 ml-2">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                            <div class="flex justify-between items-center p-3 bg-white rounded">
                                <span class="text-gray-600 font-semibold">RUT:</span>
                                <span class="font-mono font-bold text-gray-800">76.XXX.XXX-X</span>
                            </div>
                            <div class="flex justify-between items-center p-3 bg-white rounded">
                                <span class="text-gray-600 font-semibold">Titular:</span>
                                <span class="font-bold text-gray-800">Apexremedy SpA</span>
                            </div>
                            <div class="flex justify-between items-center p-3 bg-white rounded">
                                <span class="text-gray-600 font-semibold">Email:</span>
                                <span class="font-bold text-gray-800">pagos@apexremedy.cl</span>
                            </div>
                        </div>
                    </div>

                    <!-- Monto a Transferir -->
                    <div class="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
                        <div class="flex justify-between items-center">
                            <span class="text-xl font-semibold text-gray-700">Monto a Transferir:</span>
                            <span id="transferTotal" class="text-3xl font-bold text-green-600">$${this.orderData.total.toLocaleString('es-CL')}</span>
                        </div>
                    </div>
                    ${this.createTransferModalPart2HTML()}
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
};


// ============================================
// FUNCIONES GLOBALES AUXILIARES
// ============================================

// Copiar al portapapeles
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            notify.success('Copiado al portapapeles', '✓ Copiado');
        }).catch(() => {
            notify.warning('No se pudo copiar. Por favor, copia manualmente.');
        });
    } else {
        // Fallback para navegadores antiguos
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            notify.success('Copiado al portapapeles', '✓ Copiado');
        } catch (err) {
            notify.warning('No se pudo copiar. Por favor, copia manualmente.');
        }
        
        document.body.removeChild(textArea);
    }
}

// Manejar subida de comprobante
async function handleProofUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
        notify.error('El archivo no debe superar 5MB', 'Archivo muy grande');
        event.target.value = ''; // Limpiar input
        return;
    }

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
        notify.error('Solo se permiten archivos JPG, PNG o PDF', 'Tipo de archivo inválido');
        event.target.value = ''; // Limpiar input
        return;
    }

    const statusDiv = document.getElementById('uploadStatus');
    statusDiv.classList.remove('hidden');
    statusDiv.innerHTML = `
        <div class="flex items-center justify-center text-blue-600">
            <i class="fas fa-spinner fa-spin mr-2"></i>
            <span>Subiendo comprobante...</span>
        </div>
    `;

    try {
        // Obtener ID de orden del modal
        const orderId = document.getElementById('transferOrderId').textContent;
        
        // Subir archivo
        const result = await uploadProof(orderId, file);
        
        if (result) {
            statusDiv.innerHTML = `
                <div class="bg-green-100 border border-green-300 rounded-lg p-3">
                    <div class="flex items-center text-green-700">
                        <i class="fas fa-check-circle text-xl mr-2"></i>
                        <div>
                            <p class="font-semibold">¡Comprobante subido exitosamente!</p>
                            <p class="text-sm">Verificaremos tu pago pronto.</p>
                        </div>
                    </div>
                </div>
            `;
            notify.success('Comprobante recibido. Verificaremos tu pago en 24-48 horas.', '✅ Éxito');
        }
    } catch (error) {
        statusDiv.innerHTML = `
            <div class="bg-red-100 border border-red-300 rounded-lg p-3">
                <div class="flex items-center text-red-700">
                    <i class="fas fa-times-circle text-xl mr-2"></i>
                    <div>
                        <p class="font-semibold">Error al subir el archivo</p>
                        <p class="text-sm">${error.message}</p>
                    </div>
                </div>
            </div>
        `;
        notify.error('Error al subir comprobante: ' + error.message, 'Error');
        event.target.value = ''; // Limpiar input
    }
}

// Subir comprobante a la API
async function uploadProof(orderId, file) {
    try {
        if (typeof api === 'undefined' || !api.uploadPaymentProof) {
            throw new Error('API no disponible');
        }

        const response = await api.uploadPaymentProof(orderId, file);
        
        if (response.success) {
            return true;
        } else {
            throw new Error(response.message || 'Error al subir comprobante');
        }
    } catch (error) {
        throw error;
    }
}

// Imprimir instrucciones
function printInstructions() {
    // Ocultar elementos innecesarios antes de imprimir
    const hideElements = ['uploadStatus', 'proofUpload'];
    const hideButtons = document.querySelectorAll('button, a[href*="index"], a[href*="pedidos"]');
    
    hideElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    
    hideButtons.forEach(btn => {
        if (btn.onclick && btn.onclick.toString().includes('print')) {
            // Mantener botón de imprimir
        } else {
            btn.style.display = 'none';
        }
    });
    
    window.print();
    
    // Restaurar elementos después de imprimir
    setTimeout(() => {
        hideElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = '';
        });
        
        hideButtons.forEach(btn => {
            btn.style.display = '';
        });
    }, 1000);
}

// Enviar instrucciones por email
async function sendEmailInstructions() {
    try {
        const orderId = document.getElementById('transferOrderId')?.textContent;
        
        if (!orderId) {
            notify.warning('No se pudo obtener el ID de la orden');
            return;
        }

        notify.info('Enviando instrucciones por email...', '📧');
        
        // TODO: Implementar endpoint en backend para enviar email
        // const response = await api.sendOrderEmail(orderId);
        
        // Simulación por ahora
        setTimeout(() => {
            notify.success('Instrucciones enviadas a tu correo electrónico', '✅ Enviado');
        }, 1500);
        
    } catch (error) {
        notify.error('Error al enviar email. Por favor, intenta más tarde.', 'Error');
    }
}

// Método completo createTransferModal() integrado
CheckoutManager.prototype.createTransferModalComplete = function() {
    const modalHTML = `
        <div id="transferModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-6">
                    <!-- Header -->
                    <div class="text-center mb-6">
                        <div class="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-check-circle text-green-600 text-4xl"></i>
                        </div>
                        <h2 class="text-3xl font-bold text-gray-800 mb-2">¡Pedido Confirmado!</h2>
                        <p class="text-gray-600">Pedido #<span id="transferOrderId" class="font-mono font-bold">${this.orderData.id}</span></p>
                    </div>

                    <!-- Información de Transferencia -->
                    <div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
                        <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-university text-blue-600 mr-3"></i>
                            Datos para Transferencia
                        </h3>
                        
                        <div class="space-y-3">
                            <div class="flex justify-between items-center p-3 bg-white rounded">
                                <span class="text-gray-600 font-semibold">Banco:</span>
                                <span class="font-bold text-gray-800">Banco Estado</span>
                            </div>
                            <div class="flex justify-between items-center p-3 bg-white rounded">
                                <span class="text-gray-600 font-semibold">Tipo de Cuenta:</span>
                                <span class="font-bold text-gray-800">Cuenta Corriente</span>
                            </div>
                            <div class="flex justify-between items-center p-3 bg-white rounded">
                                <span class="text-gray-600 font-semibold">Número de Cuenta:</span>
                                <span class="font-mono font-bold text-gray-800">12345678-9</span>
                                <button onclick="copyToClipboard('12345678-9')" class="text-blue-600 hover:text-blue-800 ml-2">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                            <div class="flex justify-between items-center p-3 bg-white rounded">
                                <span class="text-gray-600 font-semibold">RUT:</span>
                                <span class="font-mono font-bold text-gray-800">76.XXX.XXX-X</span>
                            </div>
                            <div class="flex justify-between items-center p-3 bg-white rounded">
                                <span class="text-gray-600 font-semibold">Titular:</span>
                                <span class="font-bold text-gray-800">Apexremedy SpA</span>
                            </div>
                            <div class="flex justify-between items-center p-3 bg-white rounded">
                                <span class="text-gray-600 font-semibold">Email:</span>
                                <span class="font-bold text-gray-800">pagos@apexremedy.cl</span>
                            </div>
                        </div>
                    </div>

                    <!-- Monto a Transferir -->
                    <div class="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
                        <div class="flex justify-between items-center">
                            <span class="text-xl font-semibold text-gray-700">Monto a Transferir:</span>
                            <span id="transferTotal" class="text-3xl font-bold text-green-600">${this.orderData.total.toLocaleString('es-CL')}</span>
                        </div>
                    </div>

                    <!-- Upload Comprobante -->
                    <div class="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-6">
                        <h4 class="font-bold text-gray-800 mb-3 flex items-center">
                            <i class="fas fa-upload text-yellow-600 mr-2"></i>
                            Subir Comprobante de Pago
                        </h4>
                        <p class="text-sm text-gray-600 mb-4">
                            Una vez realizada la transferencia, sube tu comprobante para agilizar el proceso.
                        </p>
                        
                        <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition">
                            <input type="file" id="proofUpload" accept="image/*,.pdf" class="hidden" onchange="handleProofUpload(event)">
                            <label for="proofUpload" class="cursor-pointer block">
                                <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-2"></i>
                                <p class="text-gray-600 font-semibold">Click para seleccionar archivo</p>
                                <p class="text-sm text-gray-400 mt-1">JPG, PNG o PDF (Máx. 5MB)</p>
                            </label>
                            <div id="uploadStatus" class="hidden mt-4"></div>
                        </div>
                    </div>

                    <!-- Instrucciones -->
                    <div class="bg-gray-50 rounded-lg p-4 mb-6">
                        <h4 class="font-semibold text-gray-800 mb-3 flex items-center">
                            <i class="fas fa-info-circle text-blue-600 mr-2"></i>
                            Instrucciones Importantes
                        </h4>
                        <ul class="space-y-2 text-sm text-gray-600">
                            <li class="flex items-start">
                                <i class="fas fa-check text-green-600 mr-2 mt-1 flex-shrink-0"></i>
                                <span>Realiza la transferencia por el monto exacto indicado</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check text-green-600 mr-2 mt-1 flex-shrink-0"></i>
                                <span>Incluye el número de orden (#${this.orderData.id}) en el mensaje</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check text-green-600 mr-2 mt-1 flex-shrink-0"></i>
                                <span>Sube el comprobante para verificación más rápida</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check text-green-600 mr-2 mt-1 flex-shrink-0"></i>
                                <span>Recibirás confirmación por email en 24-48 horas hábiles</span>
                            </li>
                        </ul>
                    </div>

                    <!-- Botones -->
                    <div class="grid grid-cols-2 gap-4">
                        <button onclick="printInstructions()" class="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition">
                            <i class="fas fa-print mr-2"></i>Imprimir
                        </button>
                        <a href="../mis-pedidos.html" class="bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition text-center">
                            <i class="fas fa-list mr-2"></i>Mis Pedidos
                        </a>
                    </div>

                    <div class="mt-4 text-center">
                        <a href="./index.html" class="text-gray-600 hover:text-gray-800">
                            Volver al inicio
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

// Reemplazar el método createTransferModal original
CheckoutManager.prototype.createTransferModal = CheckoutManager.prototype.createTransferModalComplete;

// ============================================
// FUNCIÓN GLOBAL PARA SUBMIT
// ============================================

function submitOrder() {
    // Validar términos y condiciones primero
    const acceptTerms = document.getElementById('acceptTerms');
    if (!acceptTerms || !acceptTerms.checked) {
        notify.error('Debes aceptar los Términos y Condiciones de Envío para continuar', 'Términos Requeridos');
        acceptTerms?.focus();
        acceptTerms?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    
    if (typeof checkoutManager !== 'undefined') {
        checkoutManager.validateAndSubmit();
    } else {
        notify.error('Error al procesar el pedido. Por favor, recarga la página.', 'Error');
    }
}

// ============================================
// CERRAR MODALES
// ============================================

function closeTransferModal() {
    const modal = document.getElementById('transferModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// ============================================
// INICIALIZACIÓN GLOBAL
// ============================================

let checkoutManager;

document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación primero
    if (typeof authManager !== 'undefined' && authManager.isAuthenticated()) {
        // Inicializar checkout
        checkoutManager = new CheckoutManager();
        checkoutManager.init();
    }
});

// ============================================
// UTILIDADES ADICIONALES
// ============================================

// Formatear precio
function formatPrice(price) {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP'
    }).format(price);
}

// Validar email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validar teléfono chileno
function validatePhone(phone) {
    const re = /^(\+?56)?(\s?)(0?9)(\s?)[98765432]\d{7}$/;
    return re.test(phone);
}

// Limpiar número de teléfono
function cleanPhone(phone) {
    return phone.replace(/\s+/g, '').replace(/^(\+?56)?0?/, '+56');
}

// ============================================
// EVENTOS DE TECLADO
// ============================================

document.addEventListener('keydown', (e) => {
    // ESC para cerrar modales
    if (e.key === 'Escape') {
        closeTransferModal();
        closeSuccessModal();
    }
});

// ============================================
// MANEJO DE ERRORES GLOBAL
// ============================================

window.addEventListener('error', (event) => {
    // Error silencioso en producción
});

// ============================================
// PREVENIR SALIDA ACCIDENTAL
// ============================================

let orderCompleted = false;

window.addEventListener('beforeunload', (e) => {
    // Solo prevenir si hay items en el carrito y no se ha completado la orden
    if (checkoutManager && checkoutManager.cartItems.length > 0 && !orderCompleted) {
        e.preventDefault();
        e.returnValue = ''; // Chrome requiere esto
        return '¿Estás seguro de salir? Tu orden no se ha completado.';
    }
});

// Marcar orden como completada después de crear
const originalSubmitOrder = CheckoutManager.prototype.submitOrder;
CheckoutManager.prototype.submitOrder = async function() {
    const result = await originalSubmitOrder.call(this);
    if (result !== false) {
        orderCompleted = true;
    }
    return result;
};

// ============================================
// EXPORTAR PARA MÓDULOS (OPCIONAL)
// ============================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CheckoutManager,
        submitOrder,
        handleProofUpload,
        uploadProof,
        copyToClipboard,
        printInstructions
    };
}

let allOrders = [];
        let filteredOrders = [];
        let currentOrderId = null;

        document.addEventListener('DOMContentLoaded', () => {
            if (!authManager.requireAdmin()) return;
            loadOrders();
            loadCustomers();
        });

        async function loadOrders() {
            try {
                console.log('📦 Cargando todos los pedidos...');
                const response = await api.getAllOrders({ limit: 1000 });
                
                console.log('📊 Respuesta completa:', response);
                console.log('📊 response.success:', response?.success);
                console.log('📊 response.data:', response?.data);
                console.log('📊 response.data.orders:', response?.data?.orders);
                
                if (response && response.success) {
                    allOrders = response.data?.orders || response.data || [];
                    console.log(`✅ ${allOrders.length} pedidos cargados desde API`);
                    
                    if (allOrders.length === 0) {
                        console.warn('⚠️ No se encontraron pedidos en la respuesta');
                        // Mostrar mensaje pero continuar con el flujo
                    }
                    
                    filteredOrders = allOrders.map((order, index) => {
                        const displayOrder = { ...order };
                        
                        // Log del primer pedido para debugging
                        if (index === 0) {
                            console.log('📋 Ejemplo de pedido recibido:', {
                                id: displayOrder.id,
                                customer_name: displayOrder.customer_name,
                                customer_email: displayOrder.customer_email,
                                user_name: displayOrder.user_name,
                                user_email: displayOrder.user_email,
                                customer: displayOrder.customer,
                                user: displayOrder.user,
                                created_at: displayOrder.created_at,
                                date: displayOrder.date,
                                status: displayOrder.status,
                                payment_method: displayOrder.payment_method,
                                total: displayOrder.total
                            });
                        }
                        
                        // Normalizar ID del pedido
                        if (!displayOrder.id && displayOrder.order_id) {
                            displayOrder.id = displayOrder.order_id;
                        }
                        
                        // Normalizar nombre del cliente (múltiples fuentes posibles)
                        if (!displayOrder.customer_name) {
                            if (displayOrder.customer_email) {
                                displayOrder.customer_name = displayOrder.customer_email.split('@')[0];
                            } else if (displayOrder.user_name) {
                                displayOrder.customer_name = displayOrder.user_name;
                            } else if (displayOrder.customer?.name) {
                                displayOrder.customer_name = displayOrder.customer.name;
                            } else if (displayOrder.user?.name) {
                                displayOrder.customer_name = displayOrder.user.name;
                            } else if (displayOrder.customer?.first_name || displayOrder.customer?.last_name) {
                                displayOrder.customer_name = `${displayOrder.customer.first_name || ''} ${displayOrder.customer.last_name || ''}`.trim();
                            } else if (displayOrder.user?.first_name || displayOrder.user?.last_name) {
                                displayOrder.customer_name = `${displayOrder.user.first_name || ''} ${displayOrder.user.last_name || ''}`.trim();
                            } else {
                                displayOrder.customer_name = 'Cliente sin nombre';
                            }
                        }
                        
                        // Normalizar email del cliente
                        if (!displayOrder.customer_email) {
                            displayOrder.customer_email = displayOrder.user_email || 
                                                          displayOrder.customer?.email || 
                                                          displayOrder.user?.email || 
                                                          '';
                        }
                        
                        // Normalizar fecha (múltiples fuentes posibles)
                        if (!displayOrder.created_at) {
                            displayOrder.created_at = displayOrder.date || 
                                                     displayOrder.created_date || 
                                                     displayOrder.order_date ||
                                                     new Date().toISOString();
                        }
                        
                        // Normalizar estado de pago
                        if (displayOrder.status === 'pending_payment' || displayOrder.status === 'pending') {
                            // Normalizar método de pago: 'credit' -> 'credit_card', 'debit' -> 'debit_card'
                            let paymentMethod = displayOrder.payment_method || displayOrder.payment_method_from_payments || 'cash';
                            if (paymentMethod === 'credit') paymentMethod = 'credit_card';
                            if (paymentMethod === 'debit') paymentMethod = 'debit_card';
                            
                            if (paymentMethod === 'transfer') {
                                displayOrder.status = 'pending_transfer';
                            } else if (paymentMethod === 'credit_card') {
                                displayOrder.status = 'pending_credit_card';
                            } else if (paymentMethod === 'debit_card') {
                                displayOrder.status = 'pending_debit_card';
                            } else if (paymentMethod === 'cash' || !paymentMethod) {
                                displayOrder.status = 'pending_cash';
                            }
                        }
                        
                        // Normalizar total
                        if (!displayOrder.total && displayOrder.total_amount) {
                            displayOrder.total = displayOrder.total_amount;
                        }
                        
                        return displayOrder;
                    });
                    
                    console.log(`✅ ${filteredOrders.length} pedidos procesados para mostrar`);
                    
                    // Log de los primeros 3 pedidos procesados para verificar
                    if (filteredOrders.length > 0) {
                        console.log('📋 Primeros 3 pedidos procesados:', filteredOrders.slice(0, 3).map(o => ({
                            id: o.id,
                            customer_name: o.customer_name,
                            customer_email: o.customer_email,
                            created_at: o.created_at,
                            status: o.status,
                            total: o.total
                        })));
                    }
                    
                    updateStatistics();
                    displayOrders(filteredOrders);
                } else {
                    console.error('❌ Respuesta no exitosa:', response);
                    allOrders = [];
                    filteredOrders = [];
                    updateStatistics();
                    displayOrders([]);
                    
                    // Verificar si el mensaje indica JSON vacío
                    if (response?.message?.includes('JSON vacío') || response?.message?.includes('No hay pedidos')) {
                        notify.warning('El archivo orders.json está vacío. Ejecuta el script de exportación: node backend/scripts/export-orders-to-json.js', 'JSON Vacío');
                    } else {
                        notify.warning('No se pudieron cargar los pedidos. Verifica la conexión o el archivo orders.json');
                    }
                }
            } catch (error) {
                console.error('❌ Error al cargar pedidos:', error);
                console.error('❌ Detalles del error:', error.message, error.stack);
                allOrders = [];
                filteredOrders = [];
                updateStatistics();
                displayOrders([]);
                notify.error('Error al cargar pedidos: ' + error.message);
            }
        }

        async function loadCustomers() {
            try {
                const response = await api.getUsers({ role: 'customer' });
                
                if (response.success) {
                    const users = response.data.users || [];
                    const select = document.getElementById('filterCustomer');
                    
                    const customerIds = [...new Set(allOrders.map(o => o.customer_id))];
                    const customers = users.filter(u => customerIds.includes(u.id));
                    
                    customers.forEach(customer => {
                        const option = document.createElement('option');
                        option.value = customer.id;
                        option.textContent = `${customer.name} (${customer.email})`;
                        select.appendChild(option);
                    });
                }
            } catch (error) {
                console.error('Error al cargar clientes:', error);
            }
        }

        function applyFilters() {
            const statusFilter = document.getElementById('filterStatus').value;
            const customerFilter = document.getElementById('filterCustomer').value;
            const dateFrom = document.getElementById('filterDateFrom').value;
            const dateTo = document.getElementById('filterDateTo').value;

            filteredOrders = allOrders.map(order => {
                const displayOrder = { ...order };
                
                // Normalizar ID
                if (!displayOrder.id && displayOrder.order_id) {
                    displayOrder.id = displayOrder.order_id;
                }
                
                // Normalizar nombre del cliente
                if (!displayOrder.customer_name) {
                    if (displayOrder.customer_email) {
                        displayOrder.customer_name = displayOrder.customer_email.split('@')[0];
                    } else if (displayOrder.user_name) {
                        displayOrder.customer_name = displayOrder.user_name;
                    } else if (displayOrder.customer?.name) {
                        displayOrder.customer_name = displayOrder.customer.name;
                    } else if (displayOrder.user?.name) {
                        displayOrder.customer_name = displayOrder.user.name;
                    } else if (displayOrder.customer?.first_name || displayOrder.customer?.last_name) {
                        displayOrder.customer_name = `${displayOrder.customer.first_name || ''} ${displayOrder.customer.last_name || ''}`.trim();
                    } else if (displayOrder.user?.first_name || displayOrder.user?.last_name) {
                        displayOrder.customer_name = `${displayOrder.user.first_name || ''} ${displayOrder.user.last_name || ''}`.trim();
                    } else {
                        displayOrder.customer_name = 'Cliente sin nombre';
                    }
                }
                
                // Normalizar fecha
                if (!displayOrder.created_at) {
                    displayOrder.created_at = displayOrder.date || 
                                             displayOrder.created_date || 
                                             displayOrder.order_date ||
                                             new Date().toISOString();
                }
                
                // Normalizar estado de pago
                if (displayOrder.status === 'pending_payment' || displayOrder.status === 'pending') {
                    const paymentMethod = displayOrder.payment_method || displayOrder.payment_method_from_payments || 'cash';
                    if (paymentMethod === 'transfer') {
                        displayOrder.status = 'pending_transfer';
                    } else if (paymentMethod === 'credit_card' || paymentMethod === 'credit') {
                        displayOrder.status = 'pending_credit_card';
                    } else if (paymentMethod === 'debit_card' || paymentMethod === 'debit') {
                        displayOrder.status = 'pending_debit_card';
                    } else if (paymentMethod === 'cash' || !paymentMethod) {
                        displayOrder.status = 'pending_cash';
                    }
                }
                
                // Normalizar total
                if (!displayOrder.total && displayOrder.total_amount) {
                    displayOrder.total = displayOrder.total_amount;
                }
                
                return displayOrder;
            }).filter(order => {
                if (statusFilter && order.status !== statusFilter) return false;
                if (customerFilter && order.customer_id != customerFilter) return false;
                if (dateFrom) {
                    const orderDate = new Date(order.created_at).toISOString().split('T')[0];
                    if (orderDate < dateFrom) return false;
                }
                if (dateTo) {
                    const orderDate = new Date(order.created_at).toISOString().split('T')[0];
                    if (orderDate > dateTo) return false;
                }
                return true;
            });

            updateStatistics();
            displayOrders(filteredOrders);
            notify.info(`${filteredOrders.length} pedido(s) encontrado(s)`);
        }

        function searchByOrderId() {
            const searchId = document.getElementById('searchOrderId').value.trim();
            
            if (!searchId) {
                notify.warning('Ingresa un ID de pedido');
                return;
            }

            const order = allOrders.find(o => o.id == searchId);
            
            if (order) {
                filteredOrders = [order];
                displayOrders(filteredOrders);
                notify.success('Pedido encontrado');
            } else {
                notify.error('Pedido no encontrado');
                filteredOrders = [];
                displayOrders(filteredOrders);
            }
        }

        function clearFilters() {
            document.getElementById('filterStatus').value = '';
            document.getElementById('filterCustomer').value = '';
            document.getElementById('filterDateFrom').value = '';
            document.getElementById('filterDateTo').value = '';
            document.getElementById('searchOrderId').value = '';
            
            filteredOrders = allOrders.map(order => {
                const displayOrder = { ...order };
                
                // Normalizar ID
                if (!displayOrder.id && displayOrder.order_id) {
                    displayOrder.id = displayOrder.order_id;
                }
                
                // Normalizar nombre del cliente
                if (!displayOrder.customer_name) {
                    if (displayOrder.customer_email) {
                        displayOrder.customer_name = displayOrder.customer_email.split('@')[0];
                    } else if (displayOrder.user_name) {
                        displayOrder.customer_name = displayOrder.user_name;
                    } else if (displayOrder.customer?.name) {
                        displayOrder.customer_name = displayOrder.customer.name;
                    } else if (displayOrder.user?.name) {
                        displayOrder.customer_name = displayOrder.user.name;
                    } else if (displayOrder.customer?.first_name || displayOrder.customer?.last_name) {
                        displayOrder.customer_name = `${displayOrder.customer.first_name || ''} ${displayOrder.customer.last_name || ''}`.trim();
                    } else if (displayOrder.user?.first_name || displayOrder.user?.last_name) {
                        displayOrder.customer_name = `${displayOrder.user.first_name || ''} ${displayOrder.user.last_name || ''}`.trim();
                    } else {
                        displayOrder.customer_name = 'Cliente sin nombre';
                    }
                }
                
                // Normalizar fecha
                if (!displayOrder.created_at) {
                    displayOrder.created_at = displayOrder.date || 
                                             displayOrder.created_date || 
                                             displayOrder.order_date ||
                                             new Date().toISOString();
                }
                
                // Normalizar estado de pago
                if (displayOrder.status === 'pending_payment' || displayOrder.status === 'pending') {
                    const paymentMethod = displayOrder.payment_method || displayOrder.payment_method_from_payments || 'cash';
                    if (paymentMethod === 'transfer') {
                        displayOrder.status = 'pending_transfer';
                    } else if (paymentMethod === 'credit_card' || paymentMethod === 'credit') {
                        displayOrder.status = 'pending_credit_card';
                    } else if (paymentMethod === 'debit_card' || paymentMethod === 'debit') {
                        displayOrder.status = 'pending_debit_card';
                    } else if (paymentMethod === 'cash' || !paymentMethod) {
                        displayOrder.status = 'pending_cash';
                    }
                }
                
                // Normalizar total
                if (!displayOrder.total && displayOrder.total_amount) {
                    displayOrder.total = displayOrder.total_amount;
                }
                
                return displayOrder;
            });
            
            updateStatistics();
            displayOrders(filteredOrders);
            notify.info('Filtros limpiados');
        }

        function updateStatistics() {
            const stats = {
                total: filteredOrders.length,
                pending_transfer: filteredOrders.filter(o => o.status === 'pending_transfer').length,
                pending_cash: filteredOrders.filter(o => o.status === 'pending_cash').length,
                processing: filteredOrders.filter(o => o.status === 'processing').length,
                shipped: filteredOrders.filter(o => o.status === 'shipped').length,
                delivered: filteredOrders.filter(o => o.status === 'delivered').length,
                cancelled: filteredOrders.filter(o => o.status === 'cancelled').length
            };

            document.getElementById('totalOrders').textContent = stats.total;
            document.getElementById('pendingTransferOrders').textContent = stats.pending_transfer;
            document.getElementById('pendingCashOrders').textContent = stats.pending_cash;
            document.getElementById('processingOrders').textContent = stats.processing;
            document.getElementById('deliveredOrders').textContent = stats.delivered;
            document.getElementById('cancelledOrders').textContent = stats.cancelled;
        }

        function displayOrders(orders) {
            const tbody = document.getElementById('ordersTableBody');
            
            if (orders.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="px-6 py-12 text-center">
                            <i class="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
                            <p class="text-gray-600 font-semibold mb-2">No hay pedidos para mostrar</p>
                            <p class="text-sm text-gray-500 mb-4">El archivo orders.json está vacío o no contiene pedidos</p>
                            <div class="text-xs text-gray-400 space-y-1">
                                <p>💡 Para generar orders.json con datos:</p>
                                <p class="font-mono bg-gray-100 p-2 rounded mt-2">node backend/scripts/export-orders-to-json.js</p>
                                <p class="text-xs mt-2">Asegúrate de tener la base de datos en backend/database/apexremedy.db</p>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }

            const statusConfig = {
                pending_transfer: { 
                    class: 'bg-orange-100 text-orange-800 border border-orange-300', 
                    label: 'Pendiente Transferencia',
                    icon: 'fas fa-university'
                },
                pending_cash: { 
                    class: 'bg-amber-100 text-amber-800 border border-amber-300', 
                    label: 'Pendiente Efectivo',
                    icon: 'fas fa-money-bill-wave'
                },
                pending_credit_card: {
                    class: 'bg-indigo-100 text-indigo-800 border border-indigo-300', 
                    label: 'Pendiente Tarjeta Crédito',
                    icon: 'fas fa-credit-card'
                },
                pending_debit_card: {
                    class: 'bg-blue-100 text-blue-800 border border-blue-300', 
                    label: 'Pendiente Tarjeta Débito',
                    icon: 'fas fa-credit-card'
                },
                pending: {
                    class: 'bg-amber-100 text-amber-800 border border-amber-300', 
                    label: 'Pendiente Efectivo',
                    icon: 'fas fa-money-bill-wave'
                },
                pending_payment: {
                    class: 'bg-yellow-100 text-yellow-800 border border-yellow-300', 
                    label: 'Pendiente de Pago',
                    icon: 'fas fa-clock'
                },
                payment_verified: {
                    class: 'bg-teal-100 text-teal-800 border border-teal-300', 
                    label: 'Pago Verificado',
                    icon: 'fas fa-check-double'
                },
                processing: { 
                    class: 'bg-blue-100 text-blue-800 border border-blue-300', 
                    label: 'Procesando',
                    icon: 'fas fa-cog'
                },
                shipped: { 
                    class: 'bg-purple-100 text-purple-800 border border-purple-300', 
                    label: 'Enviado',
                    icon: 'fas fa-shipping-fast'
                },
                delivered: { 
                    class: 'bg-green-100 text-green-800 border border-green-300', 
                    label: 'Entregado',
                    icon: 'fas fa-check-circle'
                },
                cancelled: { 
                    class: 'bg-red-100 text-red-800 border border-red-300', 
                    label: 'Cancelado',
                    icon: 'fas fa-times-circle'
                }
            };

            tbody.innerHTML = orders.map((order, index) => {
                // Validar y normalizar datos del pedido
                const orderId = order.id || order.order_id || `temp-${index}`;
                const customerName = order.customer_name || order.user_name || order.customer?.name || order.user?.name || 'Cliente sin nombre';
                const customerEmail = order.customer_email || order.user_email || order.customer?.email || order.user?.email || '';
                
                // Normalizar fecha
                let orderDate = order.created_at || order.date || order.created_date || new Date().toISOString();
                let formattedDate = 'Fecha no disponible';
                try {
                    const dateObj = new Date(orderDate);
                    if (!isNaN(dateObj.getTime())) {
                        formattedDate = dateObj.toLocaleDateString('es-CL', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric'
                        });
                    } else {
                        console.warn(`⚠️ Fecha inválida para pedido ${orderId}:`, orderDate);
                    }
                } catch (error) {
                    console.error(`❌ Error formateando fecha para pedido ${orderId}:`, error);
                }
                
                // Normalizar estado según método de pago
                let orderStatus = order.status || 'pending';
                if (orderStatus === 'pending_payment' || orderStatus === 'pending') {
                    // Normalizar método de pago: 'credit' -> 'credit_card', 'debit' -> 'debit_card'
                    let paymentMethod = order.payment_method || order.payment_method_from_payments || 'cash';
                    if (paymentMethod === 'credit') paymentMethod = 'credit_card';
                    if (paymentMethod === 'debit') paymentMethod = 'debit_card';
                    
                    if (paymentMethod === 'transfer') {
                        orderStatus = 'pending_transfer';
                    } else if (paymentMethod === 'credit_card') {
                        orderStatus = 'pending_credit_card';
                    } else if (paymentMethod === 'debit_card') {
                        orderStatus = 'pending_debit_card';
                    } else if (paymentMethod === 'cash' || !paymentMethod) {
                        orderStatus = 'pending_cash';
                    }
                }
                
                // Obtener configuración de estado
                const status = statusConfig[orderStatus] || { 
                    class: 'bg-gray-100 text-gray-800 border border-gray-300', 
                    label: orderStatus || 'Desconocido',
                    icon: 'fas fa-question-circle'
                };
                
                // Determinar clase del botón de acción según el estado
                let actionBtnClass = 'admin-icon-btn admin-icon-btn--primary';
                
                if (orderStatus === 'pending_transfer' || orderStatus === 'pending_cash' || orderStatus === 'pending' || orderStatus === 'pending_payment') {
                    actionBtnClass = 'admin-icon-btn admin-icon-btn--warning';
                } else if (orderStatus === 'payment_verified' || orderStatus === 'delivered') {
                    actionBtnClass = 'admin-icon-btn admin-icon-btn--success';
                } else if (orderStatus === 'cancelled') {
                    actionBtnClass = 'admin-icon-btn admin-icon-btn--danger';
                }
                
                // Normalizar total
                const orderTotal = order.total || order.total_amount || 0;
                
                // Determinar qué botón mostrar según el estado
                const isPendingPayment = orderStatus === 'pending_transfer' || orderStatus === 'pending_cash' || orderStatus === 'pending' || orderStatus === 'pending_payment';
                
                return `
                    <tr class="border-b hover:bg-gray-50">
                        <td class="px-6 py-4 font-semibold text-gray-800">#${orderId}</td>
                        <td class="px-6 py-4">
                            <div class="text-sm">
                                <p class="font-medium text-gray-800">${customerName}</p>
                                ${customerEmail ? `<p class="text-gray-500 text-xs">${customerEmail}</p>` : ''}
                            </div>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-600">${formattedDate}</td>
                        <td class="px-6 py-4 font-bold text-green-600">${Utils.formatPrice(orderTotal)}</td>
                        <td class="px-6 py-4">
                            <span class="px-3 py-1 rounded-full text-xs font-semibold ${status.class} inline-flex items-center gap-1.5">
                                <i class="${status.icon}"></i>
                                ${status.label}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-center">
                            ${
                                isPendingPayment
                                ? `
                                    <button class="${actionBtnClass}" title="Revisar pago"
                                            data-action="open-transfer-review"
                                            data-order-id="${orderId}">
                                        <i class="fas fa-search-dollar"></i>
                                    </button>
                                `
                                : `
                                    <button class="${actionBtnClass}" title="Ver detalles"
                                            data-action="view-order-details"
                                            data-order-id="${orderId}">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                `
                            }
                        </td>
                    </tr>
                `;
            }).join('');
        }

        async function viewOrderDetails(orderId) {
            currentOrderId = orderId;
            
            // Si no hay backend, mostrar mensaje de modo QA
            if (!api.baseURL) {
                notify.warning('⚠️ Modo QA: La vista detallada de pedidos solo está disponible en entorno local con backend.');
                return;
            }
            
            try {
                const response = await api.request(`/orders/${orderId}`);
                
                if (response.success) {
                    const order = response.data.order;
                    
                    document.getElementById('modalOrderId').textContent = order.id;
                    document.getElementById('modalCustomer').textContent = order.customer_name;
                    document.getElementById('modalDate').textContent = new Date(order.created_at).toLocaleString('es-CL');
                    
                    let backendStatus = order.status;
                    const validBackendStates = ['pending_payment', 'payment_verified', 'processing', 'shipped', 'delivered', 'cancelled'];
                    
                    if (!validBackendStates.includes(backendStatus)) {
                        if (backendStatus === 'pending_transfer' || backendStatus === 'pending_cash') {
                            backendStatus = 'pending_payment';
                        }
                    }
                    
                    document.getElementById('modalStatusSelect').value = backendStatus;
                    
                    const itemsHtml = order.items.map(item => `
                        <tr class="border-b">
                            <td class="py-2">${item.product_name}</td>
                            <td class="text-right">${item.quantity}</td>
                            <td class="text-right">${Utils.formatPrice(item.price)}</td>
                            <td class="text-right font-semibold">${Utils.formatPrice(item.quantity * item.price)}</td>
                        </tr>
                    `).join('');
                    
                    document.getElementById('modalItems').innerHTML = itemsHtml;
                    
                    const subtotal = order.total / 1.19;
                    const tax = order.total - subtotal;
                    
                    document.getElementById('modalSubtotal').textContent = Utils.formatPrice(subtotal);
                    document.getElementById('modalTax').textContent = Utils.formatPrice(tax);
                    document.getElementById('modalTotal').textContent = Utils.formatPrice(order.total);
                    
                    document.getElementById('orderModal').classList.remove('hidden');
                }
            } catch (error) {
                console.error('❌ Error al cargar detalles:', error);
                notify.error('Error al cargar detalles: ' + error.message);
            }
        }

        function closeModal() {
            document.getElementById('orderModal').classList.add('hidden');
            currentOrderId = null;
        }

        async function updateOrderStatus() {
            // Si no hay backend, mostrar mensaje de modo QA
            if (!api.baseURL) {
                notify.warning('⚠️ Modo QA: No se pueden modificar pedidos. Los cambios solo se aplican en entorno local con backend.');
                return;
            }
            if (!currentOrderId) return;

            const newStatus = document.getElementById('modalStatusSelect').value;

            try {
                const response = await api.request(`/orders/${currentOrderId}/status`, {
                    method: 'PATCH',
                    body: JSON.stringify({ status: newStatus })
                });

                if (response.success) {
                    notify.success('Estado actualizado correctamente');
                    closeModal();
                    await loadOrders();
                }
            } catch (error) {
                console.error('❌ Error al actualizar estado:', error);
                notify.error('Error al actualizar estado: ' + error.message);
            }
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
                hideRejectModal();
                hideReviewModal();
            }
        });

        document.getElementById('orderModal').addEventListener('click', (e) => {
            if (e.target.id === 'orderModal') closeModal();
        });

async function openTransferReview(orderId) {
  try {
    // Si no hay backend, obtener pedido desde orders.json
    let res;
    let o;
    
    if (!api.baseURL) {
      // Modo estático: buscar pedido en orders.json
      try {
        const staticData = await api.loadStaticJSON('orders.json');
        if (staticData && staticData.success && staticData.data) {
          const orders = staticData.data.orders || staticData.data || [];
          o = orders.find(order => order.id === parseInt(orderId) || order.id === String(orderId));
          if (o) {
            console.log('✅ Pedido encontrado en JSON estático:', o.id);
            res = { success: true, data: { order: o } };
          } else {
            throw new Error(`Pedido con ID ${orderId} no encontrado`);
          }
        } else {
          throw new Error('No se pudieron cargar pedidos desde JSON estático');
        }
      } catch (jsonError) {
        console.error('Error al cargar pedido desde JSON estático:', jsonError);
        notify.warning('⚠️ Modo QA: No se pueden modificar pedidos. Los datos están en modo lectura.');
        // Intentar buscar en allOrders si ya están cargados
        o = allOrders.find(order => order.id === parseInt(orderId) || order.id === String(orderId));
        if (!o) {
          notify.error('No se pudo cargar el pedido');
          return;
        }
        res = { success: true, data: { order: o } };
      }
    } else {
      // Modo con backend: usar API dinámica
      res = await api.request(`/orders/${orderId}`);
      o = res?.data?.order;
    }
    
    if (!o) {
      notify.error('No se pudo cargar el pedido');
      return;
    }

    let normalizedStatus = o.status;
    // Normalizar método de pago: 'credit' -> 'credit_card', 'debit' -> 'debit_card'
    let effectivePaymentMethod = o.payment_method || o.payment_method_from_payments || 'cash';
    if (effectivePaymentMethod === 'credit') effectivePaymentMethod = 'credit_card';
    if (effectivePaymentMethod === 'debit') effectivePaymentMethod = 'debit_card';
    
    if (o.status === 'pending' || o.status === 'pending_payment') {
        if (effectivePaymentMethod === 'transfer') {
            normalizedStatus = 'pending_transfer';
            effectivePaymentMethod = 'transfer';
        } else if (effectivePaymentMethod === 'credit_card') {
            normalizedStatus = 'pending_credit_card';
            effectivePaymentMethod = 'credit_card';
        } else if (effectivePaymentMethod === 'debit_card') {
            normalizedStatus = 'pending_debit_card';
            effectivePaymentMethod = 'debit_card';
        } else if (effectivePaymentMethod === 'cash' || !effectivePaymentMethod) {
            normalizedStatus = 'pending_cash';
            effectivePaymentMethod = 'cash';
        }
    }
    
    if (o.status === 'pending' && !effectivePaymentMethod) {
        normalizedStatus = 'pending_cash';
        effectivePaymentMethod = 'cash';
    }

    const paymentMethodText =
      effectivePaymentMethod === 'cash' ? 'Efectivo' :
      effectivePaymentMethod === 'transfer' ? 'Transferencia' :
      effectivePaymentMethod === 'credit_card' ? 'Tarjeta Crédito' :
      effectivePaymentMethod === 'debit_card' ? 'Tarjeta Débito' :
      'Efectivo (por defecto)';

    document.getElementById('reviewTransferId').value = o.id;
    document.getElementById('reviewInfo').innerHTML = `
      <div class="flex justify-between"><strong>Pedido:</strong> <span>#${o.id}</span></div>
      <div class="flex justify-between"><strong>Cliente:</strong> <span>${o.customer_name || o.user_name || ''}</span></div>
      <div class="flex justify-between"><strong>Fecha:</strong> <span>${new Date(o.created_at).toLocaleString('es-CL')}</span></div>
      <div class="flex justify-between"><strong>Monto:</strong> <span class="font-bold text-green-600">${(o.total || 0).toLocaleString('es-CL',{style:'currency',currency:'CLP'})}</span></div>
      <div class="flex justify-between"><strong>Método de pago:</strong> <span>${paymentMethodText}</span></div>
      <div class="flex justify-between"><strong>Estado:</strong> <span class="font-semibold">${normalizedStatus}</span></div>
    `;

    const link = document.getElementById('reviewReceiptLink');
    const linkText = document.getElementById('reviewReceiptText');
    const approveBtn = document.getElementById('approveButton');
    const rejectBtn = document.getElementById('rejectButton');
    const modalIcon = document.getElementById('reviewModalIcon');
    const modalTitle = document.getElementById('reviewModalTitle');
    const paymentLabel = document.getElementById('reviewPaymentTypeLabel');

    link.classList.remove('pointer-events-none', 'text-gray-400');
    link.removeAttribute('title');

    if (effectivePaymentMethod === 'transfer') {
      modalIcon.className = 'fas fa-university mr-3';
      modalTitle.textContent = 'Revisión de Transferencia';
      paymentLabel.textContent = 'Comprobante de Transferencia';
      
      if (o.payment_proof) {
        link.href = o.payment_proof;
        linkText.textContent = 'Ver comprobante adjunto';
      } else {
        link.href = '#';
        linkText.textContent = 'Sin comprobante adjunto';
        link.classList.add('pointer-events-none', 'text-gray-400');
        link.title = 'Aún no se adjunta comprobante';
      }

      approveBtn.querySelector('span').textContent = 'Aprobar Transferencia';
      approveBtn.disabled = !o.payment_proof;
      approveBtn.title = o.payment_proof ? '' : 'Adjunte comprobante para aprobar';
      approveBtn.className = o.payment_proof 
        ? 'px-5 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold transition flex items-center gap-2'
        : 'px-5 py-2.5 bg-gray-300 text-gray-500 rounded-lg font-semibold flex items-center gap-2 cursor-not-allowed';
      
      rejectBtn.querySelector('span').textContent = 'Rechazar';
      rejectBtn.disabled = false;
      rejectBtn.className = 'px-5 py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold transition flex items-center gap-2';

    } else {
      modalIcon.className = 'fas fa-money-bill-wave mr-3';
      modalTitle.textContent = 'Revisión de Pago en Efectivo';
      paymentLabel.textContent = 'Información de Pago';
      
      link.href = '#';
      linkText.textContent = 'Pago en efectivo al momento de entrega';
      link.classList.add('pointer-events-none', 'text-gray-400');

      const canApprove = (
        normalizedStatus === 'pending_cash' || 
        o.status === 'pending' || 
        (o.status === 'pending_payment' && effectivePaymentMethod === 'cash')
      );
      
      approveBtn.querySelector('span').textContent = 'Confirmar Pago Efectivo';
      approveBtn.disabled = !canApprove;
      approveBtn.title = canApprove ? 'Confirmar que se recibió el pago en efectivo' : 'Este pedido no está pendiente de pago';
      approveBtn.className = canApprove
        ? 'px-5 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-semibold transition flex items-center gap-2'
        : 'px-5 py-2.5 bg-gray-300 text-gray-500 rounded-lg font-semibold flex items-center gap-2 cursor-not-allowed';
      
      rejectBtn.querySelector('span').textContent = 'Rechazar';
      rejectBtn.disabled = !canApprove;
      rejectBtn.title = canApprove ? 'Rechazar este pedido' : 'No se puede rechazar este pedido';
      rejectBtn.className = canApprove
        ? 'px-5 py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold transition flex items-center gap-2'
        : 'px-5 py-2.5 bg-gray-300 text-gray-500 rounded-lg font-semibold flex items-center gap-2 cursor-not-allowed';
    }

    document.getElementById('reviewModal').classList.remove('hidden');
  } catch (e) {
    console.error(e);
    notify.error('No se pudo cargar el pedido');
  }
}
    
function hideReviewModal(){ 
    document.getElementById('reviewModal').classList.add('hidden'); 
}

function closeReviewModal(e){ 
    if (e.target.id === 'reviewModal') hideReviewModal(); 
}

let currentRejectOrderId = null;

async function validateTransfer(approved){
    const orderId = document.getElementById('reviewTransferId').value;
    
    // Si no hay backend, mostrar mensaje de modo QA
    if (!api.baseURL) {
        notify.warning('⚠️ Modo QA: No se pueden modificar pedidos. Los cambios solo se aplican en entorno local con backend.');
        hideReviewModal();
        return;
    }
    
    if (!approved) {
        currentRejectOrderId = orderId;
        document.getElementById('rejectModal').classList.remove('hidden');
        return;
    }
    
    try {
        const res = await api.request(`/orders/${orderId}/confirm-payment`, { 
            method: 'POST' 
        });

        if (res?.success) {
            notify.success('Pago confirmado correctamente');
            hideReviewModal();
            await loadOrders();
        } else {
            throw new Error(res?.message || 'No se pudo actualizar');
        }
    } catch (e) {
        console.error(e);
        notify.error('Error al confirmar pago: ' + e.message);
    }
}

async function confirmReject() {
    const orderId = currentRejectOrderId;
    const reasonInput = document.getElementById('rejectReason').value.trim();
    const reason = reasonInput || 'Rechazado por administrador';
    
    // Si no hay backend, mostrar mensaje de modo QA
    if (!api.baseURL) {
        notify.warning('⚠️ Modo QA: No se pueden modificar pedidos. Los cambios solo se aplican en entorno local con backend.');
        hideRejectModal();
        hideReviewModal();
        return;
    }
    
    try {
        const res = await api.request(`/orders/${orderId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ 
                status: 'cancelled'
            })
        });

        if (res?.success) {
            notify.success(`Pedido cancelado correctamente`);
            hideRejectModal();
            hideReviewModal();
            await loadOrders();
        } else {
            throw new Error(res?.message || 'No se pudo cancelar el pedido');
        }
    } catch (e) {
        console.error('❌ Error al cancelar:', e);
        notify.error('Error al cancelar pedido: ' + e.message);
    }
}

function hideRejectModal() {
    document.getElementById('rejectModal').classList.add('hidden');
    document.getElementById('rejectReason').value = '';
    currentRejectOrderId = null;
}

document.addEventListener('DOMContentLoaded', () => {
    const statusFilter = document.getElementById('filterStatus');
    const customerFilter = document.getElementById('filterCustomer');
    const dateFrom = document.getElementById('filterDateFrom');
    const dateTo = document.getElementById('filterDateTo');
    const searchInput = document.getElementById('searchOrderId');

    const registerFilter = (element) => {
        if (element) {
            element.addEventListener('change', applyFilters);
        }
    };

    registerFilter(statusFilter);
    registerFilter(customerFilter);
    registerFilter(dateFrom);
    registerFilter(dateTo);

    if (searchInput) {
        searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                searchByOrderId();
            }
        });
    }
});

document.addEventListener('click', (event) => {
    const stopNode = event.target.closest('[data-stop-propagation]');
    if (stopNode) {
        event.stopPropagation();
    }

    const actionNode = event.target.closest('[data-action]');
    if (!actionNode) {
        return;
    }

    const action = actionNode.dataset.action;
    if (!action) {
        return;
    }

    switch (action) {
        case 'refresh-orders':
            loadOrders();
            break;
        case 'search-order-id':
            searchByOrderId();
            break;
        case 'clear-filters':
            clearFilters();
            break;
        case 'open-transfer-review':
            openTransferReview(actionNode.dataset.orderId);
            break;
        case 'view-order-details':
            viewOrderDetails(actionNode.dataset.orderId);
            break;
        case 'close-order-modal':
            closeModal();
            break;
        case 'update-order-status':
            updateOrderStatus();
            break;
        case 'review-overlay':
            hideReviewModal();
            break;
        case 'hide-review-modal':
            hideReviewModal();
            break;
        case 'validate-transfer':
            validateTransfer(actionNode.dataset.approved === 'true');
            break;
        case 'reject-overlay':
            hideRejectModal();
            break;
        case 'hide-reject-modal':
            hideRejectModal();
            break;
        case 'confirm-reject':
            confirmReject();
            break;
        default:
            break;
    }
});
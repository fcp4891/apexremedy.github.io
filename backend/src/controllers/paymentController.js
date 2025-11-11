// ============================================
// CONTROLADOR: Payments
// ============================================

const PaymentModel = require('../models/Payment');
const Payment = new PaymentModel();

/**
 * GET /api/payments
 * Listar pagos con filtros
 */
exports.getPayments = async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            method: req.query.method,
            provider_id: req.query.provider_id,
            order_id: req.query.order_id,
            customer_id: req.query.customer_id,
            date_from: req.query.date_from,
            date_to: req.query.date_to,
            amount_min: req.query.amount_min,
            amount_max: req.query.amount_max,
            limit: req.query.limit || 50,
            offset: req.query.offset || 0
        };

        const payments = await Payment.findAllWithFilters(filters);
        const stats = await Payment.getStats(filters);

        res.json({
            success: true,
            data: payments,
            stats,
            pagination: {
                limit: parseInt(filters.limit),
                offset: parseInt(filters.offset),
                total: stats.total
            }
        });
    } catch (error) {
        console.error('Error al obtener pagos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pagos',
            error: error.message
        });
    }
};

/**
 * GET /api/payments/:id
 * Obtener pago por ID
 */
exports.getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findByIdWithDetails(req.params.id);
        
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Pago no encontrado'
            });
        }

        res.json({
            success: true,
            data: payment
        });
    } catch (error) {
        console.error('Error al obtener pago:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pago',
            error: error.message
        });
    }
};

/**
 * PATCH /api/payments/:id
 * Actualizar pago (solo campos operativos)
 */
exports.updatePayment = async (req, res) => {
    try {
        const { notes, tags, risk_score } = req.body;
        
        const allowedFields = {};
        if (notes !== undefined) allowedFields.notes = notes;
        if (tags !== undefined) allowedFields.tags = tags;
        if (risk_score !== undefined) allowedFields.risk_score = risk_score;

        const payment = await Payment.update(req.params.id, allowedFields);

        res.json({
            success: true,
            data: payment,
            message: 'Pago actualizado correctamente'
        });
    } catch (error) {
        console.error('Error al actualizar pago:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar pago',
            error: error.message
        });
    }
};

/**
 * POST /api/payments/:id/capture
 * Capturar pago autorizado
 */
exports.capturePayment = async (req, res) => {
    try {
        const payment = await Payment.capture(req.params.id);

        res.json({
            success: true,
            data: payment,
            message: 'Pago capturado correctamente'
        });
    } catch (error) {
        console.error('Error al capturar pago:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error al capturar pago'
        });
    }
};

/**
 * POST /api/payments/:id/void
 * Anular pago
 */
exports.voidPayment = async (req, res) => {
    try {
        const payment = await Payment.void(req.params.id);

        res.json({
            success: true,
            data: payment,
            message: 'Pago anulado correctamente'
        });
    } catch (error) {
        console.error('Error al anular pago:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error al anular pago'
        });
    }
};

/**
 * POST /api/payments/:id/retry
 * Reintentar pago fallido
 */
exports.retryPayment = async (req, res) => {
    try {
        const payment = await Payment.retry(req.params.id, req.body);

        res.json({
            success: true,
            data: payment,
            message: 'Pago reiniciado para reintentar'
        });
    } catch (error) {
        console.error('Error al reintentar pago:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error al reintentar pago'
        });
    }
};

/**
 * GET /api/payments/metrics/dashboard
 * Obtener métricas completas del dashboard de pagos
 */
exports.getPaymentMetrics = async (req, res) => {
    try {
        const { date_from, date_to } = req.query;
        const db = Payment.db;

        // Construir filtros de fecha
        let dateFilterPayments = '';
        let dateFilterRefunds = '';
        let dateFilterOrders = '';
        let dateFilterGiftCards = '';
        const params = [];
        const refundParams = [];
        const orderParams = [];
        const giftCardParams = [];
        
        if (date_from) {
            dateFilterPayments += ' AND DATE(p.created_at) >= ?';
            dateFilterRefunds += ' AND DATE(r.created_at) >= ?';
            dateFilterOrders += ' AND DATE(o.created_at) >= ?';
            dateFilterGiftCards += ' AND DATE(gc.issued_at) >= ?';
            params.push(date_from);
            refundParams.push(date_from);
            orderParams.push(date_from);
            giftCardParams.push(date_from);
        }
        if (date_to) {
            dateFilterPayments += ' AND DATE(p.created_at) <= ?';
            dateFilterRefunds += ' AND DATE(r.created_at) <= ?';
            dateFilterOrders += ' AND DATE(o.created_at) <= ?';
            dateFilterGiftCards += ' AND DATE(gc.issued_at) <= ?';
            params.push(date_to);
            refundParams.push(date_to);
            orderParams.push(date_to);
            giftCardParams.push(date_to);
        }

        // 1. Métricas Financieras Clave
        // GMV (Gross Merchandise Value) - Total vendido antes de descuentos/refunds
        let gmvResult = { gmv: 0, total_payments: 0 };
        try {
            const gmvQuery = `
                SELECT 
                    COALESCE(SUM(p.amount_gross), 0) as gmv,
                    COUNT(*) as total_payments
                FROM payments p
                WHERE p.status IN ('captured', 'authorized') ${dateFilterPayments}
            `;
            gmvResult = await db.get(gmvQuery, params) || gmvResult;
        } catch (error) {
            console.warn('⚠️ Error en consulta GMV:', error.message);
        }

        // Ingresos netos (Ventas - Reembolsos - Descuentos)
        const netRevenueQuery = `
            SELECT 
                COALESCE(SUM(p.amount_net), 0) as net_revenue,
                COALESCE(SUM(p.amount_gross), 0) as gross_revenue
            FROM payments p
            WHERE p.status = 'captured' ${dateFilterPayments}
        `;
        let netRevenueResult;
        try {
            netRevenueResult = await db.get(netRevenueQuery, params) || { net_revenue: 0, gross_revenue: 0 };
        } catch (error) {
            console.warn('⚠️ Error en consulta ingresos netos:', error.message);
            netRevenueResult = { net_revenue: 0, gross_revenue: 0 };
        }

        // Reembolsos
        let refundResult = { total_refunds: 0, refund_count: 0, processed_refunds: 0 };
        try {
            const refundsTableExists = await db.get(
                `SELECT name FROM sqlite_master WHERE type='table' AND name='refunds'`
            );
            if (refundsTableExists) {
                const refundQuery = `
                    SELECT 
                        COALESCE(SUM(r.amount), 0) as total_refunds,
                        COUNT(*) as refund_count,
                        COUNT(CASE WHEN r.status = 'processed' THEN 1 END) as processed_refunds
                    FROM refunds r
                    WHERE 1=1 ${dateFilterRefunds}
                `;
                refundResult = await db.get(refundQuery, refundParams) || refundResult;
            }
        } catch (error) {
            console.warn('⚠️ Error en consulta reembolsos:', error.message);
        }

        // Tasa de reembolsos
        const refundRate = gmvResult.total_payments > 0 
            ? (refundResult.refund_count / gmvResult.total_payments) * 100 
            : 0;

        // Costo por reembolso (comisiones + logística)
        // Buscar comisiones de reembolsos y calcular costo promedio
        let refundCostResult = { total_refund_amount: 0, refund_count: 0, total_fees: 0 };
        try {
            const refundsTableExists = await db.get(
                `SELECT name FROM sqlite_master WHERE type='table' AND name='refunds'`
            );
            if (refundsTableExists) {
                // Verificar si la columna fee existe
                const tableInfo = await db.all(`PRAGMA table_info(refunds)`);
                const hasFeeColumn = tableInfo.some(col => col.name === 'fee');
                
                let refundCostQuery;
                if (hasFeeColumn) {
                    refundCostQuery = `
                        SELECT 
                            COALESCE(SUM(r.amount), 0) as total_refund_amount,
                            COUNT(*) as refund_count,
                            COALESCE(SUM(COALESCE(r.fee, 0)), 0) as total_fees
                        FROM refunds r
                        WHERE r.status = 'processed' ${dateFilterRefunds}
                    `;
                } else {
                    // Si no hay columna fee, estimar como 5% del monto del reembolso (comisión típica)
                    refundCostQuery = `
                        SELECT 
                            COALESCE(SUM(r.amount), 0) as total_refund_amount,
                            COUNT(*) as refund_count,
                            COALESCE(SUM(r.amount * 0.05), 0) as total_fees
                        FROM refunds r
                        WHERE r.status = 'processed' ${dateFilterRefunds}
                    `;
                }
                refundCostResult = await db.get(refundCostQuery, refundParams) || refundCostResult;
            }
        } catch (error) {
            console.warn('⚠️ Error en consulta costo reembolsos:', error.message);
        }
        const avgRefundCost = refundCostResult.refund_count > 0
            ? (refundCostResult.total_fees / refundCostResult.refund_count)
            : 0;

        // Ingresos por método de pago
        let paymentMethods = [];
        try {
            const paymentMethodQuery = `
                SELECT 
                    p.method,
                    COUNT(*) as count,
                    COALESCE(SUM(p.amount_gross), 0) as total_amount,
                    COALESCE(SUM(p.amount_net), 0) as net_amount
                FROM payments p
                WHERE p.status = 'captured' ${dateFilterPayments}
                GROUP BY p.method
            `;
            paymentMethods = await db.all(paymentMethodQuery, params) || [];
        } catch (error) {
            console.warn('⚠️ Error en consulta métodos de pago:', error.message);
        }

        // Tasa de Aprobación de Pagos
        let approvalResult = { total_attempts: 0, successful: 0, failed: 0, authorized: 0 };
        try {
            const approvalQuery = `
                SELECT 
                    COUNT(*) as total_attempts,
                    COUNT(CASE WHEN status = 'captured' THEN 1 END) as successful,
                    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
                    COUNT(CASE WHEN status = 'authorized' THEN 1 END) as authorized
                FROM payments
                WHERE 1=1 ${dateFilterPayments.replace('p.created_at', 'created_at')}
            `;
            approvalResult = await db.get(approvalQuery, params) || approvalResult;
        } catch (error) {
            console.warn('⚠️ Error en consulta aprobación:', error.message);
        }
        const approvalRate = approvalResult.total_attempts > 0 
            ? (approvalResult.successful / approvalResult.total_attempts) * 100 
            : 0;

        // 2. Métricas de Conversión
        // AOV (Average Order Value)
        let aovResult = { aov: 0, total_orders: 0, total_revenue: 0 };
        try {
            const ordersTableExists = await db.get(
                `SELECT name FROM sqlite_master WHERE type='table' AND name='orders'`
            );
            if (ordersTableExists) {
                const aovQuery = `
                    SELECT 
                        AVG(o.total) as aov,
                        COUNT(*) as total_orders,
                        SUM(o.total) as total_revenue
                    FROM orders o
                    WHERE o.status != 'cancelled' ${dateFilterOrders}
                `;
                aovResult = await db.get(aovQuery, orderParams) || aovResult;
            }
        } catch (error) {
            console.warn('⚠️ Error en consulta AOV:', error.message);
        }

        // Conversión (Compras / Sesiones - aproximado con órdenes)
        // Sesiones estimadas: usar órdenes iniciadas vs completadas
        let conversionResult = { completed_orders: 0, abandoned_checkouts: 0 };
        try {
            const ordersTableExists = await db.get(
                `SELECT name FROM sqlite_master WHERE type='table' AND name='orders'`
            );
            if (ordersTableExists) {
                const conversionQuery = `
                    SELECT 
                        COUNT(*) as completed_orders,
                        COUNT(CASE WHEN status = 'pending_payment' THEN 1 END) as abandoned_checkouts
                    FROM orders
                    WHERE 1=1 ${dateFilterOrders.replace('o.created_at', 'created_at')}
                `;
                conversionResult = await db.get(conversionQuery, orderParams) || conversionResult;
            }
        } catch (error) {
            console.warn('⚠️ Error en consulta conversión:', error.message);
        }
        const totalCheckouts = conversionResult.completed_orders + conversionResult.abandoned_checkouts;
        const conversionRate = totalCheckouts > 0 
            ? (conversionResult.completed_orders / totalCheckouts) * 100 
            : 0;

        // Lifetime Value (LTV) - Promedio gasto x cliente x recurrencia
        // Calculado como: promedio de gasto total por cliente que ha hecho múltiples compras
        let avgLTV = 0;
        try {
            const ordersTableExists = await db.get(
                `SELECT name FROM sqlite_master WHERE type='table' AND name='orders'`
            );
            if (ordersTableExists) {
                const ltvQuery = `
                    SELECT 
                        o.user_id,
                        COUNT(DISTINCT o.id) as order_count,
                        SUM(o.total) as total_spent
                    FROM orders o
                    WHERE o.status != 'cancelled' ${dateFilterOrders}
                    GROUP BY o.user_id
                    HAVING COUNT(DISTINCT o.id) > 1
                `;
                const ltvData = await db.all(ltvQuery, orderParams) || [];
                avgLTV = ltvData.length > 0
                    ? ltvData.reduce((sum, c) => sum + (c.total_spent / c.order_count), 0) / ltvData.length
                    : 0;
            }
        } catch (error) {
            console.warn('⚠️ Error en consulta LTV:', error.message);
        }

        // CAC (Costo de Adquisición de Cliente) - Por ahora se estima como 0
        // En un sistema completo, esto vendría de datos de marketing
        const cac = 0; // TODO: Implementar tracking de CAC desde campañas de marketing
        const ltvCacRatio = cac > 0 ? (avgLTV / cac) : 0;

        // 3. Gift Cards
        let giftCardResult = { total_gift_cards: 0, active_cards: 0, used_cards: 0, total_issued: 0, total_unused: 0, total_used: 0 };
        try {
            const giftCardsTableExists = await db.get(
                `SELECT name FROM sqlite_master WHERE type='table' AND name='gift_cards'`
            );
            if (giftCardsTableExists) {
                // Si no hay filtro de fecha, obtener todas las gift cards
                // Si hay filtro, solo las que tienen issued_at en ese rango
                let giftCardWhereClause = '1=1';
                if (date_from || date_to) {
                    giftCardWhereClause += dateFilterGiftCards;
                }
                
                const giftCardQuery = `
                    SELECT 
                        COUNT(*) as total_gift_cards,
                        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_cards,
                        COUNT(CASE WHEN status = 'used' THEN 1 END) as used_cards,
                        COALESCE(SUM(initial_balance), 0) as total_issued,
                        COALESCE(SUM(balance), 0) as total_unused,
                        COALESCE(SUM(initial_balance) - SUM(balance), 0) as total_used
                    FROM gift_cards gc
                    WHERE ${giftCardWhereClause}
                `;
                giftCardResult = await db.get(giftCardQuery, giftCardParams.length > 0 ? giftCardParams : []) || giftCardResult;
            }
        } catch (error) {
            console.warn('⚠️ Error en consulta gift cards:', error.message);
        }

        // Breakage Rate (gift cards no usadas)
        const breakageRate = giftCardResult.total_issued > 0
            ? ((giftCardResult.total_unused / giftCardResult.total_issued) * 100)
            : 0;

        // Transacciones de gift cards
        let giftCardTransactionResult = { transaction_count: 0, total_amount: 0, credit_count: 0, debit_count: 0, avg_recharge_amount: 0 };
        try {
            const giftCardTransactionsTableExists = await db.get(
                `SELECT name FROM sqlite_master WHERE type='table' AND name='gift_card_transactions'`
            );
            if (giftCardTransactionsTableExists) {
                const giftCardTransactionQuery = `
                    SELECT 
                        COUNT(*) as transaction_count,
                        COALESCE(SUM(amount), 0) as total_amount,
                        COUNT(CASE WHEN operator = 1 THEN 1 END) as credit_count,
                        COUNT(CASE WHEN operator = -1 THEN 1 END) as debit_count,
                        AVG(CASE WHEN operator = 1 THEN amount ELSE NULL END) as avg_recharge_amount
                    FROM gift_card_transactions
                    WHERE 1=1 ${dateFilterPayments.replace('p.created_at', 'created_at')}
                `;
                giftCardTransactionResult = await db.get(giftCardTransactionQuery, params) || giftCardTransactionResult;
            }
        } catch (error) {
            console.warn('⚠️ Error en consulta transacciones gift cards:', error.message);
        }

        // Uso promedio por ticket (% de compra pagada con gift card)
        // Buscar órdenes que usaron gift cards
        let totalOrders = 0;
        let giftCardUsageResult = { orders_with_gc: 0, avg_gc_per_order: 0 };
        let usagePercentage = 0;
        try {
            const ordersTableExists = await db.get(
                `SELECT name FROM sqlite_master WHERE type='table' AND name='orders'`
            );
            const giftCardTransactionsTableExists = await db.get(
                `SELECT name FROM sqlite_master WHERE type='table' AND name='gift_card_transactions'`
            );
            
            if (ordersTableExists) {
                const totalOrdersQuery = `
                    SELECT COUNT(*) as total
                    FROM orders
                    WHERE status != 'cancelled' ${dateFilterOrders.replace('o.created_at', 'created_at')}
                `;
                const totalOrdersResult = await db.get(totalOrdersQuery, orderParams) || { total: 0 };
                totalOrders = totalOrdersResult.total || 0;

                if (giftCardTransactionsTableExists && totalOrders > 0) {
                    const giftCardUsageQuery = `
                        SELECT 
                            COUNT(DISTINCT o.id) as orders_with_gc,
                            AVG(CASE WHEN gct.amount IS NOT NULL THEN gct.amount ELSE 0 END) as avg_gc_per_order
                        FROM orders o
                        LEFT JOIN gift_card_transactions gct ON gct.order_id = o.id AND gct.operator = -1
                        WHERE o.status != 'cancelled' ${dateFilterOrders.replace('o.created_at', 'created_at')}
                    `;
                    giftCardUsageResult = await db.get(giftCardUsageQuery, orderParams) || giftCardUsageResult;
                    usagePercentage = totalOrders > 0
                        ? ((giftCardUsageResult.orders_with_gc || 0) / totalOrders) * 100
                        : 0;
                }
            }
        } catch (error) {
            console.warn('⚠️ Error en consulta uso gift cards:', error.message);
        }

        // 4. Métricas de Fraude y Riesgo
        // Intentos de pago fallidos
        let failedPaymentsResult = { failed_count: 0, affected_orders: 0 };
        try {
            const failedPaymentsQuery = `
                SELECT 
                    COUNT(*) as failed_count,
                    COUNT(DISTINCT order_id) as affected_orders
                FROM payments
                WHERE status = 'failed' ${dateFilterPayments.replace('p.created_at', 'created_at')}
            `;
            failedPaymentsResult = await db.get(failedPaymentsQuery, params) || failedPaymentsResult;
        } catch (error) {
            console.warn('⚠️ Error en consulta pagos fallidos:', error.message);
        }

        // Tiempo promedio de procesamiento
        let processingTimeResult = { avg_hours: 0 };
        try {
            const processingTimeQuery = `
                SELECT 
                    AVG(julianday(COALESCE(captured_at, updated_at)) - julianday(created_at)) * 24 as avg_hours
                FROM payments
                WHERE status = 'captured' AND captured_at IS NOT NULL ${dateFilterPayments.replace('p.created_at', 'created_at')}
            `;
            processingTimeResult = await db.get(processingTimeQuery, params) || processingTimeResult;
        } catch (error) {
            console.warn('⚠️ Error en consulta tiempo procesamiento:', error.message);
        }

        // Pagos sospechosos (múltiples intentos fallidos)
        let suspiciousResult = { suspicious_orders: 0 };
        try {
            const suspiciousQuery = `
                SELECT 
                    COUNT(DISTINCT order_id) as suspicious_orders
                FROM (
                    SELECT order_id, COUNT(*) as attempt_count
                    FROM payments
                    WHERE status = 'failed' ${dateFilterPayments.replace('p.created_at', 'created_at')}
                    GROUP BY order_id
                    HAVING attempt_count > 2
                )
            `;
            suspiciousResult = await db.get(suspiciousQuery, params) || suspiciousResult;
        } catch (error) {
            console.warn('⚠️ Error en consulta pagos sospechosos:', error.message);
        }

        // Chargeback Rate (Disputas bancarias)
        // Obtener el monto desde el pago relacionado
        // Verificar si la tabla chargebacks existe
        let chargebackResult = { chargeback_count: 0, total_chargeback_amount: 0 };
        let chargebackRate = 0;
        try {
            const tableExists = await db.get(
                `SELECT name FROM sqlite_master WHERE type='table' AND name='chargebacks'`
            );
            if (tableExists) {
                const chargebackQuery = `
                    SELECT 
                        COUNT(*) as chargeback_count,
                        COALESCE(SUM(p.amount_gross), 0) as total_chargeback_amount
                    FROM chargebacks c
                    LEFT JOIN payments p ON c.payment_id = p.id
                    WHERE c.status != 'resolved' ${dateFilterPayments.replace('p.created_at', 'c.created_at')}
                `;
                chargebackResult = await db.get(chargebackQuery, params) || chargebackResult;
            }
        } catch (error) {
            console.warn('⚠️ Tabla chargebacks no disponible o error al consultar:', error.message);
        }
        chargebackRate = gmvResult.total_payments > 0
            ? (chargebackResult.chargeback_count / gmvResult.total_payments) * 100
            : 0;

        // Evolución temporal (por mes)
        let evolutionData = [];
        try {
            const evolutionQuery = `
                SELECT 
                    strftime('%Y-%m', created_at) as month,
                    COUNT(*) as payment_count,
                    COALESCE(SUM(amount_gross), 0) as total_amount,
                    COUNT(CASE WHEN status = 'captured' THEN 1 END) as successful_count
                FROM payments
                WHERE 1=1 ${dateFilterPayments.replace('p.created_at', 'created_at')}
                GROUP BY strftime('%Y-%m', created_at)
                ORDER BY month DESC
                LIMIT 12
            `;
            evolutionData = await db.all(evolutionQuery, params) || [];
        } catch (error) {
            console.warn('⚠️ Error en consulta evolución pagos:', error.message);
        }

        // Reembolsos por mes
        let refundEvolutionData = [];
        try {
            const refundsTableExists = await db.get(
                `SELECT name FROM sqlite_master WHERE type='table' AND name='refunds'`
            );
            if (refundsTableExists) {
                const refundEvolutionQuery = `
                    SELECT 
                        strftime('%Y-%m', created_at) as month,
                        COUNT(*) as refund_count,
                        COALESCE(SUM(amount), 0) as total_refund_amount
                    FROM refunds
                    WHERE status = 'processed' ${dateFilterRefunds.replace('r.created_at', 'created_at')}
                    GROUP BY strftime('%Y-%m', created_at)
                    ORDER BY month DESC
                    LIMIT 12
                `;
                refundEvolutionData = await db.all(refundEvolutionQuery, refundParams) || [];
            }
        } catch (error) {
            console.warn('⚠️ Error en consulta evolución reembolsos:', error.message);
        }

        res.json({
            success: true,
            data: {
                // Métricas Financieras Clave
                financial: {
                    gmv: gmvResult.gmv || 0,
                    net_revenue: netRevenueResult.net_revenue || 0,
                    gross_revenue: netRevenueResult.gross_revenue || 0,
                    total_refunds: refundResult.total_refunds || 0,
                    refund_count: refundResult.refund_count || 0,
                    refund_rate: refundRate,
                    avg_refund_cost: avgRefundCost,
                    total_refund_fees: refundCostResult.total_fees || 0,
                    approval_rate: approvalRate,
                    payment_methods: paymentMethods || [],
                    total_fees: Math.max(0, (netRevenueResult.gross_revenue || 0) - (netRevenueResult.net_revenue || 0))
                },
                // Métricas de Conversión
                conversion: {
                    conversion_rate: conversionRate,
                    abandoned_checkout_rate: totalCheckouts > 0 
                        ? (conversionResult.abandoned_checkouts / totalCheckouts) * 100 
                        : 0,
                    aov: aovResult.aov || 0,
                    total_orders: aovResult.total_orders || 0,
                    total_revenue: aovResult.total_revenue || 0,
                    ltv: avgLTV,
                    cac: cac,
                    ltv_cac_ratio: ltvCacRatio,
                    total_checkouts: totalCheckouts
                },
                // Gift Cards
                gift_cards: {
                    total_issued: giftCardResult.total_issued || 0,
                    total_used: giftCardResult.total_used || 0,
                    total_unused: giftCardResult.total_unused || 0,
                    breakage_rate: breakageRate,
                    active_cards: giftCardResult.active_cards || 0,
                    used_cards: giftCardResult.used_cards || 0,
                    transaction_count: giftCardTransactionResult.transaction_count || 0,
                    transaction_amount: giftCardTransactionResult.total_amount || 0,
                    avg_recharge_amount: giftCardTransactionResult.avg_recharge_amount || 0,
                    usage_per_order_percentage: usagePercentage,
                    orders_with_gc: giftCardUsageResult.orders_with_gc || 0,
                    avg_gc_per_order: giftCardUsageResult.avg_gc_per_order || 0
                },
                // Fraude y Riesgo
                risk: {
                    failed_payments: failedPaymentsResult.failed_count || 0,
                    affected_orders: failedPaymentsResult.affected_orders || 0,
                    avg_processing_hours: processingTimeResult.avg_hours || 0,
                    suspicious_orders: suspiciousResult.suspicious_orders || 0,
                    total_attempts: approvalResult.total_attempts || 0,
                    successful_payments: approvalResult.successful || 0,
                    failed_payment_attempts: approvalResult.failed || 0,
                    chargeback_rate: chargebackRate,
                    chargeback_count: chargebackResult.chargeback_count || 0,
                    total_chargeback_amount: chargebackResult.total_chargeback_amount || 0
                },
                // Evolución temporal
                evolution: {
                    payments: evolutionData || [],
                    refunds: refundEvolutionData || []
                }
            }
        });
    } catch (error) {
        console.error('Error al obtener métricas de pagos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener métricas de pagos',
            error: error.message
        });
    }
};


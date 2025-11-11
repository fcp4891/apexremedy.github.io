document.addEventListener('DOMContentLoaded', () => {
    const filters = [
        document.getElementById('filterPaymentStatus'),
        document.getElementById('filterPaymentMethod'),
        document.getElementById('filterPaymentDateFrom'),
        document.getElementById('filterPaymentDateTo')
    ];

    filters.forEach((el) => {
        if (!el) return;
        el.addEventListener('change', () => {
            if (typeof applyPaymentFilters === 'function') {
                applyPaymentFilters();
            }
        });
    });
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

    if (actionNode.tagName === 'BUTTON' || actionNode.tagName === 'A') {
        event.preventDefault();
    }

    switch (action) {
        case 'refresh-current-tab':
            if (typeof refreshCurrentTab === 'function') {
                refreshCurrentTab();
            }
            break;
        case 'switch-tab':
            if (typeof switchPaymentsTab === 'function') {
                switchPaymentsTab(actionNode.dataset.tab);
            }
            break;
        case 'apply-payment-filters':
            if (typeof applyPaymentFilters === 'function') {
                applyPaymentFilters();
            }
            break;
        case 'clear-payment-filters':
            if (typeof clearPaymentFilters === 'function') {
                clearPaymentFilters();
            }
            break;
        case 'open-create-refund':
            if (typeof openCreateRefundModal === 'function') {
                openCreateRefundModal();
            }
            break;
        case 'open-create-gift-card':
            if (typeof openCreateGiftCardModal === 'function') {
                openCreateGiftCardModal();
            }
            break;
        case 'open-batch-gift-card':
            if (typeof openBatchGiftCardModal === 'function') {
                openBatchGiftCardModal();
            }
            break;
        case 'open-create-refund-reason':
            if (typeof openCreateRefundReasonModal === 'function') {
                openCreateRefundReasonModal();
            }
            break;
        case 'open-create-campaign':
            if (typeof openCreateCampaignModal === 'function') {
                openCreateCampaignModal();
            }
            break;
        case 'open-create-payment-method':
            if (typeof openCreatePaymentMethodModal === 'function') {
                openCreatePaymentMethodModal();
            }
            break;
        case 'open-create-provider':
            if (typeof openCreateProviderModal === 'function') {
                openCreateProviderModal();
            }
            break;
        case 'open-create-chargeback':
            if (typeof openCreateChargebackModal === 'function') {
                openCreateChargebackModal();
            }
            break;
        case 'open-create-settlement':
            if (typeof openCreateSettlementModal === 'function') {
                openCreateSettlementModal();
            }
            break;
        case 'process-refund':
            if (typeof processRefund === 'function') {
                processRefund(actionNode.dataset.refundId);
            }
            break;
        case 'approve-refund':
            if (typeof approveRefund === 'function') {
                approveRefund(actionNode.dataset.refundId);
            }
            break;
        case 'reverse-refund':
            if (typeof reverseRefund === 'function') {
                reverseRefund(actionNode.dataset.refundId);
            }
            break;
        case 'refund-overlay':
        case 'close-refund-modal':
            if (typeof closeRefundModal === 'function') {
                closeRefundModal();
            }
            break;
        case 'gift-card-overlay':
        case 'close-gift-card-modal':
            if (typeof closeGiftCardModal === 'function') {
                closeGiftCardModal();
            }
            break;
        case 'batch-gift-card-overlay':
        case 'close-batch-gift-card-modal':
            if (typeof closeBatchGiftCardModal === 'function') {
                closeBatchGiftCardModal();
            }
            break;
        case 'disable-gift-card':
            if (typeof disableGiftCard === 'function') {
                disableGiftCard(actionNode.dataset.giftCardId);
            }
            break;
        case 'activate-gift-card':
            if (typeof activateGiftCard === 'function') {
                activateGiftCard(actionNode.dataset.giftCardId);
            }
            break;
        case 'topup-gift-card':
            if (typeof topUpGiftCard === 'function') {
                topUpGiftCard(actionNode.dataset.giftCardId);
            }
            break;
        case 'reverse-transaction':
            if (typeof reverseTransaction === 'function') {
                reverseTransaction(actionNode.dataset.transactionId);
            }
            break;
        case 'edit-refund-reason':
            if (typeof editRefundReason === 'function') {
                editRefundReason(actionNode.dataset.refundReasonId);
            }
            break;
        case 'delete-refund-reason':
            if (typeof deleteRefundReason === 'function') {
                deleteRefundReason(actionNode.dataset.refundReasonId);
            }
            break;
        case 'edit-gift-card-campaign':
            if (typeof editGiftCardCampaign === 'function') {
                editGiftCardCampaign(actionNode.dataset.campaignId);
            }
            break;
        case 'delete-gift-card-campaign':
            if (typeof deleteGiftCardCampaign === 'function') {
                deleteGiftCardCampaign(actionNode.dataset.campaignId);
            }
            break;
        case 'edit-payment-method':
            if (typeof editPaymentMethod === 'function') {
                editPaymentMethod(actionNode.dataset.paymentMethodId);
            }
            break;
        case 'delete-payment-method':
            if (typeof deletePaymentMethod === 'function') {
                deletePaymentMethod(actionNode.dataset.paymentMethodId);
            }
            break;
        case 'edit-payment-provider':
            if (typeof editPaymentProvider === 'function') {
                editPaymentProvider(actionNode.dataset.paymentProviderId);
            }
            break;
        case 'delete-payment-provider':
            if (typeof deletePaymentProvider === 'function') {
                deletePaymentProvider(actionNode.dataset.paymentProviderId);
            }
            break;
        case 'view-chargeback':
            if (typeof viewChargeback === 'function') {
                viewChargeback(actionNode.dataset.chargebackId);
            }
            break;
        case 'view-settlement':
            if (typeof viewSettlement === 'function') {
                viewSettlement(actionNode.dataset.settlementId);
            }
            break;
        case 'view-webhook':
            if (typeof viewWebhook === 'function') {
                viewWebhook(actionNode.dataset.webhookId);
            }
            break;
        case 'retry-webhook':
            if (typeof retryWebhook === 'function') {
                retryWebhook(actionNode.dataset.webhookId);
            }
            break;
        case 'chargeback-overlay':
        case 'close-chargeback-modal':
            if (typeof closeChargebackModal === 'function') {
                closeChargebackModal();
            }
            break;
        case 'chargeback-detail-overlay':
        case 'close-chargeback-detail':
            if (typeof closeChargebackDetailModal === 'function') {
                closeChargebackDetailModal();
            }
            break;
        case 'settlement-overlay':
        case 'close-settlement-modal':
            if (typeof closeSettlementModal === 'function') {
                closeSettlementModal();
            }
            break;
        case 'settlement-detail-overlay':
        case 'close-settlement-detail':
            if (typeof closeSettlementDetailModal === 'function') {
                closeSettlementDetailModal();
            }
            break;
        case 'webhook-detail-overlay':
        case 'close-webhook-detail':
            if (typeof closeWebhookDetailModal === 'function') {
                closeWebhookDetailModal();
            }
            break;
        case 'change-page': {
            const handlerName = actionNode.dataset.handler;
            const page = parseInt(actionNode.dataset.page, 10);
            if (!handlerName || Number.isNaN(page)) break;
            if (page < 1) break;
            const handler = typeof window !== 'undefined' ? window[handlerName] : null;
            if (typeof handler === 'function') {
                handler(page);
            }
            break;
        }
        case 'capture-payment':
            if (typeof capturePayment === 'function') {
                capturePayment(actionNode.dataset.paymentId);
            }
            break;
        case 'void-payment':
            if (typeof voidPayment === 'function') {
                voidPayment(actionNode.dataset.paymentId);
            }
            break;
        case 'retry-payment':
            if (typeof retryPayment === 'function') {
                retryPayment(actionNode.dataset.paymentId);
            }
            break;
        case 'view-payment':
            if (typeof viewPayment === 'function') {
                viewPayment(actionNode.dataset.paymentId);
            }
            break;
        case 'payment-detail-overlay':
            if (typeof closePaymentDetailModal === 'function') {
                closePaymentDetailModal();
            }
            break;
        case 'close-payment-detail':
            if (typeof closePaymentDetailModal === 'function') {
                closePaymentDetailModal();
            }
            break;
        default:
            break;
    }
});


Module = typeof Module === 'undefined' ? {} : Module;

Module.Pos = {
    name: 'POS System',
    version: '2.0.0',
    summary: 'Simple POS Management System is ...',
    roles: [
        'setting',
        'data-insert',
        'data-update',
        'data-remove',
        'reporter',
        'journal',
        'paid-to-order',
        'sale-by-customer-report',
        'sale-by-item-report',
        'total-sale-report',
        'sale-order-report',
        'customer-history-report',
        'unpaid-by-customer-report',
        'group-total-sale-report',
        'group-balance-report',
        'group-total-sale-report',
        'total-credit-report',
        'unpaid-invoice-overdue-report',
        'unpaid-group-invoice-overdue-report',
        'receive-payment-report',
        'ring-pull-summary-report',
        'ring-pull-detail-report',
        'ring-pull-exchange-report',
        'ring-pull-to-khb-report',
        'exchange-ring-pull-ending-report',
        'ring-pull-transfer-report',
        'stock-transfer-report',
        'stock-ending-report',
        'stock-detail-report',
        'stock-borrow-report',
        'enter-bill-summary-report',
        'enter-bill-by-item-report',
        'enter-bill-by-vendor-report',
        'group-enter-bill-report',
        'pay-enter-bill-report',
        'prepaid-order-report',
        'prepaid-order-detail-report',
        'exchange-gratis-report',
        'receive-item-summary-report',
        'transfer-money-report',
        'group-sale-report',
        'group-balance-report'
    ],
    dump: {
        setting: [
            'pos_location'
        ],
        data: [
            'pos_customer',
            'pos_order'
        ]
    }
};

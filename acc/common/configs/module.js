Module = typeof Module === 'undefined' ? {} : Module;

Module.Acc = {
    name: 'Accounting System',
    version: '2.0.0',
    summary: 'Accounting Management System is ...',
    roles: [
        'setting',
        'data-insert',
        'data-update',
        'data-remove',
        'reporter'
    ],
    dump: {
        setting: [
            'accAccountType',
            'accChartAccount',
            'accChartAccountNBC',
            'accChartAccountNBCKH',
            'acc_currency',
            'acc_exchangeNBC',
            'accMapNBCBalance',
            'accMapNBCIncome',
            'accMapNBCBalanceKH',
            'accMapNBCIncomeKH',
            'accMapClosing',
            'accMapFixAsset',
            'accConfigDep',
            'accPaymentReceiveMethod',
            'core_exchange'
        ],
        data: [
            'accJournal',
            'accCloseChartAccount',
            'accDateEndOfProcess',
            'accFixAssetDep',
            'accFixAssetExpense',
            'acc_netIncome',
            'accCloseChartAccountPerMonth',
            'accClosing',
            'accDepExpList',

        ]
    }
};

import {Company} from '../../../../core/imports/api/collections/company';
import {Invoices} from '../../../imports/api/collections/invoice';
import {Order} from '../../../imports/api/collections/order';
import {Setting} from '../../../../core/imports/api/collections/setting';
import {ReceivePayment} from '../../../imports/api/collections/receivePayment';
import {GroupInvoice} from '../../../imports/api/collections/groupInvoice';
Meteor.methods({
    posChart(){
        let coreCompany = Company.findOne();
        let startOfMonth = moment().startOf('month').toDate();
        let endOfMonth = moment().endOf('month').toDate()
        let selector = {
            invoiceDate: {$gte: startOfMonth, $lte: endOfMonth},
            invoiceType: 'term'
        };
        let data = Invoices.aggregate([
            {$match: selector},
            {
                $group: {
                    _id: {
                        day: {$dayOfMonth: "$invoiceDate"},
                        month: {$month: "$invoiceDate"},
                        year: {$year: "$invoiceDate"}
                    },
                    invoiceDate: {$last: "$invoiceDate"},
                    total: {$sum: "$total"}

                }
            },
            {
                $sort: {invoiceDate: 1}
            },
            {
                $project: {_id: 0, name: {$dateToString: {format: "%d/%m/%Y", date: "$invoiceDate"}}, y: "$total"}
            }
        ]);
        return {company: `${coreCompany.khName}(${coreCompany.enName})`, invoices: data};
    },
    incomeFn(){
        let startOfYear = moment().startOf('year').toDate();
        let endOfYear = moment().endOf('year').toDate();
        let startOfMonth = moment().startOf('month').toDate();
        let endOfMonth = moment().endOf('month').toDate()
        let data = {
            baseCurrency: currencySymbol(Setting.findOne().baseCurrency),
            countSaleOrder: 0,
            totalSaleOrder: 0,
            countInvoice: 0,
            totalInvoice: 0,
            countOverdueInvoice: 0,
            totalOverdueInvoice: 0,
            countPaymentInLast30Days: 0,
            totalPaymentInLast30Days: 0,
            countGroupInvoice: 0,
            totalGroupInvoice: 0,
            countOverdueGroupInvoice: 0,
            totalOverdueGroupInvoice: 0
        };
        let selector = {
            invoice: {
                invoiceDate: {$gte: startOfYear, $lte: endOfYear},
                invoiceType: 'term',
                status: {$in: ["active", "partial"]}
            },
            saleOrder: {
                orderDate: {$gte: startOfYear, $lte: endOfYear},
                status: 'active'
            },
            overdueInvoice: {
                dueDate: {$lt: moment().toDate()}
            },
            overdueGroupInvoice: {
                dueDate: {$lt: moment().toDate()}
            },
            paymentInLast30Days: {
                paymentDate: {
                    $gte: startOfMonth,
                    $lte: endOfMonth
                }
            },
            groupInvoice: {
                endDate: {
                    $lte: endOfYear
                }
            }
        };
        let invoices = aggregateInvoice(selector);
        let saleOrders = aggregateSaleOrder(selector);
        let overdueInvoices = aggregateOverdueInvoice(selector);
        let paymentInLast30Days = aggregatePaymentInLast30Days(selector);
        let groupInvoices = aggregateGroupInvoice(selector);
        let overdueGroupInvoices = aggregateOverdueGroupInvoice(selector);
        if (invoices.length > 0) {
            data.countInvoice = invoices[0].count;
            data.totalInvoice = invoices[0].total
        }
        if (saleOrders.length > 0) {
            data.countSaleOrder = saleOrders[0].count;
            data.totalSaleOrder = saleOrders[0].total;
        }
        if (overdueInvoices.length > 0) {
            data.countOverdueInvoice = overdueInvoices[0].count;
            data.totalOverdueInvoice = overdueInvoices[0].total;
        }
        if (paymentInLast30Days.length > 0) {
            data.countPaymentInLast30Days = paymentInLast30Days[0].count;
            data.totalPaymentInLast30Days = paymentInLast30Days[0].total;
        }
        if (groupInvoices.length > 0) {
            data.countGroupInvoice = groupInvoices[0].count;
            data.totalGroupInvoice = groupInvoices[0].total;
        }
        if (overdueGroupInvoices.length > 0) {
            data.countOverdueGroupInvoice = overdueGroupInvoices[0].count;
            data.totalOverdueGroupInvoice = overdueGroupInvoices[0].total;
        }
        return data;
    }
});

function aggregateInvoice(selector) {
    let invoices = Invoices.aggregate([
        {
            $match: selector.invoice
        },
        {
            $group: {
                _id: {
                    year: {$year: '$invoiceDate'}
                },
                count: {$sum: 1},
                total: {$sum: '$total'},
            }
        },
        {
            $project: {_id: 0, count: 1, total: 1}
        }
    ]);
    return invoices;
}

function aggregateSaleOrder(selector) {
    let saleOrders = Order.aggregate([
        {
            $match: selector.saleOrder
        },
        {
            $group: {
                _id: {
                    year: {$year: '$orderDate'}
                },
                count: {$sum: 1},
                total: {$sum: '$total'},
            }
        },
        {
            $project: {_id: 0, count: 1, total: 1}
        }
    ]);
    return saleOrders;
}

function aggregateOverdueInvoice(selector) {
    let overdueInvoice = Invoices.aggregate([
        {
            $match: selector.overdueInvoice

        },
        {
            $group: {
                _id: null,
                total: {
                    $sum: '$total'
                },
                count: {
                    $sum: 1
                }
            }
        }
    ]);
    return overdueInvoice;
}
function aggregatePaymentInLast30Days(selector) {
    let paymentInLast30Days = ReceivePayment.aggregate([
        {
            $match: selector.paymentInLast30Days
        },
        {
            $group: {
                _id: '$invoiceId',
                total: {$sum: '$paidAmount'}
            }
        },
        {
            $group: {
                _id: null,
                total: {
                    $sum: '$total'
                },
                count: {
                    $sum: 1
                }
            }
        }
    ]);
    return paymentInLast30Days;
}
function aggregateGroupInvoice(selector) {
    let groupInvoice = GroupInvoice.aggregate([
        {
            $match: selector.groupInvoice
        },
        {
            $group: {
                _id: null,
                total: {$sum: '$total'},
                count: {$sum: 1}
            }
        }
    ]);
    return groupInvoice;
}
function aggregateOverdueGroupInvoice(selector) {
    let overdueGroupInvoice = GroupInvoice.aggregate([
        {
            $match: selector.overdueGroupInvoice

        },
        {
            $group: {
                _id: null,
                total: {
                    $sum: '$total'
                },
                count: {
                    $sum: 1
                }
            }
        }
    ]);
    return overdueGroupInvoice;
}
function currencySymbol(baseCurrency) {
    let currencySymbol = '';
    switch (baseCurrency) {
        case 'USD':
            currencySymbol = '$';
            break;
        case 'KHR':
            currencySymbol = 'R';
            break;
        case 'THB':
            currencySymbol = 'B';
            break;
    }
    return currencySymbol;
}
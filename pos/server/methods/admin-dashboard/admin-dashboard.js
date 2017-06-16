import {Invoices} from '../../../imports/api/collections/invoice';
import {ReceivePayment} from '../../../imports/api/collections/receivePayment';
import {AverageInventories} from '../../../imports/api/collections/inventory';
import {AccountMapping} from '../../../imports/api/collections/accountMapping';
import {ChartAccount} from '../../../../acc/imports/api/collections/chartAccount';
import {Branch} from '../../../../core/imports/api/collections/branch';
import {Exchange} from '../../../../core/imports/api/collections/exchange';


Meteor.methods({
    'dashboard.customerTotalCredit' ({date}) {
        Meteor._sleepForMs(100);
        let obj = {
            items: [],
            dataByBranches: [],
            footer: {
                total: 0,
                paidAmount: 0,
                balanceAmount: 0
            },
            branches: []
        };
        let invoices = Invoices.aggregate([
            {
                $match: {
                    invoiceDate: {
                        $lte: moment(date)
                            .endOf('days')
                            .toDate()
                    },
                    status: {
                        $in: ['active', 'partial']
                    },
                    invoiceType: {
                        $ne: 'group'
                    }
                }
            }, {
                $lookup: {
                    from: 'pos_receivePayment',
                    localField: '_id',
                    foreignField: 'invoiceId',
                    as: 'paymentDoc'
                }
            }, {
                $unwind: {
                    path: '$paymentDoc',
                    preserveNullAndEmptyArrays: true
                }
            }, {
                $project: {
                    _id: 1,
                    customerId: 1,
                    total: 1,
                    branchId: 1,
                    paidCount: {
                        $cond: [
                            {
                                $eq: [
                                    {
                                        $type: '$paymentDoc'
                                    },
                                    'missing'
                                ]
                            },
                            0,
                            1
                        ]
                    },
                    paidAmount: {
                        $cond: [
                            {
                                $lte: ['$paymentDoc.paymentDate', date]
                            },
                            '$paymentDoc.paidAmount',
                            0
                        ]
                    }
                }
            }, {
                $group: {
                    _id: {
                        invoiceId: '$_id',
                        branchId: '$branchId'
                    },
                    invoiceCount: {
                        $last: 1
                    },
                    paidCount: {
                        $sum: '$paidCount'
                    },
                    total: {
                        $last: '$total'
                    },
                    paidAmount: {
                        $sum: '$paidAmount'
                    }
                }
            }, {
                $group: {
                    _id: '$_id.branchId',
                    invoiceCount: {
                        $sum: 1
                    },
                    paidCount: {
                        $sum: '$paidCount'
                    },
                    total: {
                        $sum: '$total'
                    },
                    paidAmount: {
                        $sum: '$paidAmount'
                    }
                }
            }, {
                $project: {
                    _id: 1,
                    invoiceCount: 1,
                    paidCount: 1,
                    total: 1,
                    paidAmount: 1,
                    balanceAmount: {
                        $subtract: ['$total', '$paidAmount']
                    }
                }
            }, {
                $lookup: {
                    from: 'core_branch',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'branchDoc'
                }
            }, {
                $unwind: {
                    path: '$branchDoc',
                    preserveNullAndEmptyArrays: true
                }
            }, {
                $sort: {
                    'branchDoc.khName': 1
                }
            }, {
                $group: {
                    _id: null,
                    branches: {
                        $push: '$branchDoc'
                    },
                    data: {
                        $push: '$$ROOT'
                    },
                    total: {
                        $sum: '$total'
                    },
                    paidAmount: {
                        $sum: '$paidAmount'
                    },
                    balanceAmount: {
                        $sum: '$balanceAmount'
                    }
                }
            }
        ]);
        if (invoices.length > 0) {
            obj.dataByBranches = invoices[0].data;
            obj.branches = invoices[0].branches;
            obj.footer.total = invoices[0].total;
            obj.footer.paidAmoun = invoices[0].paidAmount;
            obj.footer.balanceAmount = invoices[0].balanceAmount
        }
        return obj
    },
    'dashboard.dailySale' ({date}) {
        let obj = {
            dataByBranches: [],
            footer: {
                total: 0,
                paidAmount: 0,
                balanceAmount: 0
            },
            branches: []
        };
        let toDate = moment(date)
            .endOf('days')
            .toDate();
        let fromDate = moment(date)
            .startOf('days')
            .toDate();
        let dailySale = Invoices.aggregate([
            {
                $facet: {
                    dailySale: [
                        {
                            $match: {
                                invoiceDate: {
                                    $gte: fromDate,
                                    $lte: toDate
                                },
                                invoiceType: {
                                    $ne: 'group'
                                }
                            }
                        }, {
                            $unwind: {
                                path: '$items',
                                preserveNullAndEmptyArrays: true
                            }
                        }, {
                            $lookup: {
                                from: 'pos_item',
                                localField: 'items.itemId',
                                foreignField: '_id',
                                as: 'items.itemsDoc'
                            }
                        }, {
                            $unwind: {
                                path: '$items.itemsDoc',
                                preserveNullAndEmptyArrays: true
                            }
                        }, {
                            $sort: {
                                'items.itemsDoc.name': 1
                            }
                        }, {
                            $group: {
                                _id: {
                                    branchId: '$branchId',
                                    itemId: '$items.itemId'
                                },
                                items: {
                                    $last: '$items.itemsDoc'
                                },
                                qty: {
                                    $sum: '$items.qty'
                                }
                            }
                        }, {
                            $lookup: {
                                from: 'core_branch',
                                localField: '_id.branchId',
                                foreignField: '_id',
                                as: 'branchDoc'
                            }
                        }, {
                            $unwind: {
                                path: '$branchDoc',
                                preserveNullAndEmptyArrays: true
                            }
                        }, {
                            $sort: {
                                'branchDoc.khName': 1
                            }
                        }, {
                            $group: {
                                _id: '$_id.itemId',
                                branches: {
                                    $push: {
                                        _id: '$branchDoc._id',
                                        qty: '$qty',
                                        khName: '$branchDoc.khName',
                                        enName: '$branchDoc.enName'
                                    }
                                },
                                totalQty: {
                                    $sum: '$qty'
                                }
                            }
                        }, {
                            $lookup: {
                                from: 'pos_item',
                                localField: '_id',
                                foreignField: '_id',
                                as: 'itemDoc'
                            }
                        }, {
                            $unwind: {
                                path: '$itemDoc',
                                preserveNullAndEmptyArrays: true
                            }
                        }, {
                            $sort: {
                                'itemDoc.name': 1
                            }
                        }, {
                            $group: {
                                _id: null,
                                data: {
                                    $push: '$$ROOT'
                                },
                                totalSumQty: {
                                    $sum: '$totalQty'
                                }
                            }
                        }

                    ],
                    branches: [
                        {
                            $match: {
                                invoiceDate: {
                                    $gte: fromDate,
                                    $lte: toDate
                                },
                                invoiceType: {
                                    $ne: 'group'
                                }
                            }
                        }, {
                            $lookup: {
                                from: 'core_branch',
                                localField: 'branchId',
                                foreignField: '_id',
                                as: 'branchDoc'
                            }
                        }, {
                            $unwind: {
                                path: '$branchDoc',
                                preserveNullAndEmptyArrays: true
                            }
                        }, {
                            $group: {
                                _id: '$branchId',
                                branchDoc: {
                                    $last: '$branchDoc'
                                }
                            }

                        }, {
                            $sort: {
                                'branchDoc.khName': 1
                            }
                        }
                    ]
                }
            }
        ]);
        if (dailySale[0].dailySale.length > 0) {
            obj.dataByBranches = dailySale[0].dailySale[0].data;
            obj.branches = dailySale[0].branches;
            obj.footer.total = dailySale[0].dailySale[0].totalSumQty;
            // obj.items = dailySale[0].dailySaleItems
        }
        return obj
    },
    'dashboard.dailyStock' ({date, showPOSM}) {
        Meteor._sleepForMs(100);
        let obj = {items: [], dataByBranches: [], footer: {total: 0, paidAmount: 0, balanceAmount: 0}, branches: []};
        let selector = {price: {$gt: 0}, createdAt: {$lte: moment(date).endOf('days').toDate()}};
        if (showPOSM) {
            selector.price = {$eq: 0};
        }
        let project = {
            'item': '$lastDoc.itemDoc.name',
            'price': '$lastDoc.price',
            'unit': '$lastDoc.itemDoc._unit.name',
            'remainQty': '$lastDoc.remainQty',
            'amount': '$lastDoc.amount',
            'lastAmount': '$lastDoc.lastAmount',
            'averagePrice': '$lastDoc.averagePrice'

        };
        let invoices = AverageInventories.aggregate([
            {
                $facet: {
                    stocks: [
                        {
                            $match: selector
                        }, {
                            $sort: {
                                _id: 1,
                                createdAt: 1
                            }
                        }, {
                            $lookup: {
                                from: 'pos_item',
                                localField: 'itemId',
                                foreignField: '_id',
                                as: 'itemDoc'
                            }
                        }, {
                            $unwind: {
                                path: '$itemDoc',
                                preserveNullAndEmptyArrays: true
                            }
                        }, {
                            $lookup: {
                                from: 'pos_categories',
                                localField: 'itemDoc.categoryId',
                                foreignField: '_id',
                                as: 'itemDoc.categoryDoc'
                            }
                        }, {
                            $unwind: {
                                path: '$itemDoc.categoryDoc',
                                preserveNullAndEmptyArrays: true
                            }
                        }, {
                            $lookup: {
                                from: 'pos_stockLocations',
                                localField: 'stockLocationId',
                                foreignField: '_id',
                                as: 'locationDoc'
                            }
                        }, {
                            $unwind: {
                                path: '$locationDoc',
                                preserveNullAndEmptyArrays: true
                            }
                        }, {
                            $lookup: {
                                from: 'core_branch',
                                localField: 'branchId',
                                foreignField: '_id',
                                as: 'branchDoc'
                            }
                        }, {
                            $unwind: {
                                path: '$branchDoc',
                                preserveNullAndEmptyArrays: true
                            }
                        }, {
                            $project: {
                                itemId: 1,
                                createdAt: 1,
                                itemDoc: 1,
                                branchDoc: 1,
                                locationDoc: 1,
                                stockLocationId: 1,
                                branchId: 1,
                                qty: 1,
                                price: 1,
                                remainQty: 1,
                                amount: 1,
                                lastAmount: 1,
                                averagePrice: 1
                            }
                        }, {
                            $sort: {
                                'branchDoc.khName': -1
                            }
                        }, {
                            $group: {
                                _id: {
                                    branch: '$branchId',
                                    itemId: '$itemId',
                                    stockLocationId: '$stockLocationId'
                                },
                                lastDoc: {
                                    $last: '$$ROOT'
                                }
                            }
                        }, {
                            $group: {
                                _id: '$_id.itemId',
                                itemDoc: {
                                    $last: '$lastDoc.itemDoc'
                                },
                                lastDoc: {
                                    $push: '$lastDoc'
                                },
                                totalRemainQty: {$sum: '$lastDoc.remainQty'}
                            }
                        }
                    ],
                    stockBranches: [
                        {
                            $match: selector
                        }, {
                            $sort: {
                                _id: 1,
                                createdAt: 1
                            }
                        }, {
                            $lookup: {
                                from: 'core_branch',
                                localField: 'branchId',
                                foreignField: '_id',
                                as: 'branchDoc'
                            }
                        }, {
                            $unwind: {
                                path: '$branchDoc',
                                preserveNullAndEmptyArrays: true
                            }
                        }, {
                            $group: {
                                _id: {
                                    branchId: '$branchId',
                                    itemId: '$itemId'
                                },
                                branchDoc: {
                                    $last: '$branchDoc'
                                },
                                lastItem: {
                                    $last: '$$ROOT'
                                }
                            }
                        }, {
                            $group: {
                                _id: '$_id.branchId',
                                branchDoc: {
                                    $last: '$branchDoc'
                                },
                                lastAmount: {
                                    $sum: '$lastItem.lastAmount'
                                },
                                remainQty: {
                                    $sum: '$lastItem.remainQty'
                                }
                            }
                        }, {
                            $sort: {
                                'branchDoc.khName': 1
                            }
                        }
                    ]
                }
            }
        ]);
        if (invoices[0].stocks.length > 0) {
            obj.dataByBranches = invoices[0].stocks;
            obj.branches = invoices[0].stockBranches;
            // obj.items = dailySale[0].dailySaleItems
        }
        return obj;
    },
    'dashboard.dailyCash'(){
        Meteor._sleepForMs(100);
        let obj = {
            footer: 0,
            dataByBranches: []
        };
        let branches = Branch.find({}, {sort: {khName: 1}});
        let cashOnHand = AccountMapping.findOne({name: 'Cash on Hand'});
        let code = cashOnHand.account.split(' | ')[0];
        let id = ChartAccount.findOne({code})._id;

        let selector = {
            date: `${moment().startOf('months').format('DD/MM/YYYY')} - ${moment().endOf('months').format('DD/MM/YYYY')}`,
            currencyId: 'All',
            branchId: 'All',
            chartAccountId: id
        };
        branches.forEach(function (branch) {
            let exchange = Exchange.findOne({}, {sort: {_id: -1}});
            let params = {
                date: `${moment().startOf('months').format('DD/MM/YYYY')} - ${moment().endOf('months').format('DD/MM/YYYY')}`,
                currencyId: 'All',
                branchId: branch._id,
                chartAccountId: id,
                exchangeDate: exchange && exchange._id
            };
            Meteor.call("acc_cashReportMethod", params, function (err, result) {
                if (!err) {
                    obj.dataByBranches.push({branchDoc: branch, balance: result.endingBalance});
                }else{
                    console.log(err.message)
                }
            });
        });
        Meteor.call("acc_cashReportMethod", selector, function (err, result) {
            if (!err) {
                obj.footer = result.endingBalance;
            }
        });
        return obj
    }
});

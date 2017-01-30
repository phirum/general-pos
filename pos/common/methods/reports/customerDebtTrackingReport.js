import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {Company} from '../../../../core/imports/api/collections/company.js';
import {Invoices} from '../../../imports/api/collections/invoice';
import {Exchange} from '../../../../core/imports/api/collections/exchange';
// lib func
import ReportFn from '../../../imports/api/libs/report';
import {exchangeCoefficient} from '../../../imports/api/libs/exchangeCoefficient';
export const customerDebtTrackingReport = new ValidatedMethod({
    name: 'pos.customerDebtTrackingReport',
    mixins: [CallPromiseMixin],
    validate: null,
    run(params) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(200);
            let selector = {};
            let project = {};
            let data = {
                title: {},
                fields: [],
                displayFields: [],
                content: [{index: 'No Result'}],
                footer: {
                    totalBalance: 0
                }
            };
            let branchId = [];
            if (params.branchId) {
                branchId = params.branchId.split(',');
                selector.branchId = {
                    $in: branchId
                };
                selector = ReportFn.checkIfUserHasRights({currentUser: Meteor.userId(), selector});
            }
            let exchange = Exchange.findOne({}, {sort: {_id: -1}});
            let coefficient = exchangeCoefficient({exchange, fieldToCalculate: '$total'})
            selector.invoiceType = {$eq: 'term'};
            var currentArrDate;
            if (params.date) {
                currentArrDate = params.date.split(',');
                data.title.date = moment(currentArrDate[0]).format('YYYY-MMM-DD') + ' - ' + moment(currentArrDate[1]).format('YYYY-MMM-DD');
                data.title.exchange = `USD = ${coefficient.usd.$multiply[1]} $, KHR = ${coefficient.khr.$multiply[1]}<small> ៛</small>, THB = ${coefficient.thb.$multiply[1]} B`;
                selector.invoiceDate = {
                    $gte: moment(currentArrDate[0]).startOf('days').toDate(),
                    $lte: moment(currentArrDate[1]).endOf('days').toDate()
                }
            }
            if (params.customer && params.customer != '') {
                selector.customerId = params.customer;
            }
            // project['$invoice'] = 'Invoice';
            /****** Title *****/
            data.title.company = Company.findOne();
            /****** Content *****/
            let invoices = Invoices.aggregate([
                {$match: selector},
                {
                    $lookup: {
                        from: "pos_receivePayment",
                        localField: "_id",
                        foreignField: "invoiceId",
                        as: "receivePaymentDoc"
                    }
                }, {
                    $project: {
                        customerId: 1,
                        voucher: 1,
                        _id: 1,
                        total: 1,
                        invoiceDate: 1,
                        items: 1,
                        receivePaymentDoc: 1,
                    }
                },
                {$unwind: {path: '$receivePaymentDoc', preserveNullAndEmptyArrays: true}},
                {
                    $project: {
                        customerId: 1,
                        _id: 1,
                        voucherId: 1,
                        total: 1,
                        paidAmount: {
                            $cond: [

                                {
                                    $lte: ['$receivePaymentDoc.paymentDate', moment(currentArrDate[1]).endOf('days').toDate()]
                                },

                                '$receivePaymentDoc.paidAmount',
                                0
                            ]
                        },
                        items: 1,
                        invoiceDate: 1,
                        receivePaymentDoc: {
                            $cond: [

                                {
                                    $lte: ['$receivePaymentDoc.paymentDate', moment(currentArrDate[1]).endOf('days').toDate()]
                                },

                                '$receivePaymentDoc',
                                null
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: '$_id',
                        items: {$last: '$items'},
                        invoiceId: {$last: '$_id'},
                        total: {$last: '$total'},
                        paidAmount: {$sum: '$paidAmount'},
                        invoiceDate: {$last: '$invoiceDate'},
                        customerId: {$last: '$customerId'},
                        voucherId: {$last: '$voucherId'},
                        receivePaymentDoc: {
                            $push: '$receivePaymentDoc'
                        }
                    }
                },
                {
                    $unwind: {path: '$items', preserveNullAndEmptyArrays: true}
                },
                {
                    $lookup: {
                        from: 'pos_item',
                        localField: 'items.itemId',
                        foreignField: '_id',
                        as: 'itemsDoc'
                    }
                },
                {
                    $unwind: {path: '$itemsDoc', preserveNullAndEmptyArrays: true}
                },
                {$sort: {"itemsDoc.name": 1}},
                {
                    $group: {
                        _id: '$_id',
                        invoiceId: {$last: '$_id'},
                        total: {$last: '$total'},
                        balanceAmount: {$last: '$balanceAmount'},
                        paidAmount: {$last: '$paidAmount'},
                        invoiceDate: {$last: '$invoiceDate'},
                        customerId: {$last: '$customerId'},
                        voucherId: {$last: '$voucherId'},
                        receivePaymentDoc: {$last: '$receivePaymentDoc'},
                        items: {
                            $push: {
                                itemName: '$itemsDoc.name',
                                price: '$items.price',
                                qty: '$items.qty',
                                amount: '$items.amount'
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: '$customerId',
                        total: {$sum: '$total'},
                        balanceAmount: {$sum: {$subtract: ['$total', '$paidAmount']}},
                        paidAmount: {$sum: '$paidAmount'},
                        data: {$push: '$$ROOT'}
                    }
                },
                {
                    $lookup: {
                        from: 'pos_customers',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'customerDoc'
                    }
                },
                {$unwind: {path: '$customerDoc', preserveNullAndEmptyArrays: true}},
                {
                    $group: {
                        _id: null,
                        data: {
                            $push: '$$ROOT'
                        },
                        totalBalance: {$sum: '$balanceAmount'}
                    }
                }
            ]);
            if (invoices.length > 0) {
                data.content = invoices[0].data;
                data.footer.totalBalance = invoices[0].totalBalance;
            }
            return data
        }
    }
});

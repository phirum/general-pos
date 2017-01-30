import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';

//collection
import {ReceivePayment} from '../../../imports/api/collections/receivePayment';
import {Invoices} from '../../../imports/api/collections/invoice';
import {GroupInvoice} from '../../../imports/api/collections/groupInvoice';
import {WhiteListCustomer} from '../../../imports/api/collections/whiteListCustomer';
export const checkCreditLimit = new ValidatedMethod({
    name: 'pos.checkCreditLimit',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        customerId: {
            type: String
        },
        customerInfo: {
            type: Object,
            blackbox: true
        },
        creditLimitAmount: {
            type: Number
        }
    }).validator(),
    run({customerId, customerInfo, creditLimitAmount})
    {
        if (!this.isSimulation) {
            let total = 0;
            let totalInvoiceOrGroupInvoice = 0;
            let receivePayment = 0;
            if (customerInfo.termId) {
                let invoices = Invoices.aggregate([
                    {
                        $match: {
                            customerId: customerId,
                            paymentGroupId: {$exists: false},
                            status: {$in: ['active', 'partial']}
                        }
                    },
                    {
                        $lookup: {
                            from: "pos_receivePayment",
                            localField: "_id",
                            foreignField: "invoiceId",
                            as: "paymentDoc"
                        }
                    },
                    {$unwind: {path: '$paymentDoc', preserveNullAndEmptyArrays: true}},
                    {$sort: {'paymentDoc.paymentDate': 1}},
                    {
                        $group: {
                            _id: '$_id',
                            status: {$last: '$status'},
                            invoiceDoc: {$last: '$$ROOT'},
                            lastPaymentDate: {$last: '$paymentDoc.paymentDate'},
                            dueAmount: {
                                $last: '$paymentDoc.dueAmount'
                            },
                            paidAmount: {
                                $last: '$paymentDoc.paidAmount'
                            },
                            paymentDoc: {$last: '$paymentDoc'},
                            total: {$last: '$total'},
                            invoiceDate: {$last: '$invoiceDate'}
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            invoiceDoc: {
                                customerId: 1,
                                invoiceDate: 1
                            },
                            dueAmount: {
                                $ifNull: ["$dueAmount", "$total"]
                            },
                            paidAmount: {
                                $ifNull: ["$paidAmount", 0]
                            },
                            balance: {
                                $ifNull: ["$paymentDoc.balanceAmount", "$total"]
                            },
                            invoiceDate: 1,
                            lastPaymentDate: {
                                $ifNull: ["$paymentDoc.paymentDate", "None"]
                            },
                            status: 1,
                            total: '$total'
                        }
                    },
                    {
                        $redact: {
                            $cond: {if: {$eq: ['$balance', 0]}, then: '$$PRUNE', else: '$$KEEP'}
                        }
                    },
                    {
                        $group: {
                            _id: '$invoiceDoc.customerId',
                            data: {
                                $addToSet: '$$ROOT'
                            },
                            lastPaymentDate: {$last: '$lastPaymentDate'},
                            invoiceDate: {$last: '$invoiceDate'},
                            dueAmountSubTotal: {$sum: '$dueAmount'},
                            paidAmount: {$sum: '$paidAmount'},
                            balance: {$sum: '$balance'}
                        }
                    }
                ]);
                totalInvoiceOrGroupInvoice = _.isUndefined(invoices[0]) ? 0 : invoices[0].balance;
            } else {
                let groupInvoices = GroupInvoice.aggregate([
                    {
                        $match: {
                            vendorOrCustomerId: customerId,
                            status: {$in: ['active', 'partial']}
                        }
                    },
                    {
                        $lookup: {
                            from: "pos_receivePayment",
                            localField: "_id",
                            foreignField: "invoiceId",
                            as: "paymentDoc"
                        }
                    },
                    { $unwind: { path: '$paymentDoc', preserveNullAndEmptyArrays: true } },
                    { $sort: { 'paymentDoc.paymentDate': 1 } },
                    {
                        $group: {
                            _id: '$_id',
                            status: { $last: '$status' },
                            invoiceDoc: { $last: '$$ROOT' },
                            lastPaymentDate: { $last: '$paymentDoc.paymentDate' },
                            dueAmount: {
                                $last: '$paymentDoc.dueAmount'
                            },
                            paidAmount: {
                                $last: '$paymentDoc.paidAmount'
                            },
                            paymentDoc: { $last: '$paymentDoc' },
                            total: { $last: '$total' },
                            startDate: {$last: '$startDate'},
                            endDate: { $last: '$endDate' }
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            invoice: { $concat: 'Group' },
                            invoiceDoc: {
                                vendorOrCustomerId: 1,
                                startDate: 1,
                                endDate: 1
                            },
                            dueAmount: {
                                $ifNull: ["$dueAmount", "$total"]
                            },
                            paidAmount: {
                                $ifNull: ["$paidAmount", 0]
                            },
                            balance: {
                                $ifNull: ["$paymentDoc.balanceAmount", "$total"]
                            },
                            endDate: 1,
                            startDate: 1,
                            lastPaymentDate: {
                                $ifNull: ["$paymentDoc.paymentDate", "None"]
                            },
                            status: 1,
                            total: '$total'
                        }
                    },
                    {
                        $redact: {
                            $cond: { if: { $eq: ['$balance', 0] }, then: '$$PRUNE', else: '$$KEEP' }
                        }
                    },
                    {
                        $group: {
                            _id: '$invoiceDoc.vendorOrCustomerId',
                            data: {
                                $addToSet: '$$ROOT'
                            },
                            startDate: { $last: '$startDate' },
                            endDate: { $last: '$endDate' },
                            lastPaymentDate: { $last: '$lastPaymentDate' },
                            dueAmountSubTotal: { $sum: '$dueAmount' },
                            paidAmount: { $sum: '$paidAmount' },
                            balance: { $sum: '$balance' }
                        }
                    },
                ]);
                totalInvoiceOrGroupInvoice = _.isUndefined(groupInvoices[0]) ? 0 : groupInvoices[0].balance;
            }
            let limitAmount =  totalInvoiceOrGroupInvoice + creditLimitAmount;
            let whiteListCustomer = WhiteListCustomer.findOne({customerId: customerId});
            return {limitAmount, whiteListCustomer};
        }
    }
});
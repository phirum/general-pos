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
import {correctFieldLabel} from '../../../imports/api/libs/correctFieldLabel';
import {exchangeCoefficient} from '../../../imports/api/libs/exchangeCoefficient';
import ReportFn from "../../../imports/api/libs/report";
export const  termCustomerBalanceReport = new ValidatedMethod({
    name: 'pos.termCustomerBalanceReport',
    mixins: [CallPromiseMixin],
    validate: null,
    run(params) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(200);
            let selector = {};
            let project = {
                totalDue: 0,
                totalPaid: 0,
                totalBalance: 0
            };
            let data = {
                title: {},
                fields: [],
                displayFields: [],
                content: [{index: 'No Result'}],
                footer: {}
            };
            let branchId = [];
            if (params.branchId) {
                branchId = params.branchId.split(',');
                selector.branchId = {
                    $in: branchId
                };
                selector = ReportFn.checkIfUserHasRights({currentUser: Meteor.userId(), selector});
            }
            let date = moment(params.date).endOf('days').toDate();
            let user = Meteor.users.findOne(Meteor.userId());
            let exchange = Exchange.findOne({}, {sort: {_id: -1}});
            let coefficient = exchangeCoefficient({exchange, fieldToCalculate: '$total'})

            // console.log(user);
            // let date = _.trim(_.words(params.date, /[^To]+/g));
            selector.invoiceType = {$eq: 'term'};
            if (params.date) {
                data.title.date = moment(params.date).format('YYYY-MMM-DD');
                data.title.exchange = `USD = ${coefficient.usd.$multiply[1]} $, KHR = ${coefficient.khr.$multiply[1]}<small> ៛</small>, THB = ${coefficient.thb.$multiply[1]} B`;
                if(params.type == 'active'){
                    selector.$or = [
                        // {status: {$in: ['active', 'partial']}, invoiceDate: {$lte: date}},
                        {invoiceDate: {$lte: date}, status: 'active'}
                    ];
                }else{
                    selector.$or = [
                        {status: {$in: ['active', 'partial']}, invoiceDate: {$lte: date}},
                        {invoiceDate: {$lte: date}, status: 'closed', closedAt: {$gt: date}}
                    ];
                }
            }
            if (params.customer && params.customer != '') {
                selector.customerId = params.customer;
            }
            if (params.filter && params.filter != '') {
                let filters = params.filter.split(','); //map specific field
                data.fields.push({field: 'Type'});
                data.displayFields.push({field: 'invoice'});
                for (let i = 0; i < filters.length; i++) {
                    data.fields.push({field: correctFieldLabel(filters[i])});
                    data.displayFields.push({field: filters[i]});
                    project[filters[i]] = `$${filters[i]}`;
                    if (filters[i] == 'customerId') {
                        project['_customer'] = '$_customer'
                    }
                    if (filters[i] == 'repId') {
                        project['repId'] = '$repId.name'
                    }
                }
                data.fields.push({field: 'Amount'});//map total field for default
                data.displayFields.push({field: 'total'});
                project['invoice'] = '$invoice';
                project['total'] = '$total'; //get total projection for default
            } else {
                project = {
                    'invoice': '$invoice',
                    '_id': '$_id',
                    'invoiceDate': '$invoiceDate',
                    'dueDate': '$dueDate',
                    'total': '$total'
                };
                data.fields = [{field: 'Type'}, {field: 'ID'}, {field: 'Invoice Date'}, {field: 'Aging'}, {field: 'Last Payment'}, {field: 'DueAmount'}, {field: 'PaidAmount'}, {field: 'Balance'}];
                data.displayFields = [{field: 'invoice'}, {field: '_id'}, {field: 'invoiceDate'}, {field: 'dueDate'}, {field: 'lastPaymentDate'}, {field: 'dueAmount'}, {field: 'paidAmount'}, {field: 'balance'}];
            }
            // project['$invoice'] = 'Invoice';
            /****** Title *****/
            data.title.company = Company.findOne();
            /****** Content *****/
            let invoices = [];
            if(params.type == 'active'){
                invoices = Invoices.aggregate([
                    {$match: selector},
                    {
                        $project: {
                            _id: 1,
                            status: 1,
                            invoiceDate: 1,
                            dueDate: 1,
                            customerId: 1,
                            total: 1,
                            lastPaymentDate: {
                                $cond: [
                                    {$lte: ['$paymentDoc.paymentDate', date]},
                                    '$paymentDoc.paymentDate', 'None'
                                ]
                            },
                            dueAmount: {
                                $cond: [
                                    {$lte: ['$paymentDoc.paymentDate', date]},
                                    '$paymentDoc.dueAmount', null
                                ]
                            },
                            paidAmount: {
                                $cond: [
                                    {$lte: ['$paymentDoc.paymentDate', date]},
                                    '$paymentDoc.paidAmount', null
                                ]
                            },
                            paymentDoc: 1,
                        }
                    },
                    {
                        $group: {
                            _id: '$_id',
                            status: {$last: '$status'},
                            dueDate: {$last: '$dueDate'},
                            invoiceDoc: {$last: '$$ROOT'},
                            lastPaymentDate: {$last: '$lastPaymentDate'},
                            dueAmount: {
                                $last: '$dueAmount'
                            },
                            paidAmount: {
                                $last: '$paidAmount'
                            },
                            paymentDoc: {$last: '$paymentDoc'},
                            total: {$last: '$total'},
                            invoiceDate: {$last: '$invoiceDate'}
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            invoice: {$concat: 'Invoice'},
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
                            invoiceDate: 1,
                            dueDate: 1,
                            lastPaymentDate: {
                                $ifNull: ["$lastPaymentDate", "None"]
                            },
                            status: 1,
                            total: '$total'
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            invoice: 1,
                            invoiceDoc: 1,
                            dueAmount: 1,
                            paidAmount: 1,
                            balance: {$subtract: ["$dueAmount", "$paidAmount"]},
                            invoiceDate: 1,
                            dueDate: 1,
                            lastPaymentDate: 1,
                            status: 1,
                            total: .1
                        }
                    },
                    {$sort: {invoiceDate: 1}},
                    {
                        $redact: {
                            $cond: {if: {$gt: ['$balance', 0]}, then: '$$KEEP', else: '$$PRUNE'}
                        }
                    },
                    {
                        $group: {
                            _id: '$invoiceDoc.customerId',
                            data: {
                                $push: '$$ROOT'
                            },
                            dueDate: {$last: '$dueDate'},
                            invoiceDate: {$last: '$invoiceDate'},
                            lastPaymentDate: {$last: '$lastPaymentDate'},
                            dueAmountSubTotal: {$sum: '$dueAmount'},
                            paidAmount: {$sum: '$paidAmount'},
                            balance: {$sum: '$balance'}
                        }
                    },
                    {
                        $lookup: {
                            from: "pos_customers",
                            localField: "_id",
                            foreignField: "_id",
                            as: "customerDoc"
                        }
                    },
                    {
                        $unwind: {path: '$customerDoc', preserveNullAndEmptyArrays: true}
                    },
                    {$sort: {'customerDoc.name': 1}},
                    {
                        $group: {
                            _id: null,
                            data: {
                                $push: '$$ROOT'
                            },
                            grandDueAmount: {$sum: '$dueAmountSubTotal'},
                            grandPaidAmount: {$sum: '$paidAmount'},
                            grandBalance: {$sum: '$balance'}
                        }
                    }
                ]);
            }else{
                invoices = Invoices.aggregate([
                    {
                        $match: selector
                    },
                    {
                        $lookup: {
                            from: 'pos_receivePayment',
                            localField: '_id',
                            foreignField: 'invoiceId',
                            as: 'paymentDoc'
                        }
                    },

                    {
                        $project: {
                            _id: 1,
                            customerId: 1,
                            invoiceId: 1,
                            invoiceDate: 1,
                            dueDate: 1,
                            total: 1,
                            paymentDoc: {
                                $filter: {
                                    input: '$paymentDoc',
                                    as: 'payment',
                                    cond: {$lte: ['$$payment.paymentDate', date]}
                                }
                            }
                        }
                    },
                    {
                        $unwind: {
                            path: '$paymentDoc',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {$sort: {'paymentDoc.paymentDate': 1}},
                    {
                        $project: {
                            _id: 1,
                            status: 1,
                            invoiceDate: 1,
                            dueDate: 1,
                            customerId: 1,
                            total: 1,
                            lastPaymentDate: '$paymentDoc.paymentDate',
                            paymentDoc: 1,
                        }
                    },
                    {
                        $group: {
                            _id: '$_id',
                            status: {$last: '$status'},
                            dueDate: {$last: '$dueDate'},
                            invoiceDoc: {$last: '$$ROOT'},
                            lastPaymentDate: {$last: '$lastPaymentDate'},
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
                            invoice: {$concat: 'Invoice'},
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
                            invoiceDate: 1,
                            dueDate: 1,
                            lastPaymentDate: {
                                $ifNull: ["$lastPaymentDate", "None"]
                            },
                            status: 1,
                            total: '$total'
                        }
                    },
                    {
                        $group: {
                            _id: '$_id',
                            invoice: {$last: '$invoice'},
                            invoiceDoc: {$last: '$invoiceDoc'},
                            dueAmount: {$last: '$dueAmount'},
                            paidAmount: {$last: '$paidAmount'},
                            balance: {$last: {$subtract: ["$dueAmount", "$paidAmount"]}},
                            invoiceDate: {$last: '$invoiceDate'},
                            dueDate: {$last: '$dueDate'},
                            lastPaymentDate: {$last: '$lastPaymentDate'},
                            status: {$last: '$status'},
                            total: {$last: '$total'}
                        }
                    },
                    {
                        $group: {
                            _id: '$invoiceDoc.customerId',
                            data: {
                                $push: '$$ROOT'
                            },
                            dueDate: {$last: '$dueDate'},
                            invoiceDate: {$last: '$invoiceDate'},
                            lastPaymentDate: {$last: '$lastPaymentDate'},
                            dueAmountSubTotal: {$sum: '$dueAmount'},
                            paidAmount: {$sum: '$paidAmount'},
                            balance: {$sum: '$balance'}
                        }
                    },
                    {
                        $lookup: {
                            from: "pos_customers",
                            localField: "_id",
                            foreignField: "_id",
                            as: "customerDoc"
                        }
                    },
                    {
                        $unwind: {path: '$customerDoc', preserveNullAndEmptyArrays: true}
                    },
                    {
                        $redact: {
                            $cond: {if: {$gt: ['$balance', 0]}, then: '$$KEEP', else: '$$PRUNE'}
                        }
                    },
                    {$sort: {'customerDoc.name': 1}},
                    {
                        $group: {
                            _id: null,
                            data: {
                                $push: '$$ROOT'
                            },
                            grandDueAmount: {$sum: '$dueAmountSubTotal'},
                            grandPaidAmount: {$sum: '$paidAmount'},
                            grandBalance: {$sum: '$balance'}
                        }
                    }
                ]);
            }
            if (invoices.length > 0) {
                data.content = invoices[0].data;
                data.footer = {
                    totalDue: invoices[0].grandDueAmount,
                    totalPaid: invoices[0].grandPaidAmount,
                    totalBalance: invoices[0].grandBalance,
                }
            }
            return data
        }
    }
});

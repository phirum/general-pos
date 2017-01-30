import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {Company} from '../../../../core/imports/api/collections/company.js';
import {GroupInvoice} from '../../../imports/api/collections/groupInvoice';
import {Exchange} from '../../../../core/imports/api/collections/exchange';
// lib func
import {correctFieldLabel} from '../../../imports/api/libs/correctFieldLabel';
import {exchangeCoefficient} from '../../../imports/api/libs/exchangeCoefficient';
export const groupCustomerBalanceReport = new ValidatedMethod({
    name: 'pos.groupCustomerBalanceReport',
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
                content: [{ index: 'No Result' }],
                footer: {}
            };
            let branch = [];
            let date = moment(params.date).add(1, 'days').toDate();
            let user = Meteor.users.findOne(Meteor.userId());
            let exchange = Exchange.findOne({}, { sort: { _id: -1 } });
            let coefficient = exchangeCoefficient({ exchange, fieldToCalculate: '$total' })

            // console.log(user);
            // let date = _.trim(_.words(params.date, /[^To]+/g));
            if (params.date) {
                data.title.date = moment(params.date).format('YYYY-MMM-DD');
                data.title.exchange = `USD = ${coefficient.usd.$multiply[1]} $, KHR = ${coefficient.khr.$multiply[1]}<small> ៛</small>, THB = ${coefficient.thb.$multiply[1]} B`;
                selector.startDate = { $lt: date };
            }
            if (params.customer && params.customer != '') {
                selector.vendorOrCustomerId = params.customer;
            }
            if (params.filter && params.filter != '') {
                let filters = params.filter.split(','); //map specific field
                data.fields.push({ field: 'Type' });
                data.displayFields.push({ field: 'invoice' });
                for (let i = 0; i < filters.length; i++) {
                    data.fields.push({ field: correctFieldLabel(filters[i]) });
                    data.displayFields.push({ field: filters[i] });
                    project[filters[i]] = `$${filters[i]}`;
                    if (filters[i] == 'customerId') {
                        project['_customer'] = '$_customer'
                    }
                    if (filters[i] == 'repId') {
                        project['repId'] = '$repId.name'
                    }
                }
                data.fields.push({ field: 'Amount' });//map total field for default
                data.displayFields.push({ field: 'total' });
                project['invoice'] = '$invoice';
                project['total'] = '$total'; //get total projection for default
            } else {
                project = {
                    'invoice': '$invoice',
                    '_id': '$_id',
                    'invoiceDate': '$invoiceDate',
                    'total': '$total'
                };
                data.fields = [{ field: 'Type' }, { field: 'ID' }, { field: 'Start Date' }, { field: 'End Date' },{ field: 'Last Payment' }, { field: 'DueAmount' }, { field: 'PaidAmount' }, { field: 'Balance' }];
                data.displayFields = [{ field: 'invoice' }, { field: '_id' }, { field: 'startDate' }, { field: 'endDate' },{ field: 'lastPaymentDate' }, { field: 'dueAmount' }, { field: 'paidAmount' }, { field: 'balance' }];
            }
            // project['$invoice'] = 'Invoice';
            /****** Title *****/
            data.title.company = Company.findOne();
            /****** Content *****/
            let invoices = GroupInvoice.aggregate([
                { $match: selector },
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
                { $match: { $or: [{ "paymentDoc.paymentDate": { $lt: date } }, { paymentDoc: { $exists: false } }] } },

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
                {
                    $lookup: {
                        from: "pos_customers",
                        localField: "_id",
                        foreignField: "_id",
                        as: "customerDoc"
                    }
                },
                {
                    $unwind: { path: '$customerDoc', preserveNullAndEmptyArrays: true }
                },
                {
                    $group: {
                        _id: null,
                        data: {
                            $addToSet: '$$ROOT'
                        }
                    }
                }
            ]);
            if (invoices.length > 0) {
                data.content = invoices[0].data;
                // data.footer = {
                //     total: invoices[0].total,
                //     totalKhr: invoices[0].totalKhr,
                //     totalThb: invoices[0].totalThb
                // }
            }
            return data
        }
    }
});

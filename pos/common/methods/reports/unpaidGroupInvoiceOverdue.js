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
export const unpaidGroupInvoiceOverdue = new ValidatedMethod({
    name: 'pos.unpaidGroupInvoiceOverdue',
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
                footer: {}
            };
            let branch = [];
            let user = Meteor.users.findOne(Meteor.userId());
            let date;
            let exchange = Exchange.findOne({}, {sort: {_id: -1}});
            let coefficient = exchangeCoefficient({exchange, fieldToCalculate: '$total'})

            // console.log(user);
            // let date = _.trim(_.words(params.date, /[^To]+/g));
            selector.invoiceType = {$ne: 'group'};
            selector.status = {$in: ['active', 'partial', 'closed']};
            if (params.date) {
                date = moment(params.date).toDate();
                data.title.date = params.date;
                data.title.exchange = `USD = ${coefficient.usd.$multiply[1]} $, KHR = ${coefficient.khr.$multiply[1]}<small> ៛</small>, THB = ${coefficient.thb.$multiply[1]} B`;
                selector.dueDate = {$lt: date};
                selector.status = {$in: ["active", "partial"]};
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
                    '_id': '$_id.invoiceId',
                    '_customer': '$_customer',
                    'dueDate': '$dueDate',
                    'invoice': '$invoice',
                    'invoiceDate': '$invoiceDate',
                    'total': '$total',
                    'dueAmount': '$dueAmount',
                    'balanceAmount': '$balanceAmount',
                    'paidAmount': '$paidAmount'
                };
                data.fields = [
                    {field: 'Type'},
                    {field: 'ID'},
                    {field: 'DueDate'},
                    {field: 'DueAmount'},
                    {field: 'Paid'},
                    {field: 'Balance'}
                ];
                data.displayFields = [
                    {field: 'invoice'},
                    {field: '_id'},
                    {field: 'dueDate'},
                    {field: 'dueAmount'},
                    {field: 'paidAmount'},
                    {field: 'balanceAmount'}
                ];
            }
            // project['$invoice'] = 'Invoice';
            /****** Title *****/
            data.title.company = Company.findOne();
            /****** Content *****/
            let groupInvoices = GroupInvoice.aggregate([
                {
                    $match: selector
                },
                {
                    $lookup: {
                        from: "pos_receivePayment",
                        localField: "_id",
                        foreignField: "invoiceId",
                        as: "receivePayment"
                    }
                },
                {$unwind: {path: "$receivePayment", preserveNullAndEmptyArrays: true}},
                {
                    $lookup: {
                        from: 'pos_customers',
                        localField: 'vendorOrCustomerId',
                        foreignField: '_id',
                        as: '_customer'
                    }
                },
                {$unwind: {path: '$_customer', preserveNullAndEmptyArrays: true}},
                {
                    $project: {
                        _id: 1,
                        _customer: 1,
                        customerId: '$vendorOrCustomerId',
                        invoice: {$ifNull: ['$invoice', 'Group Invoice']},
                        dueDate: 1,
                        total: 1,
                        status: 1,
                        dueAmount: {$ifNull: ["$receivePayment.dueAmount", "$total"]},
                        paidAmount: {$ifNull: ["$receivePayment.paidAmount", 0]},
                        balanceAmount: {
                            $ifNull: ["$receivePayment.balanceAmount", "$total"]
                        }
                    }
                },

                {
                    $group: {
                        _id: {
                            invoiceId: '$_id',
                            customerId: '$customerId'
                        },
                        _customer: {$last: '$_customer'},
                        invoice: {$last: '$invoice'},
                        dueDate: {$last: '$dueDate'},
                        total: {$last: '$total'},
                        status: {$last: '$status'},
                        dueAmount: {$last: '$dueAmount'},
                        paidAmount: {$last: '$paidAmount'},
                        balanceAmount: {$last: '$balanceAmount'}
                    }
                },
                {
                    $group: {
                        _id: "$_id.customerId",
                        _customer: {$last: '$_customer'},
                        groupInvoices: {
                            $push: project
                            // $push: {
                            //     _id: '$_id.invoiceId',
                            //     dueDate: '$dueDate',
                            //     invoiceDate: '$invoiceDate',
                            //     total: '$total',
                            //     status: '$status',
                            //     dueAmount: '$dueAmount',
                            //     paidAmount: '$paidAmount',
                            //     balanceAmount: '$balanceAmount'
                            // }
                        },
                        total: {$sum: '$total'},
                        dueAmount: {$sum: '$dueAmount'},
                        paidAmount: {$sum: '$paidAmount'},
                        balanceAmount: {$sum: '$balanceAmount'}
                    }
                },

                {
                    $group: {
                        _id: null,
                        data: {
                            $push: '$$ROOT'
                        },
                        total: {$sum: '$total'},
                        dueAmount: {$sum: '$dueAmount'},
                        balanceAmount: {$sum: '$balanceAmount'},
                        paidAmount: {$sum: '$paidAmount'}
                    }
                }
            ]);
            if (groupInvoices.length > 0) {
                data.content = groupInvoices[0].data;
                data.footer = {
                    total: groupInvoices[0].total,
                    dueAmount: groupInvoices[0].dueAmount,
                    balanceAmount: groupInvoices[0].balanceAmount,
                    paidAmount: groupInvoices[0].paidAmount
                }
            }
            console.log(data.content);
            return data
        }
    }
});

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
export const customerTotalCreditReport = new ValidatedMethod({
    name: 'pos.customerTotalCreditReport',
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
            let branchId = [];
            if (params.branchId) {
                branchId = params.branchId.split(',');
                selector.branchId = {
                    $in: branchId
                };
                selector = ReportFn.checkIfUserHasRights({currentUser: Meteor.userId(), selector});
            }
            let date = moment(params.date).add(1, 'days').toDate();
            let exchange = Exchange.findOne({}, {sort: {_id: -1}});
            let coefficient = exchangeCoefficient({exchange, fieldToCalculate: '$total'})

            // console.log(user);
            // let date = _.trim(_.words(params.date, /[^To]+/g));
            selector.invoiceType = {$eq: 'term'};
            selector.status = {$in: ['active', 'partial']};
            let sortBy = {'customer.name': 1};
            if (params.sortBy) {
                switch (params.sortBy) {
                    case 'customerId':
                        sortBy = {'customer._id': 1};
                        break;
                    case 'customerName':
                        sortBy = {'customer.name': 1};
                        break;
                }
            }
            if (params.date) {
                data.title.date = moment(params.date).format('YYYY-MMM-DD');
                data.title.exchange = `USD = ${coefficient.usd.$multiply[1]} $, KHR = ${coefficient.khr.$multiply[1]}<small> ៛</small>, THB = ${coefficient.thb.$multiply[1]} B`;
                selector.invoiceDate = {$lt: date};
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
                    'customerName': '$customer.name',
                    'customerAddress': {$ifNull: ['$customer.address', '']},
                    'customerTelephone': {$ifNull: ['$customer.telephone', '']},
                    'customerId': '$_id',
                    'amountDue': '$amountDue',
                };
                data.fields = [{field: 'Cust ID'}, {field: 'Customer Name'}, {field: 'Address'}, {field: 'Telephone'}, {field: 'Amt due'}];
                data.displayFields = [{field: 'customerId'}, {field: 'customerName'}, {field: 'customerAddress'}, {field: 'customerTelephone'}, {field: 'amountDue'}];
            }
            // project['$invoice'] = 'Invoice';
            /****** Title *****/
            data.title.company = Company.findOne();
            /****** Content *****/
            let invoices = Invoices.aggregate([
                {$match: selector},
                {
                    $lookup: {
                        from: 'pos_receivePayment',
                        localField: '_id',
                        foreignField: 'invoiceId',
                        as: 'paymentDoc'
                    }
                },
                {
                    $unwind: {path: '$paymentDoc', preserveNullAndEmptyArrays: true}
                },
                {
                    $project: {
                        _id: 1,
                        customerId: 1,
                        total: 1,
                        paidAmount: {
                            $cond: [
                                {
                                    $lt: ["$paymentDoc.paymentDate", date]
                                },
                                '$paymentDoc.paidAmount',
                                0
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: {customerId: '$customerId', invoiceId: '$_id'},
                        total: {$last: '$total'},
                        paidAmount: {$sum: '$paidAmount'}
                    }
                },
                {
                    $group: {
                        _id: '$_id.customerId',
                        total: {
                            $sum: '$total'
                        },
                        paidAmount: {
                            $sum: '$paidAmount'
                        }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        total: 1,
                        paidAmount: 1,
                        amountDue: {
                            $subtract: ["$total", "$paidAmount"]
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'pos_customers',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'customer'
                    }
                },
                {$unwind: {path: '$customer', preserveNullAndEmptyArrays: true}},
                {$sort: sortBy},
                {
                    $group: {
                        _id: null,
                        data: {
                            $push: project
                        },
                        total: {$sum: '$amountDue'}
                    }
                }
            ]);
            if (invoices.length > 0) {
                data.content = invoices[0].data;
                data.footer.total = invoices[0].total;
            }
            return data
        }
    }
});

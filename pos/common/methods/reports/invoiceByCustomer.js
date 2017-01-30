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
export const invoiceByCustomerReport = new ValidatedMethod({
    name: 'pos.invoiceByCustomerReport',
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
            let exchange = Exchange.findOne({}, {sort: {_id: -1}});
            let coefficient = exchangeCoefficient({exchange, fieldToCalculate: '$total'})
            let filterItems = {'items.itemId': {$ne: ''}};
            // console.log(user);
            // let date = _.trim(_.words(params.date, /[^To]+/g));
            selector.invoiceType = {$ne: 'group'};
            selector.status = {$in: ['active', 'partial', 'closed']};
            if (params.items) {
                let arr = params.items.split(',');
                filterItems = {'items.itemId': {$in: arr}};
            }
            if (params.date) {
                let dateAsArray = params.date.split(',');
                let fromDate = moment(dateAsArray[0]).toDate();
                let toDate = moment(dateAsArray[1]).toDate();
                data.title.date = moment(fromDate).format('YYYY-MMM-DD hh:mm a') + ' - ' + moment(toDate).format('YYYY-MMM-DD hh:mm a');
                data.title.exchange = `USD = ${coefficient.usd.$multiply[1]} $, KHR = ${coefficient.khr.$multiply[1]}<small> ៛</small>, THB = ${coefficient.thb.$multiply[1]} B`;
                selector.invoiceDate = {$gte: fromDate, $lte: toDate};
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
                    'items': '$items',
                    'invoiceDate': '$invoiceDate',
                    'total': '$total'
                };
                data.fields = [{field: 'Type'}, {field: 'ID'}, {field: 'Date'}, {field: 'Item'}, {field: 'Qty'}, {field: 'Price'}, {field: 'Amount'}];
                data.displayFields = [{field: 'invoice'}, {field: '_id'}, {field: 'invoiceDate'}, {field: 'items'}, {field: 'qty'}, {field: 'price'}, {field: 'amount'}];
            }
            // project['$invoice'] = 'Invoice';
            /****** Title *****/
            data.title.company = Company.findOne();
            /****** Content *****/
            let invoices = Invoices.aggregate([
                {
                    $match: selector
                },
                {
                    $unwind: {path: '$items', preserveNullAndEmptyArrays: true}
                },
                {
                    $lookup: {
                        from: 'pos_item',
                        localField: 'items.itemId',
                        foreignField: '_id',
                        as: 'itemDoc'
                    }
                },
                {$unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}},
                {
                    $sort: {'itemDoc.name': 1, _id: 1},
                },
                {$match: filterItems},
                {
                    $group: {
                        _id: '$_id',
                        customerId: {$last: '$customerId'},
                        total: {$sum: '$items.amount'},
                        dueDate: {$last: '$dueDate'},
                        invoiceDate: {$last: '$invoiceDate'},
                        branchId: {$last: '$branchId'},
                        createdAt: {$last: '$createdAt'},
                        createdBy: {$last: '$createdBy'},
                        invoiceType: {$last: '$invoiceType'},
                        items: {
                            $push: {
                                total: '$total',
                                _id: '$_id',
                                dueDate: '$dueDate',
                                invoiceDate: '$invoiceDate',
                                branchId: '$branchId',
                                createdAt: '$createdAt',
                                createdBy: '$createdBy',
                                invoiceType: '$invoiceType',
                                itemName: '$itemDoc.name',
                                price: '$items.price',
                                qty: '$items.qty',
                                amount: '$items.amount',
                                profit: '$profit',
                                repId: '$repId',
                                staffId: '$staffId',
                                stockLocationId: '$stockLocationId',
                                totalCost: '$amountCost',
                                status: '$status'
                            }
                        },
                        profit: {$sum: '$items.profit'},
                        repId: {$last: '$repId'},
                        staffId: {$last: '$staffId'},
                        stockLocationId: {$last: 'stockLocationId'},
                        totalCost: {$last: '$items.amountCost'},
                        status: {$last: '$status'}

                    }
                },
                {
                    $lookup: {
                        from: 'pos_reps',
                        localField: 'repId',
                        foreignField: '_id',
                        as: 'repId'
                    }
                },
                {$unwind: {path: '$repId', preserveNullAndEmptyArrays: true}},
                {
                    $project: {
                        invoice: {$concat: ["Invoice", '']},
                        totalUsd: coefficient.usd,
                        totalThb: coefficient.thb,
                        totalKhr: coefficient.khr,
                        customerId: 1,
                        total: 1,
                        _id: 1,
                        dueDate: 1,
                        invoiceDate: 1,
                        branchId: 1,
                        createdAt: 1,
                        createdBy: 1,
                        invoiceType: 1,
                        items: 1,
                        profit: 1,
                        repId: 1,
                        staffId: 1,
                        stockLocationId: 1,
                        totalCost: 1,
                        status: 1
                    }
                },
                {
                    $lookup: {
                        from: 'pos_customers',
                        localField: 'customerId',
                        foreignField: '_id',
                        as: '_customer'
                    }
                },
                {
                    $unwind: {
                        preserveNullAndEmptyArrays: true,
                        path: '$_customer'
                    }
                },

                {
                    $group: {
                        _id: '$customerId',
                        customer: {$addToSet: '$_customer'},
                        data: {$addToSet: project},
                        total: {$sum: '$totalUsd'},
                        totalKhr: {$sum: '$totalKhr'},
                        totalThb: {$sum: '$totalThb'}
                    }
                },
                {$unwind: {path: '$customer', preserveNullAndEmptyArrays: true}},
                {$sort: {'customer.name': 1}},
                {
                    $group: {
                        _id: null,
                        content: {
                            $addToSet: '$$ROOT'
                        },
                        total: {$sum: '$total'},
                        totalKhr: {$sum: '$totalKhr'},
                        totalThb: {$sum: '$totalThb'},
                    }
                }]);
            if (invoices.length > 0) {
                data.content = invoices[0].content;
                data.footer = {
                    total: invoices[0].total,
                    totalKhr: invoices[0].totalKhr,
                    totalThb: invoices[0].totalThb
                }
            }
            return data
        }
    }
});

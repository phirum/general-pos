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
export const invoiceByItemReport = new ValidatedMethod({
    name: 'pos.invoiceByItemReport',
    mixins: [CallPromiseMixin],
    validate: null,
    run(params) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(200);
            let selector = {};
            let project = {};
            let itemSelector = {$exists: true};
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
            let exchange = Exchange.findOne({}, {sort: {_id: -1}});
            let coefficient = exchangeCoefficient({exchange, fieldToCalculate: '$total'})

            // console.log(user);
            // let date = _.trim(_.words(params.date, /[^To]+/g));
            selector.invoiceType = {$ne: 'group'};
            selector.status = {$in: ['active', 'partial', 'closed']};
            if (params.date) {
                let dateAsArray = params.date.split(',')
                let fromDate = moment(dateAsArray[0]).toDate();
                let toDate = moment(dateAsArray[1]).toDate();
                data.title.date = moment(fromDate).format('YYYY-MMM-DD hh:mm a') + ' - ' + moment(toDate).format('YYYY-MMM-DD hh:mm a');
                data.title.exchange = `USD = ${coefficient.usd.$multiply[1]} $, KHR = ${coefficient.khr.$multiply[1]}<small> ៛</small>, THB = ${coefficient.thb.$multiply[1]} B`;
                selector.invoiceDate = {$gte: fromDate, $lte: toDate};
            }
            if (params.customer && params.customer != '') {
                selector.customerId = params.customer;
            }
            if (params.itemId) {
                itemSelector = {$in: [params.itemId]}
            }
            data.fields = [{field: '<th>Date</th>'}, {field: '<th>INVN</th>'}, {field: '<th>Name</th>'}, {field: '<th>Addr</th>'}, {field: '<th>Tel</th>'}, {field: '<th>Item</th>'}, {field: '<th class="text-right">Qty</th>'},{field: '<th class="text-right">Price</th>'}, {field: '<th class="text-right">Amount</th>'}];
            data.displayFields = [{field: 'date'}, {field: 'invoiceId'}, {field: 'customer'}, {field: 'address'}, {field: 'tel'}, {field: 'itemName'}, {field: 'qty'}, {field: 'amount'}];

            // project['$invoice'] = 'Invoice';
            /****** Title *****/
            data.title.company = Company.findOne();
            /****** Content *****/
            let invoices = Invoices.aggregate([
                {
                    $match: selector
                },
                {
                    $lookup: {
                        from: 'pos_customers',
                        localField: 'customerId',
                        foreignField: '_id',
                        as: 'customerDoc'
                    }
                },
                {
                    $unwind: {path: '$customerDoc', preserveNullAndEmptyArrays: true}
                },
                {
                    $unwind: {path: '$items', preserveNullAndEmptyArrays: true}
                },
                {$match: {'items.itemId': itemSelector}},
                {
                    $lookup: {
                        from: 'pos_item',
                        localField: 'items.itemId',
                        foreignField: '_id',
                        as: 'itemDoc'
                    }
                },
                {
                    $unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}
                },
                {
                    $sort: {invoiceDate: 1}
                },
                {
                    $project: {
                        invoiceId: {$ifNull: ['$voucherId', '$_id']},
                        _id: 0,
                        invoiceDate: '$invoiceDate',
                        customerDoc: 1,
                        itemDoc: 1,
                        items: 1
                    }
                },
                {
                    $group: {
                        _id: null,
                        data: {
                            $push: '$$ROOT'
                        },
                        total: {$sum: '$items.amount'},
                        totalQty: {$sum: '$items.qty'}
                    }
                }
            ]);
            let invoiceItemSummary = Invoices.aggregate([
                {
                    $match: selector
                },
                {
                    $unwind: {path: '$items', preserveNullAndEmptyArrays: true}
                },
                {$match: {'items.itemId': itemSelector}},
                {
                    $lookup: {
                        from: "pos_item",
                        localField: "items.itemId",
                        foreignField: "_id",
                        as: "itemDoc"
                    }
                },
                {$unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}},
                {
                    $group: {
                        _id: '$items.itemId',
                        itemName: {
                            $addToSet: '$itemDoc.name'
                        },
                        qty: {$sum: '$items.qty'},
                        price: {$avg: '$items.price'},
                        amount: {$sum: '$items.amount'}
                    }
                },
                {$unwind: {path: '$itemName', preserveNullAndEmptyArrays: true}},
                {$sort: {itemName: 1}}
            ]);
            if (invoices.length > 0) {
                data.content = invoices[0].data;
                data.footer = {
                    itemsSummary: invoiceItemSummary,
                    totalQty: invoices[0].totalQty,
                    total: invoices[0].total,
                }
            }
            return data
        }
    }
});

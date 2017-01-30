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
            let data = {
                title: {},
                fields: [],
                displayFields: [],
                content: [{index: 'No Result'}],
                footer: {}
            };
            let branchId = [];
            if(params.branchId) {
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
            data.fields = [{field: '<th>Date</th>'}, {field: '<th>INVN</th>'}, {field: '<th>Name</th>'}, {field: '<th>Addr</th>'}, {field: '<th>Tel</th>'}, {field: '<th>Item</th>'}, {field: '<th class="text-right">Qty</th>'}, {field: '<th class="text-right">Amount</th>'}];
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
                    $project: {
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
                    $group: {
                        _id: '$customerId',
                        invoiceId: {$last: '$_id'},
                        date: {$last: '$invoiceDate'},
                        data: {
                            $addToSet: '$$ROOT'
                        },
                        total: {$sum: '$totalUsd'},
                        totalKhr: {$sum: '$totalKhr'},
                        totalThb: {$sum: '$totalThb'}
                    }
                },

                {$unwind: {path: '$data', preserveNullAndEmptyArrays: true}},
                {$unwind: {path: '$data.items', preserveNullAndEmptyArrays: true}},
                {
                    $lookup: {
                        from: "pos_item",
                        localField: "data.items.itemId",
                        foreignField: "_id",
                        as: "data.itemDoc"
                    }
                },
                {$unwind: {path: '$data.itemDoc', preserveNullAndEmptyArrays: true}},
                {
                    $group: {
                        _id: {
                            customerId: '$data.customerId',
                            itemId: '$data.items.itemId'
                        },
                        invoiceId: {$last: '$invoiceId'},
                        date: {$last: '$date'},
                        customerId: {$last: '$data.customerId'},
                        itemId: {$addToSet: '$data.items.itemId'},
                        itemName: {$addToSet: '$data.itemDoc.name'},
                        qty: {$sum: '$data.items.qty'},
                        price: {$avg: '$data.items.price'},
                        amount: {$sum: '$data.items.amount'},
                        total: {$addToSet: '$total'},
                        totalThb: {$addToSet: '$totalThb'},
                        totalKhr: {$addToSet: '$totalKhr'}
                    }
                },
                {$unwind: {path: '$itemId', preserveNullAndEmptyArrays: true}},
                {$unwind: {path: '$itemName', preserveNullAndEmptyArrays: true}},
                {$unwind: {path: '$total', preserveNullAndEmptyArrays: true}},
                {$unwind: {path: '$totalThb', preserveNullAndEmptyArrays: true}},
                {$unwind: {path: '$totalKhr', preserveNullAndEmptyArrays: true}},
                {
                    $lookup: {
                        from: "pos_customers",
                        localField: "customerId",
                        foreignField: "_id",
                        as: "customerDoc"
                    }
                }, {
                    $unwind: {path: '$customerDoc', preserveNullAndEmptyArrays: true}
                },
                {$sort: {'customerDoc.name': 1}},
                {
                    $group: {
                        _id: '$customerId',
                        items: {
                            $addToSet: {
                                invoiceId: '$invoiceId',
                                date: '$date',
                                customer: '$customerDoc.name',
                                tel: '$customerDoc.telephone',
                                address: '$customerDoc.address',
                                itemName: '$itemName',
                                qty: '$qty',
                                price: '$price',
                                amount: '$amount'
                            }
                        },
                        totalQty: {$sum: '$qty'},
                        total: {$addToSet: {totalUsd: '$total', totalThb: '$totalThb', totalKhr: '$totalKhr'}}
                    }
                },
                {$unwind: {path: '$total', preserveNullAndEmptyArrays: true}},
                {
                    $group: {
                        _id: null,
                        data: {
                            $addToSet: '$$ROOT'
                        },
                        totalQty: {$sum: '$totalQty'},
                        total: {$sum: '$total.totalUsd'},
                        totalKhr: {$sum: '$total.totalKhr'},
                        totalThb: {$sum: '$total.totalThb'}
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
                    totalKhr: invoices[0].totalKhr,
                    totalThb: invoices[0].totalThb
                }
            }
            return data
        }
    }
});

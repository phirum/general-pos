import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {Company} from '../../../../core/imports/api/collections/company.js';
import {EnterBills} from '../../../imports/api/collections/enterBill';
import {GroupBill} from '../../../imports/api/collections/groupBill';
import {Exchange} from '../../../../core/imports/api/collections/exchange';
// lib func
import {correctFieldLabel} from '../../../imports/api/libs/correctFieldLabel';
import {exchangeCoefficient} from '../../../imports/api/libs/exchangeCoefficient';
export const billByItemReport = new ValidatedMethod({
    name: 'pos.billByItemReport',
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
            let fromDate, toDate;
            // console.log(user);
            // let date = _.trim(_.words(params.date, /[^To]+/g));
            if (params.date) {
                let dateAsArray = params.date.split(',');
                fromDate = moment(dateAsArray[0]).toDate();
                toDate = moment(dateAsArray[1]).toDate();
                data.title.date = moment(fromDate).format('DD/MM/YYYY') + ' - ' + moment(toDate).format('DD/MM/YYYY');
                data.title.exchange = `USD = ${coefficient.usd.$multiply[1]} $, KHR = ${coefficient.khr.$multiply[1]}<small> ៛</small>, THB = ${coefficient.thb.$multiply[1]} B`;
            }
            if (params.type == 'Term') {
                selector.billType = {$ne: 'group'};
                selector.enterBillDate = {$gte: fromDate, $lte: toDate};
            } else {
                selector.startDate = {$gte: fromDate, $lte: toDate}
            }
            if (params.status) {
                selector.status = {$in: params.status.split(',')};
            }
            data.title.status = params.status || "All";
            if (params.vendor && params.vendor != '') {
                if (params.type == 'Term') {
                    selector.vendorId = params.vendor;
                } else {
                    selector.vendorOrCustomerId = params.vendor;
                }
            }
            if(params.branchId) {
                selector.branchId = params.branchId;
            }else{
                return data;
            }
            data.fields = [
                {field: 'Date'},
                {field: 'BILLN'},
                {field: 'Name'},
                {field: 'Tel'},
                {field: 'Addr'},
                {field: 'Item'},
                {field: 'Qty'},
                {field: 'Price'},
                {field: 'Amount'}
            ];
            data.displayFields = [
                {field: 'date'},
                {field: 'billId'},
                {field: 'vendor'},
                {field: 'tel'},
                {field: 'address'},
                {field: 'itemName'},
                {field: 'qty'},
                {field: 'price'},
                {field: 'amount'}
            ];

            // project['$invoice'] = 'Invoice';
            /****** Title *****/
            data.title.company = Company.findOne();
            /****** Content *****/
            let type = params.type || 'Term';
            let aggregateData = type == 'Term' ? aggregateBill({selector, coefficient}) : aggregateGroupBill({
                selector,
                coefficient
            });
            if (aggregateData.bills.length > 0) {
                data.content = aggregateData.bills[0].data;
                data.footer = {
                    itemsSummary: aggregateData.invoiceItemSummary,
                    totalQty: aggregateData.bills[0].totalQty,
                    total: aggregateData.bills[0].total,
                    totalKhr: aggregateData.bills[0].totalKhr,
                    totalThb: aggregateData.bills[0].totalThb
                }
            }
            return data;
        }
    }
});
function aggregateBill({selector, coefficient}) {
    let bills = EnterBills.aggregate([
        {
            $match: selector
        },
        {
            $project: {
                totalUsd: coefficient.usd,
                totalThb: coefficient.thb,
                totalKhr: coefficient.khr,
                vendorId: 1,
                total: 1,
                _id: 1,
                type: {$ifNull: ['$type', true]},
                dueDate: 1,
                enterBillDate: 1,
                branchId: 1,
                createdAt: 1,
                createdBy: 1,
                billType: 1,
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
                _id: '$vendorId',
                billId: {$last: '$_id'},
                enterBillDate: {$last: '$enterBillDate'},
                type: {$last: '$type'},
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
        {
            $lookup: {
                from: "pos_vendors",
                localField: "_id",
                foreignField: "_id",
                as: "vendorDoc"
            }
        }, {
            $unwind: {path: '$vendorDoc', preserveNullAndEmptyArrays: true}
        },
        {$sort: {'vendorDoc.name': 1}},
        {$unwind: {path: '$data.itemDoc', preserveNullAndEmptyArrays: true}},
        {
            $group: {
                _id: {
                    vendorId: '$data.vendorId',
                    itemId: '$data.items.itemId'
                },
                type: {$last: '$type'},
                billId: {$last: '$billId'},
                vendorId: {$last: '$data.vendorId'},
                vendorDoc: {$last: '$vendorDoc'},
                enterBillDate: {$last: '$enterBillDate'},
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
            $group: {
                _id: '$vendorId',
                items: {
                    $addToSet: {
                        billId: '$billId',
                        type: '$type',
                        vendor: '$vendorDoc.name',
                        tel: '$vendorDoc.telephone',
                        address: '$vendorDoc.address',
                        date: '$enterBillDate',
                        itemName: '$itemName',
                        qty: '$qty',
                        price: '$price',
                        amount: '$amount'
                    }
                },
                sumQty: {$sum: '$qty'},
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
                totalQty: {$sum: '$sumQty'},
                total: {$sum: '$total.totalUsd'},
                totalKhr: {$sum: '$total.totalKhr'},
                totalThb: {$sum: '$total.totalThb'}
            }
        }

    ]);
    let invoiceItemSummary = EnterBills.aggregate([
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
    return {bills, invoiceItemSummary};
}

function aggregateGroupBill({selector, coefficient}) {
    let groupBill = GroupBill.aggregate([
        {$match: selector},
        {
            $project: {
                totalUsd: coefficient.usd,
                totalThb: coefficient.thb,
                totalKhr: coefficient.khr,
                vendorOrCustomerId: 1,
                total: 1,
                _id: 1,
                dueDate: 1,
                date: {
                    $concat: [
                        {$dateToString: {format: "%Y-%m-%d", date: '$startDate'}},
                        " to ",
                        {$dateToString: {format: "%Y-%m-%d", date: '$endDate'}}
                    ]
                },
                startDate: 1,
                endDate: 1,
                branchId: 1,
                createdAt: 1,
                createdBy: 1,
                invoices: 1,
                repId: 1,
                staffId: 1,
                stockLocationId: 1,
                totalCost: 1,
                status: 1
            }
        },
        {
            $unwind: {path: '$invoices'}
        },

        {$unwind: {path: '$invoices.items'}},
        {
            $lookup: {
                from: "pos_item",
                localField: "invoices.items.itemId",
                foreignField: "_id",
                as: "itemDoc"
            }
        },
        {
            $lookup: {
                from: "pos_vendors",
                localField: "vendorOrCustomerId",
                foreignField: "_id",
                as: "vendorDoc"
            }
        },
        {$unwind: {path: '$vendorDoc', preserveNullAndEmptyArrays: true}},
        {$unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}},
        {
            $group: {
                _id: {
                    vendorId: '$vendorOrCustomerId',
                    itemId: '$invoices.items.itemId'
                },
                billId: {$last: '$_id'},
                date: {$last: '$date'},
                vendor: {$last: '$vendorDoc.name'},
                tel: {$last: '$vendorDoc.telephone'},
                address: {$last: '$vendorDoc.address'},
                itemName: {
                    $last: {
                        name: '$itemDoc.name',
                    }
                },
                price: {
                    $avg: "$invoices.items.price"
                },
                qty: {
                    $sum: '$invoices.items.qty'
                },
                amount: {
                    $sum: '$invoices.items.amount'
                },
                total: {$last: '$totalUsd'},
                totalThb: {$last: '$totalThb'},
                totalKhr: {$last: '$totalKhr'}
            }
        },
        {$sort: {itemName: 1}},
        {
            $group: {
                _id: '$_id.vendorId',
                items: {
                    $addToSet: {
                        billId: '$billId',
                        vendor: '$vendor',
                        tel: '$last',
                        address: '$address',
                        date: '$date',
                        itemName: '$itemName.name',
                        price: '$price',
                        qty: '$qty',
                        amount: '$amount'
                    }
                },
                sumQty: {$sum: '$qty'},
                total: {$addToSet: {totalUsd: '$total', totalThb: '$totalThb', totalKhr: '$totalKhr'}}
            }

        },
        {
            $lookup: {
                from: "pos_vendors",
                localField: "_id",
                foreignField: "_id",
                as: "vendorDoc"
            }
        },
        {$unwind: {path: '$vendorDoc', preserveNullAndEmptyArrays: true}},
        {$sort: {'vendorDoc.name': 1}},
        {$unwind: {path: '$total', preserveNullAndEmptyArrays: true}},

        {
            $group: {
                _id: null,
                data: {
                    $addToSet: '$$ROOT'
                },
                totalQty: {$sum: '$sumQty'},
                total: {$sum: '$total.totalUsd'},
                totalKhr: {$sum: '$total.totalKhr'},
                totalThb: {$sum: '$total.totalThb'}
            }
        }
    ]);
    let invoiceItemSummary = GroupBill.aggregate([
        {
            $match: selector
        },
        {
            $unwind: {path: '$invoices', preserveNullAndEmptyArrays: true}
        },
        {$unwind: {path: '$invoices.items', preserveNullAndEmptyArrays: true}},
        {
            $lookup: {
                from: "pos_item",
                localField: "invoices.items.itemId",
                foreignField: "_id",
                as: "itemDoc"
            }
        },
        {$unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}},
        {
            $group: {
                _id: '$invoices.items.itemId',
                itemName: {
                    $addToSet: '$itemDoc.name'
                },
                qty: {$sum: '$invoices.items.qty'},
                price: {$avg: '$invoices.items.price'},
                amount: {$sum: '$invoices.items.amount'}
            }
        },
        {$unwind: {path: '$itemName', preserveNullAndEmptyArrays: true}},
        {
            $sort: {itemName: 1}
        }
    ]);
    return {bills: groupBill, invoiceItemSummary};
}
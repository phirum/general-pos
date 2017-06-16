import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {AverageInventories} from '../../../imports/api/collections/inventory';
import {Branch} from '../../../../core/imports/api/collections/branch';
// lib func
import {correctFieldLabel} from '../../../imports/api/libs/correctFieldLabel';
import ReportFn from "../../../imports/api/libs/report";
export const stockDetailReportMethod = new ValidatedMethod({
    name: 'pos.stockDetailReport',
    mixins: [CallPromiseMixin],
    validate: null,
    run(params) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(200);
            let selector = {};
            let data = {
                title: {},
                fields: [],
                displayFields: [],
                content: [{index: 'No Result'}],
                footer: {}
            };
            let branchId = [];
            if (params.date) {
                let date = params.date.split(',');
                data.title.date = moment(date[0]).format('DD-MM-YYYY') + ' - ' + moment(date[1]).format('DD-MM-YYYY');
                selector.inventoryDate = {
                    $gte: moment(date[0]).startOf('days').toDate(),
                    $lte: moment(date[1]).endOf('days').toDate()
                };
            }
            console.log(selector.inventoryDate);
            if (params.branch) {
                let branch = '';
                let branchArr = params.branch.split(',');
                for (let i = 0; i < branchArr.length; i++) {
                    branch += Branch.findOne(branchArr[i]).khName + ', ' || '';
                }
                branchId = params.branch.split(',');
                data.title.branch = branch;
                selector.branchId = {
                    $in: branchId
                };
                selector = ReportFn.checkIfUserHasRights({currentUser: Meteor.userId(), selector});
            }
            if (params.items) {
                let items = params.items.split(',');
                selector.itemId = {
                    $in: items
                }
            }
            if (params.location) {
                let locations = params.location.split(',');
                selector.stockLocationId = {
                    $in: locations
                }
            }
            let inventoryDocs = AverageInventories.aggregate([
                {
                    $facet: {
                        stockDate: [
                            {
                                $match: selector
                            },
                            {$sort: {inventoryDate: 1, _id: 1}},
                            {
                                $project: {
                                    inventoryDate: 1
                                }
                            },
                            {
                                $group: {
                                    _id: {
                                        day: {$dayOfMonth: "$inventoryDate"},
                                        month: {$month: "$inventoryDate"},
                                        year: {$month: "$inventoryDate"}
                                    },
                                    items: {$last: {$ifNull: ["$Fkyou", []]}},
                                    inventoryDate: {$last: '$inventoryDate'}
                                }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    items: 1,
                                    inventoryDate: 1
                                }
                            }
                        ],
                        invoices: [
                            {
                                $match: {
                                    type: "invoice",
                                    inventoryDate: {
                                        $gte: selector.inventoryDate.$gte,
                                        $lte: selector.inventoryDate.$lte
                                    },
                                    branchId: handleUndefined(selector.branchId),
                                    stockLocationId: handleUndefined(selector.stockLocationId),
                                    itemId: handleUndefined(selector.itemId)
                                }
                            },
                            {
                                $group: groupLast()
                            },
                            {
                                $lookup: {
                                    from: 'pos_item',
                                    localField: 'itemId',
                                    foreignField: '_id',
                                    as: 'itemDoc'
                                }
                            },
                            {
                                $unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}
                            },
                            {
                                $lookup: {
                                    from: "pos_invoices",
                                    localField: "refId",
                                    foreignField: "_id",
                                    as: "invoiceDoc"
                                }
                            }, {
                                $unwind: {
                                    path: '$invoiceDoc', preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $lookup: {
                                    from: 'core_branch',
                                    localField: 'branchId',
                                    foreignField: '_id',
                                    as: 'branchDoc'
                                }
                            },
                            {
                                $unwind: {path: '$branchDoc', preserveNullAndEmptyArrays: true}
                            },

                            {
                                $project: projectionField({
                                    description: {$ifNull: ["$invoiceDescription", 'លក់ចេញ(Invoice)']},
                                    number: {$ifNull: ['$invoiceDoc.voucherId', '$invoiceDoc._id']},
                                    name: '$invoiceDoc._customer.name',
                                    rep: '$invoiceDoc._rep.name',
                                    item: '$itemDoc',
                                    opDate: '$invoiceDoc.invoiceDate'
                                })
                            }
                        ],
                        receiveItemsReturn: [
                            {
                                $match: {
                                    type: "receiveItem-return",
                                    inventoryDate: {
                                        $gte: selector.inventoryDate.$gte,
                                        $lte: selector.inventoryDate.$lte
                                    },
                                    branchId: handleUndefined(selector.branchId),
                                    stockLocationId: handleUndefined(selector.stockLocationId),
                                    itemId: handleUndefined(selector.itemId)
                                }
                            },
                            {
                                $group: groupLast()
                            },
                            {
                                $lookup: {
                                    from: 'pos_item',
                                    localField: 'itemId',
                                    foreignField: '_id',
                                    as: 'itemDoc'
                                }
                            },
                            {
                                $unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}
                            },
                            {
                                $lookup: {
                                    from: "pos_receiveItems",
                                    localField: "refId",
                                    foreignField: "_id",
                                    as: "receiveItemDoc"
                                }
                            }, {
                                $unwind: {
                                    path: '$receiveItemDoc', preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $lookup: {
                                    from: 'core_branch',
                                    localField: 'branchId',
                                    foreignField: '_id',
                                    as: 'branchDoc'
                                }
                            },
                            {
                                $unwind: {path: '$branchDoc', preserveNullAndEmptyArrays: true}
                            },

                            {
                                $project: projectionField({
                                    description: {$ifNull: ["$invoiceDescription", 'Receive Item Out']},
                                    number: {$ifNull: ['$receiveItemDoc.voucherId', '$receiveItemDoc._id']},
                                    name: '$receiveItemDoc._vendor.name',
                                    rep: '$receiveItemDoc._rep.name',
                                    item: '$itemDoc',
                                    opDate: '$receiveItemDoc.receiveItemDate'
                                })
                            }
                        ],
                        reduceFromBills: [
                            {
                                $match: {
                                    type: "reduce-from-bill",
                                    inventoryDate: {
                                        $gte: selector.inventoryDate.$gte,
                                        $lte: selector.inventoryDate.$lte
                                    },
                                    branchId: handleUndefined(selector.branchId),
                                    stockLocationId: handleUndefined(selector.stockLocationId),
                                    itemId: handleUndefined(selector.itemId)
                                }
                            },
                            {
                                $group: groupLast()
                            },
                            {
                                $lookup: {
                                    from: 'pos_item',
                                    localField: 'itemId',
                                    foreignField: '_id',
                                    as: 'itemDoc'
                                }
                            },
                            {
                                $unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}
                            },
                            {
                                $lookup: {
                                    from: "pos_enterBills",
                                    localField: "refId",
                                    foreignField: "_id",
                                    as: "enterBillDoc"
                                }
                            }, {
                                $unwind: {
                                    path: '$enterBillDoc', preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $lookup: {
                                    from: 'core_branch',
                                    localField: 'branchId',
                                    foreignField: '_id',
                                    as: 'branchDoc'
                                }
                            },
                            {
                                $unwind: {path: '$branchDoc', preserveNullAndEmptyArrays: true}
                            },

                            {
                                $project: projectionField({
                                    description: {$ifNull: ["$enterBillDoc.description", {$concat: ["Reduce From Bill #", "$enterBillDoc._id"]}]},
                                    number: {$ifNull: ['$enterBillDoc.voucherId', '$enterBillDoc._id']},
                                    name: '$enterBillDoc._vendor.name',
                                    rep: '$enterBillDoc._rep.name',
                                    item: '$itemDoc',
                                    opDate: '$enterBillDoc.enterBillDate'
                                })
                            }
                        ],
                        invoicesReturn: [
                            {
                                $match: {
                                    type: "invoice-return",
                                    inventoryDate: {
                                        $gte: selector.inventoryDate.$gte,
                                        $lte: selector.inventoryDate.$lte
                                    },
                                    branchId: handleUndefined(selector.branchId),
                                    stockLocationId: handleUndefined(selector.stockLocationId),
                                    itemId: handleUndefined(selector.itemId)
                                }
                            },
                            {
                                $group: groupLast()
                            },
                            {
                                $lookup: {
                                    from: 'pos_item',
                                    localField: 'itemId',
                                    foreignField: '_id',
                                    as: 'itemDoc'
                                }
                            },
                            {
                                $unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}
                            },
                            {
                                $lookup: {
                                    from: "pos_invoices",
                                    localField: "refId",
                                    foreignField: "_id",
                                    as: "invoiceDoc"
                                }
                            }, {
                                $unwind: {
                                    path: '$invoiceDoc', preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $lookup: {
                                    from: 'core_branch',
                                    localField: 'branchId',
                                    foreignField: '_id',
                                    as: 'branchDoc'
                                }
                            },
                            {
                                $unwind: {path: '$branchDoc', preserveNullAndEmptyArrays: true}
                            },

                            {
                                $project: projectionField({
                                    description: {$ifNull: ["$fk", 'INVOICE RETURN']},
                                    number: {$ifNull: ['$invoiceDoc.voucherId', '$invoiceDoc._id']},
                                    name: '$invoiceDoc._customer.name',
                                    rep: '$invoiceDoc._rep.name',
                                    item: '$itemDoc',
                                    opDate: '$invoiceDoc.invoiceDate'
                                })
                            }
                        ],
                        exchangeRingPullsReturn: [
                            {
                                $match: {
                                    type: "exchangeRingPull-return",
                                    inventoryDate: {
                                        $gte: selector.inventoryDate.$gte,
                                        $lte: selector.inventoryDate.$lte
                                    },
                                    branchId: handleUndefined(selector.branchId),
                                    stockLocationId: handleUndefined(selector.stockLocationId),
                                    itemId: handleUndefined(selector.itemId)
                                }
                            },
                            {
                                $group: groupLast()
                            },
                            {
                                $lookup: {
                                    from: 'pos_item',
                                    localField: 'itemId',
                                    foreignField: '_id',
                                    as: 'itemDoc'
                                }
                            },
                            {
                                $unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}
                            },
                            {
                                $lookup: {
                                    from: "pos_exchangeRingPulls",
                                    localField: "refId",
                                    foreignField: "_id",
                                    as: "exchangeRingPullDoc"
                                }
                            }, {
                                $unwind: {
                                    path: '$exchangeRingPullDoc', preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $lookup: {
                                    from: 'core_branch',
                                    localField: 'branchId',
                                    foreignField: '_id',
                                    as: 'branchDoc'
                                }
                            },
                            {
                                $unwind: {path: '$branchDoc', preserveNullAndEmptyArrays: true}
                            },

                            {
                                $project: projectionField({
                                    description: {$ifNull: ["$fk", 'Exchange Ringpull Return']},
                                    number: {$ifNull: ['$exchangeRingPullDoc.voucherId', '$exchangeRingPullDoc._id']},
                                    name: '$exchangeRingPullDoc._customer.name',
                                    rep: '$exchangeRingPullDoc._rep.name',
                                    item: '$itemDoc',
                                    opDate: '$exchangeRingPullDoc.exchangeRingPullDate'
                                })
                            }
                        ],
                        lendingStocksReturn: [
                            {
                                $match: {
                                    type: "lendingStock-return",
                                    inventoryDate: {
                                        $gte: selector.inventoryDate.$gte,
                                        $lte: selector.inventoryDate.$lte
                                    },
                                    branchId: handleUndefined(selector.branchId),
                                    stockLocationId: handleUndefined(selector.stockLocationId),
                                    itemId: handleUndefined(selector.itemId)
                                }
                            },
                            {
                                $group: groupLast()
                            },
                            {
                                $lookup: {
                                    from: 'pos_item',
                                    localField: 'itemId',
                                    foreignField: '_id',
                                    as: 'itemDoc'
                                }
                            },
                            {
                                $unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}
                            },
                            {
                                $lookup: {
                                    from: "pos_lendingStocks",
                                    localField: "refId",
                                    foreignField: "_id",
                                    as: "lendingStockDoc"
                                }
                            }, {
                                $unwind: {
                                    path: '$lendingStockDoc', preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $lookup: {
                                    from: 'core_branch',
                                    localField: 'branchId',
                                    foreignField: '_id',
                                    as: 'branchDoc'
                                }
                            },
                            {
                                $unwind: {path: '$branchDoc', preserveNullAndEmptyArrays: true}
                            },

                            {
                                $project: projectionField({
                                    description: {$ifNull: ["$fk", 'Lending Stock Return']},
                                    number: {$ifNull: ['$lendingStock.voucherId', '$lendingStock._id']},
                                    name: '$lendingStockDoc._customer.name',
                                    rep: '$lendingStockDoc._rep.name',
                                    item: '$itemDoc',
                                    opDate: '$lendingStock.lendingStockDate'
                                })
                            }
                        ],
                        invoicesFree: [
                            {
                                $match: {
                                    type: "invoice-free",
                                    inventoryDate: {
                                        $gte: selector.inventoryDate.$gte,
                                        $lte: selector.inventoryDate.$lte
                                    },
                                    branchId: handleUndefined(selector.branchId),
                                    stockLocationId: handleUndefined(selector.stockLocationId),
                                    itemId: handleUndefined(selector.itemId)
                                }
                            },
                            {
                                $group: groupLast()
                            },
                            {
                                $lookup: {
                                    from: 'pos_item',
                                    localField: 'itemId',
                                    foreignField: '_id',
                                    as: 'itemDoc'
                                }
                            },
                            {
                                $unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}
                            },
                            {
                                $lookup: {
                                    from: "pos_invoices",
                                    localField: "refId",
                                    foreignField: "_id",
                                    as: "invoiceDoc"
                                }
                            }, {
                                $unwind: {
                                    path: '$invoiceDoc', preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $lookup: {
                                    from: 'core_branch',
                                    localField: 'branchId',
                                    foreignField: '_id',
                                    as: 'branchDoc'
                                }
                            },
                            {
                                $unwind: {path: '$branchDoc', preserveNullAndEmptyArrays: true}
                            },

                            {
                                $project: projectionField({
                                    description: {$ifNull: ["$invoiceDescription", 'Free Item(Invoice)']},
                                    number: {$ifNull: ['$invoiceDoc.voucherId', '$invoiceDoc._id']},
                                    name: '$invoiceDoc._customer.name',
                                    rep: '$invoiceDoc._rep.name',
                                    item: '$itemDoc',
                                    opDate: '$invoiceDoc.invoiceDate'
                                })
                            }
                        ],
                        bills: [
                            {
                                $match: {
                                    $or: [{type: "insert-bill"}],
                                    inventoryDate: {
                                        $gte: selector.inventoryDate.$gte,
                                        $lte: selector.inventoryDate.$lte
                                    },
                                    branchId: handleUndefined(selector.branchId),
                                    stockLocationId: handleUndefined(selector.stockLocationId),
                                    itemId: handleUndefined(selector.itemId)
                                }
                            },
                            {
                                $group: groupLast()
                            },
                            {
                                $lookup: {
                                    from: "pos_enterBills",
                                    localField: "refId",
                                    foreignField: "_id",
                                    as: "billDoc"
                                }
                            }, {
                                $unwind: {
                                    path: '$billDoc', preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $lookup: {
                                    from: 'pos_item',
                                    localField: 'itemId',
                                    foreignField: '_id',
                                    as: 'itemDoc'
                                }
                            },
                            {
                                $unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}
                            },
                            {
                                $lookup: {
                                    from: 'core_branch',
                                    localField: 'branchId',
                                    foreignField: '_id',
                                    as: 'branchDoc'
                                }
                            },
                            {
                                $unwind: {path: '$branchDoc', preserveNullAndEmptyArrays: true}
                            },
                            {
                                $project: projectionField({
                                    description: {$ifNull: ["$billDescription", 'ទិញចូល(Purchase)']},
                                    number: {$ifNull: ['$billDoc.voucherId', '$billDoc._id']},
                                    name: '$billDoc._vendor.name',
                                    rep: {$ifNull: ["$billDoc._rep.name", ""]},
                                    item: '$itemDoc',
                                    opDate: '$billDoc.enterBillDate'
                                })

                            }
                        ],
                        enterBills: [
                            {
                                $match: {
                                    $or: [{type: "enterBill"}],
                                    inventoryDate: {
                                        $gte: selector.inventoryDate.$gte,
                                        $lte: selector.inventoryDate.$lte
                                    },
                                    branchId: handleUndefined(selector.branchId),
                                    stockLocationId: handleUndefined(selector.stockLocationId),
                                    itemId: handleUndefined(selector.itemId)
                                }
                            },
                            {
                                $group: groupLast()
                            },
                            {
                                $lookup: {
                                    from: "pos_enterBills",
                                    localField: "refId",
                                    foreignField: "_id",
                                    as: "billDoc"
                                }
                            }, {
                                $unwind: {
                                    path: '$billDoc', preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $lookup: {
                                    from: 'pos_item',
                                    localField: 'itemId',
                                    foreignField: '_id',
                                    as: 'itemDoc'
                                }
                            },
                            {
                                $unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}
                            },
                            {
                                $lookup: {
                                    from: 'core_branch',
                                    localField: 'branchId',
                                    foreignField: '_id',
                                    as: 'branchDoc'
                                }
                            },
                            {
                                $unwind: {path: '$branchDoc', preserveNullAndEmptyArrays: true}
                            },
                            {
                                $project: projectionField({
                                    description: {$ifNull: ["$billDescription", {$concat: ["Update EnterBill #", "$billDoc._id"]}]},
                                    number: {$ifNull: ['$billDoc.voucherId', '$billDoc._id']},
                                    name: '$billDoc._vendor.name',
                                    rep: {$ifNull: ["$billDoc._rep.name", ""]},
                                    item: '$itemDoc',
                                    opDate: '$billDoc.enterBillDate'
                                })

                            }
                        ],
                        lendingStocks: [
                            {
                                $match: {
                                    type: "lendingStock",
                                    inventoryDate: {
                                        $gte: selector.inventoryDate.$gte,
                                        $lte: selector.inventoryDate.$lte
                                    },
                                    branchId: handleUndefined(selector.branchId),
                                    stockLocationId: handleUndefined(selector.stockLocationId),
                                    itemId: handleUndefined(selector.itemId)
                                }
                            },
                            {
                                $group: groupLast()
                            },
                            {
                                $lookup: {
                                    from: "pos_lendingStocks",
                                    localField: "refId",
                                    foreignField: "_id",
                                    as: "lendingStockDoc"
                                }
                            }, {
                                $unwind: {
                                    path: '$lendingStockDoc', preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $lookup: {
                                    from: 'pos_item',
                                    localField: 'itemId',
                                    foreignField: '_id',
                                    as: 'itemDoc'
                                }
                            },
                            {
                                $unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}
                            },
                            {
                                $lookup: {
                                    from: 'core_branch',
                                    localField: 'branchId',
                                    foreignField: '_id',
                                    as: 'branchDoc'
                                }
                            },
                            {
                                $unwind: {path: '$branchDoc', preserveNullAndEmptyArrays: true}
                            },
                            {
                                $project: projectionField({
                                    description: {$ifNull: ["$lendingStockDescription", 'ខ្ចីស្តុក(Lending Stock)']},
                                    number: {$ifNull: ['$lendingStockDoc.voucherId', '$lendingStockDoc._id']},
                                    name: '$lendingStockDoc._vendor.name',
                                    item: '$itemDoc',
                                    opDate: '$lendingStockDoc.lendingStockDate'
                                })

                            }
                        ],
                        exchangeRingPulls: [
                            {
                                $match: {
                                    $or: [{type: "exchangeRingPull"}, {type: "exchangeRillPull"}],
                                    inventoryDate: {
                                        $gte: selector.inventoryDate.$gte,
                                        $lte: selector.inventoryDate.$lte
                                    },
                                    branchId: handleUndefined(selector.branchId),
                                    stockLocationId: handleUndefined(selector.stockLocationId),
                                    itemId: handleUndefined(selector.itemId)
                                }
                            },
                            {
                                $group: groupLast()
                            },
                            {
                                $lookup: {
                                    from: "pos_exchangeRingPulls",
                                    localField: "refId",
                                    foreignField: "_id",
                                    as: "exchangeRingPullDoc"
                                }
                            }, {
                                $unwind: {
                                    path: '$exchangeRingPullDoc', preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $lookup: {
                                    from: 'pos_item',
                                    localField: 'itemId',
                                    foreignField: '_id',
                                    as: 'itemDoc'
                                }
                            },
                            {
                                $unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}
                            },
                            {
                                $lookup: {
                                    from: 'core_branch',
                                    localField: 'branchId',
                                    foreignField: '_id',
                                    as: 'branchDoc'
                                }
                            },
                            {
                                $unwind: {path: '$branchDoc', preserveNullAndEmptyArrays: true}
                            },
                            {
                                $project: projectionField({
                                    description: {$ifNull: ["$exchangeRingPullDescription", 'ប្តូរក្រវិលអោយអតិថិជន(Exchange Ring Pull)']},
                                    number: {$ifNull: ['$exchangeRingPullDoc.voucherId', '$exchangeRingPullDoc._id']},
                                    name: {$ifNull: ["$exchangeRingPullDoc.fkyou", "ក្រវិល"]},
                                    rep: {$ifNull: ["$exchangeRingPullDoc._rep.name", ""]},
                                    item: '$itemDoc',
                                    opDate: '$exchangeRingPullDoc.exchangeRingPullDate'
                                })

                            }

                        ],
                        receiveBeers: [
                            {
                                $match: {
                                    type: "receiveItem",
                                    inventoryDate: {
                                        $gte: selector.inventoryDate.$gte,
                                        $lte: selector.inventoryDate.$lte
                                    },
                                    branchId: handleUndefined(selector.branchId),
                                    stockLocationId: handleUndefined(selector.stockLocationId),
                                    itemId: handleUndefined(selector.itemId)
                                }
                            },
                            {
                                $group: groupLast()
                            },
                            {
                                $lookup: {
                                    from: "pos_receiveItems",
                                    localField: "refId",
                                    foreignField: "_id",
                                    as: "receiveItemDoc"
                                }
                            }, {
                                $unwind: {
                                    path: '$receiveItemDoc', preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $lookup: {
                                    from: 'pos_item',
                                    localField: 'itemId',
                                    foreignField: '_id',
                                    as: 'itemDoc'
                                }
                            },
                            {
                                $unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}
                            },
                            {
                                $lookup: {
                                    from: 'core_branch',
                                    localField: 'branchId',
                                    foreignField: '_id',
                                    as: 'branchDoc'
                                }
                            },
                            {
                                $unwind: {path: '$branchDoc', preserveNullAndEmptyArrays: true}
                            },
                            {
                                $project: projectionField({
                                    description: {$ifNull: ["$receiveBeerDescription", 'ទទួលស្រាបៀរ(Receive Beer)']},
                                    number: {$ifNull: ['$receiveItemDoc.voucherId', '$receiveItemDoc._id']},
                                    name: '$receiveItemDoc._vendor.name',
                                    rep: {$ifNull: ['$receiveItemDoc._rep.name', '']},
                                    item: '$itemDoc',
                                    opDate: '$receiveItemDoc.receiveItemDate'
                                })
                            }
                        ],
                        transferTo: [
                            {
                                $match: {
                                    type: "transfer-to",
                                    inventoryDate: {
                                        $gte: selector.inventoryDate.$gte,
                                        $lte: selector.inventoryDate.$lte
                                    },
                                    branchId: handleUndefined(selector.branchId),
                                    stockLocationId: handleUndefined(selector.stockLocationId),
                                    itemId: handleUndefined(selector.itemId)
                                }
                            },
                            {
                                $group: groupLast()
                            },
                            {
                                $lookup: {
                                    from: "pos_locationTransfers",
                                    localField: "refId",
                                    foreignField: "_id",
                                    as: "transferToDoc"
                                }
                            }, {
                                $unwind: {
                                    path: '$transferToDoc', preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $lookup: {
                                    from: 'pos_item',
                                    localField: 'itemId',
                                    foreignField: '_id',
                                    as: 'itemDoc'
                                }
                            },
                            {
                                $unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}
                            },
                            {
                                $lookup: {
                                    from: 'core_branch',
                                    localField: 'branchId',
                                    foreignField: '_id',
                                    as: 'branchDoc'
                                }
                            },
                            {
                                $unwind: {path: '$branchDoc', preserveNullAndEmptyArrays: true}
                            },
                            {
                                $project: projectionField({
                                    description: {$ifNull: ["$transferDescription", '']},
                                    number: {$ifNull: ['$transferToDoc.voucherId', '$transferToDoc._id']},
                                    name: {$concat: ["ផ្ទេរចូលមកពី", "$transferToDoc._fromBranch.khName", "(Transfer From ", "$transferToDoc._fromBranch.enName", ")"]},
                                    rep: {$ifNull: ['$transferToDoc._rep.name', ""]},
                                    item: '$itemDoc',
                                    opDate: '$transferToDoc.locationTransferDate'
                                })
                            }
                        ],
                        transferFrom: [
                            {
                                $match: {
                                    type: "transfer-from",
                                    inventoryDate: {
                                        $gte: selector.inventoryDate.$gte,
                                        $lte: selector.inventoryDate.$lte
                                    },
                                    branchId: handleUndefined(selector.branchId),
                                    stockLocationId: handleUndefined(selector.stockLocationId),
                                    itemId: handleUndefined(selector.itemId)
                                }
                            },
                            {
                                $group: groupLast()
                            },
                            {
                                $lookup: {
                                    from: "pos_locationTransfers",
                                    localField: "refId",
                                    foreignField: "_id",
                                    as: "transferFromDoc"
                                }
                            }, {
                                $unwind: {
                                    path: '$transferFromDoc', preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $lookup: {
                                    from: 'pos_item',
                                    localField: 'itemId',
                                    foreignField: '_id',
                                    as: 'itemDoc'
                                }
                            },
                            {
                                $unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}
                            },
                            {
                                $lookup: {
                                    from: 'core_branch',
                                    localField: 'branchId',
                                    foreignField: '_id',
                                    as: 'branchDoc'
                                }
                            },
                            {
                                $unwind: {path: '$branchDoc', preserveNullAndEmptyArrays: true}
                            },
                            {
                                $project: projectionField({
                                    description: {$ifNull: ["$transferDescription", '']},
                                    number: {$ifNull: ['$transferFromDoc.voucherId', '$transferFromDoc._id']},
                                    name: {$concat: ["ផ្ទេរចេញទៅ", "$transferFromDoc._toBranch.khName", "(Transfer To", "$transferFromDoc._toBranch.enName", ")"]},
                                    rep: {$ifNull: ["$transferFromDoc._rep.name", ""]},
                                    item: '$itemDoc',
                                    opDate: '$transferFromDoc.locationTransferDate'

                                })
                            }
                        ]
                    },

                }
            ]);
            if (inventoryDocs[0].stockDate.length > 0) {
                inventoryDocs[0].stockDate.forEach(function (obj) {
                    var currentStockDate = moment(obj.inventoryDate).format('YYYY-MM-DD');
                    inventoryDocs[0].bills.forEach(function (bill) {
                        if (moment(currentStockDate).isSame(moment(bill.inventoryDate).format('YYYY-MM-DD'))) {
                            obj.items.push(bill);
                        }
                    });
                    inventoryDocs[0].enterBills.forEach(function (bill) {
                        if (moment(currentStockDate).isSame(moment(bill.inventoryDate).format('YYYY-MM-DD'))) {
                            obj.items.push(bill);
                        }
                    });
                    inventoryDocs[0].receiveBeers.forEach(function (receiveBeer) {
                        if (moment(currentStockDate).isSame(moment(receiveBeer.inventoryDate).format('YYYY-MM-DD'))) {
                            obj.items.push(receiveBeer);
                        }
                    });
                    inventoryDocs[0].invoices.forEach(function (invoice) {
                        if (moment(currentStockDate).isSame(moment(invoice.inventoryDate).format('YYYY-MM-DD'))) {
                            obj.items.push(invoice);
                        }
                    });
                    inventoryDocs[0].invoicesFree.forEach(function (invoice) {
                        if (moment(currentStockDate).isSame(moment(invoice.inventoryDate).format('YYYY-MM-DD'))) {
                            obj.items.push(invoice);
                        }
                    });
                    inventoryDocs[0].invoicesReturn.forEach(function (invoice) {
                        if (moment(currentStockDate).isSame(moment(invoice.inventoryDate).format('YYYY-MM-DD'))) {
                            obj.items.push(invoice);
                        }
                    });
                    inventoryDocs[0].exchangeRingPullsReturn.forEach(function (invoice) {
                        if (moment(currentStockDate).isSame(moment(invoice.inventoryDate).format('YYYY-MM-DD'))) {
                            obj.items.push(invoice);
                        }
                    });
                    inventoryDocs[0].lendingStocksReturn.forEach(function (invoice) {
                        if (moment(currentStockDate).isSame(moment(invoice.inventoryDate).format('YYYY-MM-DD'))) {
                            obj.items.push(invoice);
                        }
                    });
                    inventoryDocs[0].receiveItemsReturn.forEach(function (invoice) {
                        if (moment(currentStockDate).isSame(moment(invoice.inventoryDate).format('YYYY-MM-DD'))) {
                            obj.items.push(invoice);
                        }
                    });
                    inventoryDocs[0].reduceFromBills.forEach(function (invoice) {
                        if (moment(currentStockDate).isSame(moment(invoice.inventoryDate).format('YYYY-MM-DD'))) {
                            obj.items.push(invoice);
                        }
                    });
                    inventoryDocs[0].lendingStocks.forEach(function (lendingStock) {
                        if (moment(currentStockDate).isSame(moment(lendingStock.inventoryDate).format('YYYY-MM-DD'))) {
                            obj.items.push(lendingStock);
                        }
                    });
                    inventoryDocs[0].exchangeRingPulls.forEach(function (exchangeRingPull) {
                        if (moment(currentStockDate).isSame(moment(exchangeRingPull.inventoryDate).format('YYYY-MM-DD'))) {
                            obj.items.push(exchangeRingPull);
                        }
                    });
                    inventoryDocs[0].transferTo.forEach(function (transfer) {
                        if (moment(currentStockDate).isSame(moment(transfer.inventoryDate).format('YYYY-MM-DD'))) {
                            obj.items.push(transfer);
                        }
                    });
                    inventoryDocs[0].transferFrom.forEach(function (transfer) {
                        if (moment(currentStockDate).isSame(moment(transfer.inventoryDate).format('YYYY-MM-DD'))) {
                            obj.items.push(transfer);
                        }
                    });
                });
                inventoryDocs[0].stockDate.sort(compare);
                for (let i = 0; i < inventoryDocs[0].stockDate.length; i++) {
                    inventoryDocs[0].stockDate[i].items.sort(compareCreated);
                }
                data.content = inventoryDocs[0].stockDate;
            }
            return data;
        }
    }
});


function correctDotObject(prop, forLabel) {
    let projectField = '';
    switch (prop) {
        case 'lastDoc.itemDoc.name':
            projectField = 'item';
            break;
        case 'lastDoc.price':
            projectField = 'price';
            break;
        case 'lastDoc.branchDoc.enShortName':
            projectField = 'branch';
            break;
        case 'lastDoc.locationDoc.name':
            projectField = 'location';
            break;
        case 'lastDoc.itemDoc._unit.name':
            projectField = 'unit';
            break;
    }

    return forLabel ? _.capitalize(projectField) : projectField;
}


function projectionField({item, description, name, number, rep, opDate}) {
    return {
        _id: 1,
        branchId: 1,
        branchDoc: 1,
        stockLocationId: 1,
        itemId: 1,
        qty: 1,
        price: 1,
        amount: 1,
        lastAmount: 1,
        remainQty: 1,
        averagePrice: 1,
        type: 1,
        coefficient: 1,
        refId: 1,
        inventoryDate: 1,
        createdAt: 1,
        number: number,
        rep: rep,
        description: description,
        name: name,
        item: item,
        opDate: opDate
    }
}
function groupLast() {
    return {
        _id: '$refId',
        branchId: {$last: '$branchId'},
        stockLocationId: {$last: '$stockLocationId'},
        itemId: {$last: '$itemId'},
        qty: {$last: '$qty'},
        price: {$last: '$price'},
        amount: {$last: '$amount'},
        lastAmount: {$last: '$lastAmount'},
        remainQty: {$last: '$remainQty'},
        averagePrice: {$last: '$averagePrice'},
        type: {$last: '$type'},
        coefficient: {$last: '$coefficient'},
        refId: {$last: '$refId'},
        inventoryDate: {$last: '$inventoryDate'},
        createdAt: {$last: '$createdAt'}
    }
}
function handleUndefined(value) {
    if (!value) {
        return {$ne: value || ''}
    }
    return value
}
function compare(a, b) {
    if (a.inventoryDate < b.inventoryDate)
        return -1;
    if (a.inventoryDate > b.inventoryDate)
        return 1;
    return 0;
}
function compareCreated(a, b) {
    if (a.createdAt < b.createdAt)
        return -1;
    if (a.createdAt > b.createdAt)
        return 1;
    return 0;
}
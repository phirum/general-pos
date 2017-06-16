import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {CompanyExchangeRingPulls} from '../../../imports/api/collections/companyExchangeRingPull';
import {RingPullTransfers} from '../../../imports/api/collections/ringPullTransfer';
import {ExchangeRingPulls} from '../../../imports/api/collections/exchangeRingPull';
import {Item} from '../../../imports/api/collections/item';
import {Branch} from '../../../../core/imports/api/collections/branch';
// lib func
import {correctFieldLabel} from '../../../imports/api/libs/correctFieldLabel';
export const ringPullSummaryReport = new ValidatedMethod({
    name: 'pos.ringPullSummaryReport',
    mixins: [CallPromiseMixin],
    validate: null,
    run(params) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(200);
            let itemSelector = {};
            let companySelector = {};
            let ringpullTransferSelector = {};
            let ringpullTransferInSelector = {};
            let exchangeSelector = {};
            let project = {};
            let subOneMonth;
            let data = {
                title: {item: 'All'},
                fields: [],
                displayFields: [],
                content: [{index: 'No Result'}],
                footer: {}
            };
            let branch = [];
            if (params.branchId) {
                companySelector.branchId = params.branchId;
                ringpullTransferSelector.fromBranchId = params.branchId;
                ringpullTransferInSelector.toBranchId = params.branchId;
                ringpullTransferInSelector.status = 'closed';
                ringpullTransferInSelector.pending = false;
                exchangeSelector.branchId = params.branchId;
            } else {
                return data;
            }
            if (params.itemId) {
                let concatItem = '';
                itemSelector['items.itemId'] = {$in: params.itemId.split(',')};
                let items = Item.find({_id: {$in: params.itemId.split(',')}});
                items.forEach(function (item) {
                    concatItem += `${item.name}, `;
                });
                data.title.item = concatItem;
            } else {
                itemSelector['items.itemId'] = {$exists: true}
            }
            let startOfMonth;
            let endOfMonth;
            if (params.asDate) {
                let toDate = moment(params.asDate).endOf('days').toDate();
                startOfMonth = moment(params.asDate).startOf('months').toDate();
                endOfMonth = moment(params.asDate).endOf('months').toDate();
                subOneMonth = moment(params.asDate).subtract(1, 'months').endOf('months').toDate();
                data.title.branch = Branch.findOne({_id: params.branchId});
                data.title.date = moment(toDate).format('DD/MM/YYYY');
                companySelector.companyExchangeRingPullDate = {$lte: toDate};
                exchangeSelector.exchangeRingPullDate = {$lte: toDate};
                ringpullTransferSelector.ringPullTransferDate = {$lte: toDate};
                ringpullTransferSelector.status = 'closed';
                ringpullTransferSelector.pending = false;
            } else {
                return data;
            }
            let companyExchange = CompanyExchangeRingPulls.aggregate([
                {$match: companySelector},
                {
                    $unwind: {path: '$items', preserveNullAndEmptyArrays: true}
                },
                {
                    $match: itemSelector
                },
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
                    $lookup: {
                        from: 'pos_vendors',
                        localField: 'vendorId',
                        foreignField: '_id',
                        as: 'vendorDoc'
                    }
                },
                {
                    $unwind: {path: '$vendorDoc', preserveNullAndEmptyArrays: true}
                },
                {
                    $project: {
                        _id: 0,
                        date: '$companyExchangeRingPullDate',
                        inv: '$_id',
                        des: 1,
                        itemDoc: 1,
                        items: 1,
                        name: '$vendorDoc.name',
                        type: {$ifNull: ["$fake", 'out']},
                        exchangeRP: {$ifNull: ["$fake", 0]},
                        cExchangeRP: {$ifNull: ["$items.qty", 0]},
                        transferRP: {$ifNull: ["$fake", 0]},
                        receiveTransfer: {$ifNull: ["$fake", 0]},
                    }
                },
                {
                    $group: {
                        _id: '$items.itemId',
                        items: {$last: '$items'},
                        type: {$last: '$type'},
                        date: {$last: '$date'},
                        name: {$last: '$name'},
                        price: {$avg: '$items.price'},
                        itemData: {$push: '$$ROOT'},
                        exchangeRP: {$sum: aggMatchingDate(startOfMonth, endOfMonth, '$date', '$exchangeRP')},
                        cExchangeRP: {$sum: aggMatchingDate(startOfMonth, endOfMonth, '$date', '$cExchangeRP')},
                        transferRP: {$sum: aggMatchingDate(startOfMonth, endOfMonth, '$date', '$transferRP')},
                        receiveTransfer: {$sum: aggMatchingDate(startOfMonth, endOfMonth, '$date', '$receiveTransfer')},
                        itemDoc: {$last: '$itemDoc'},
                    }
                },
                {
                    $project: {
                        _id: 1,
                        items: 1,
                        type: 1,
                        name: 1,
                        exchangeRP: 1,
                        cExchangeRP: 1,
                        price: 1,
                        transferRP: 1,
                        itemDoc: 1,
                        receiveTransfer: 1,
                        itemData: {
                            $filter: {
                                input: '$itemData',
                                as: 'item',
                                cond: {$lte: ['$$item.date', subOneMonth]}
                            }
                        }
                    }
                }
            ]);
            let exchangeRingPull = ExchangeRingPulls.aggregate([
                {$match: exchangeSelector},
                {
                    $unwind: {path: '$items', preserveNullAndEmptyArrays: true}
                },
                {
                    $match: itemSelector
                },
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
                    $lookup: {
                        from: 'pos_customers',
                        localField: 'customerId',
                        foreignField: '_id',
                        as: 'customerDoc'
                    }
                },
                {$unwind: {path: '$customerDoc', preserveNullAndEmptyArrays: true}},
                {
                    $project: {
                        date: '$exchangeRingPullDate',
                        inv: '$_id',
                        des: 1,
                        itemDoc: 1,
                        name: '$customerDoc.name',
                        items: 1,
                        type: {$ifNull: ["$fake", 'in']},
                        exchangeRP: {$ifNull: ["$items.qty", 0]},
                        cExchangeRP: {$ifNull: ["$fake", 0]},
                        transferRP: {$ifNull: ["$fake", 0]},
                        receiveTransfer: {$ifNull: ["$fake", 0]},
                    }
                },
                {
                    $group: {
                        _id: '$items.itemId',
                        items: {$last: '$items'},
                        type: {$last: '$type'},
                        name: {$last: '$name'},
                        price: {$avg: '$items.price'},
                        itemDoc: {$last: '$itemDoc'},
                        date: {$last: '$date'},
                        itemData: {$push: '$$ROOT'},
                        exchangeRP: {$sum: aggMatchingDate(startOfMonth, endOfMonth, '$date', '$exchangeRP')},
                        cExchangeRP: {$sum: aggMatchingDate(startOfMonth, endOfMonth, '$date', '$cExchangeRP')},
                        transferRP: {$sum: aggMatchingDate(startOfMonth, endOfMonth, '$date', '$transferRP')},
                        receiveTransfer: {$sum: aggMatchingDate(startOfMonth, endOfMonth, '$date', '$receiveTransfer')},
                    }
                },
                {
                    $project: {
                        _id: 1,
                        items: 1,
                        type: 1,
                        price: 1,
                        name: 1,
                        itemDoc: 1,
                        exchangeRP: 1,
                        cExchangeRP: 1,
                        transferRP: 1,
                        receiveTransfer: 1,
                        itemData: {
                            $filter: {
                                input: '$itemData',
                                as: 'item',
                                cond: {$lte: ['$$item.date', subOneMonth]}
                            }
                        }
                    }
                }
            ]);
            let ringPullTransferOut = RingPullTransfers.aggregate([
                {$match: ringpullTransferSelector},
                {
                    $unwind: {path: '$items', preserveNullAndEmptyArrays: true}
                },
                {
                    $match: itemSelector
                },
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
                    $lookup: {
                        from: 'core_branch',
                        localField: 'fromBranchId',
                        foreignField: '_id',
                        as: 'branchDoc'
                    }
                },
                {
                    $unwind: {path: '$branchDoc', preserveNullAndEmptyArrays: true}
                },
                {
                    $project: {
                        _id: 0,
                        date: '$ringPullTransferDate',
                        inv: '$_id',
                        des: 1,
                        itemDoc: 1,
                        items: 1,
                        name: '$branchDoc.khName',
                        type: {$ifNull: ["$fake", 'out']},
                        exchangeRP: {$ifNull: ["$fake", 0]},
                        cExchangeRP: {$ifNull: ["$fake", 0]},
                        transferRP: {$ifNull: ["$items.qty", 0]},
                        receiveTransfer: {$ifNull: ["$fake", 0]},
                    }
                },
                {
                    $group: {
                        _id: '$items.itemId',
                        items: {$last: '$items'},
                        date: {$last: '$date'},
                        type: {$last: '$type'},
                        name: {$last: '$name'},
                        price: {$avg: '$items.price'},
                        itemData: {$push: '$$ROOT'},
                        exchangeRP: {$sum: aggMatchingDate(startOfMonth, endOfMonth, '$date', '$exchangeRP')},
                        cExchangeRP: {$sum: aggMatchingDate(startOfMonth, endOfMonth, '$date', '$cExchangeRP')},
                        transferRP: {$sum: aggMatchingDate(startOfMonth, endOfMonth, '$date', '$transferRP')},
                        receiveTransfer: {$sum: aggMatchingDate(startOfMonth, endOfMonth, '$date', '$receiveTransfer')},
                        itemDoc: {$last: '$itemDoc'},
                    }
                },
                {
                    $project: {
                        _id: 1,
                        itemDoc: 1,
                        items: 1,
                        type: 1,
                        name: 1,
                        exchangeRP: 1,
                        cExchangeRP: 1,
                        transferRP: 1,
                        price: 1,
                        receiveTransfer: 1,
                        itemData: {
                            $filter: {
                                input: '$itemData',
                                as: 'item',
                                cond: {$lte: ['$$item.date', subOneMonth]}
                            }
                        }
                    }
                }
            ]);
            let ringPullTransferIn = RingPullTransfers.aggregate([
                {$match: ringpullTransferInSelector},
                {
                    $unwind: {path: '$items', preserveNullAndEmptyArrays: true}
                },
                {
                    $match: itemSelector
                },
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
                    $lookup: {
                        from: 'core_branch',
                        localField: 'toBranchId',
                        foreignField: '_id',
                        as: 'branchDoc'
                    }
                },
                {
                    $unwind: {path: '$branchDoc', preserveNullAndEmptyArrays: true}
                },
                {
                    $project: {
                        _id: 0,
                        date: '$ringPullTransferDate',
                        inv: '$_id',
                        des: 1,
                        name: '$branchDoc.khName',
                        itemDoc: 1,
                        items: 1,
                        type: {$ifNull: ["$fake", 'in']},
                        exchangeRP: {$ifNull: ["$fake", 0]},
                        cExchangeRP: {$ifNull: ["$fake", 0]},
                        transferRP: {$ifNull: ["$fake", 0]},
                        receiveTransfer: {$ifNull: ["$items.qty", 0]},
                    }
                },
                {
                    $group: {
                        _id: '$items.itemId',
                        items: {$last: '$items'},
                        itemDoc: {$last: '$itemDoc'},
                        date: {$last: '$date'},
                        type: {$last: '$type'},
                        name: {$last: '$name'},
                        price: {$avg: '$items.price'},
                        itemData: {$push: '$$ROOT'},
                        exchangeRP: {$sum: aggMatchingDate(startOfMonth, endOfMonth, '$date', '$exchangeRP')},
                        cExchangeRP: {$sum: aggMatchingDate(startOfMonth, endOfMonth, '$date', '$cExchangeRP')},
                        transferRP: {$sum: aggMatchingDate(startOfMonth, endOfMonth, '$date', '$transferRP')},
                        receiveTransfer: {$sum: aggMatchingDate(startOfMonth, endOfMonth, '$date', '$receiveTransfer')},
                    }
                },
                {
                    $project: {
                        _id: 1,
                        items: 1,
                        type: 1,
                        name: 1,
                        itemDoc: 1,
                        exchangeRP: 1,
                        cExchangeRP: 1,
                        price: 1,
                        transferRP: 1,
                        receiveTransfer: 1,
                        itemData: {
                            $filter: {
                                input: '$itemData',
                                as: 'item',
                                cond: {$lte: ['$$item.date', subOneMonth]}
                            }
                        }
                    }
                }
            ]);
            let ringPullDetails = _.union(companyExchange, exchangeRingPull, ringPullTransferOut, ringPullTransferIn);
            let itemObj = {};
            let ringPullDetailsArr = [];
            ringPullDetails.forEach(function (doc) {
                if (_.isUndefined(itemObj[doc._id])) {
                    itemObj[doc._id] = {
                        itemId: doc.items.itemId,
                        itemDoc: doc.itemDoc,
                        items: doc.items,
                        type: doc.type,
                        name: doc.name,
                        exchangeRP: doc.exchangeRP,
                        cExchangeRP: doc.cExchangeRP,
                        transferRP: doc.transferRP,
                        receiveTransfer: doc.receiveTransfer,
                        itemData: doc.itemData
                    }
                } else {
                    itemObj[doc._id].exchangeRP += doc.exchangeRP;
                    itemObj[doc._id].cExchangeRP += doc.cExchangeRP;
                    itemObj[doc._id].transferRP += doc.transferRP;
                    itemObj[doc._id].receiveTransfer += doc.receiveTransfer;
                    doc.itemData.forEach(function (item) {
                        itemObj[doc._id].itemData.push(item);
                    });
                }

            });
            let totalExchangeRP = 0;
            let totalCompanyExchangeRP = 0;
            let totalTransferOutRP = 0;
            let totalTransferInRP = 0;
            let totalEndingBalance = 0;
            let totalBegginingBalance = 0;
            let totalAmount = 0;
            for (let k in itemObj) {
                totalExchangeRP += itemObj[k].exchangeRP;
                totalCompanyExchangeRP += itemObj[k].cExchangeRP;
                totalTransferOutRP += itemObj[k].transferRP;
                totalTransferInRP += itemObj[k].receiveTransfer;
                let endingBalance = (itemObj[k].exchangeRP + itemObj[k].receiveTransfer) - (itemObj[k].transferRP + itemObj[k].cExchangeRP);
                let sortItem = _.sortBy(itemObj[k].itemData, function (o) {
                    return moment(o.date);
                });
                let beggingBalance = calcBalance(sortItem);
                itemObj[k].begginingBalance = beggingBalance;
                itemObj[k].endingBalance = endingBalance;
                itemObj[k].balance = endingBalance + beggingBalance;
                itemObj[k].amount = itemObj[k].balance * itemObj[k].items.price;
                ringPullDetailsArr.push(itemObj[k]);
                totalBegginingBalance += beggingBalance;
                totalEndingBalance += itemObj[k].balance;
                totalAmount += itemObj[k].amount;
            }

            data.content = ringPullDetailsArr.sort(compareName);
            data.footer.totalExchangeRP = numeral(totalExchangeRP).format('0,0.00');
            data.footer.totalCompanyExchangeRP = numeral(totalCompanyExchangeRP).format('0,0.00');
            data.footer.totalTransferOutRP = numeral(totalTransferOutRP).format('0,0.00');
            data.footer.totalTransferInRP = numeral(totalTransferInRP).format('0,0.00');
            data.footer.endingBalance = numeral(totalEndingBalance).format('0,0.00');
            data.footer.begginingBalance = numeral(totalBegginingBalance).format('0,0.00');
            data.footer.totalAmount = numeral(totalAmount).format('0,0.00');
            return data
        }
    }
});
function compareId(a, b) {
    if (a._id < b._id)
        return -1;
    if (a._id > b._id)
        return 1;
    return 0;
}
function compare(a, b) {
    let aDate = moment(a.date).format('YYYY-MM-DD HH:mm:ss');
    let bDate = moment(b.date).format('YYYYY-MM-DD HH:mm:ss');
    if (moment(aDate).isAfter(bDate)) {
        return -1;
    }
    if (moment(aDate).isBefore(bDate)) {
        return 1;
    }
    return 0;
}
function compareName(a, b) {
    if (a.itemDoc.name < b.itemDoc.name)
        return -1;
    if (a.itemDoc.name > b.itemDoc.name)
        return 1;
    return 0;
}
function calcBalance(doc) {
    let balance = 0;
    doc.forEach(function (item) {
        if (item.type == 'in') {
            balance += (item.exchangeRP + item.receiveTransfer)
        } else {
            balance -= (item.cExchangeRP + item.transferRP);
        }
    });
    return balance;
}
function aggMatchingDate(startofMonth, endOfMonth, condField, tokenField) {
    return {
        $cond: [
            {
                $and: [
                    {$gte: [condField, startofMonth]},
                    {$lte: [condField, endOfMonth]}
                ]
            },
            tokenField,
            0
        ]
    }
}
import {InventoryDates} from '../collections/inventoryDate';
import {Branch} from '../../../../core/imports/api/collections/branch';
import {EnterBills} from '../collections/enterBill';
import {LendingStocks} from '../collections/lendingStock';
import {Invoices} from '../collections/invoice';
import {ClosingStockBalance} from '../collections/closingStock';
import {ReceiveItems} from '../collections/receiveItem';
import {LocationTransfers} from '../collections/locationTransfer';
import {ExchangeRingPulls} from '../collections/exchangeRingPull';
export default class ClosingStock {
    static generateClosingStockBalance() {
        Branch.find({}).forEach(function (branch) {
            let branchId = branch._id;
            let closingStockBalance = ClosingStockBalance.findOne({branchId: branch._id}, {sort: {closingDate: -1}});
            let inventory = InventoryDates.findOne({branchId: branch._id});
            let closingStockDate = closingStockBalance ? moment(closingStockBalance.closingDate).add(1, 'days').startOf('days').toDate() : null;
            if (inventory) {
                let inventoryDate = moment(inventory.inventoryDate).subtract(1, 'days').endOf('days').toDate();
                //--------------Stock In--------------------
                let enterBills = ClosingStock.lookupEnterBills({inventoryDate, closingStockDate, branchId});
                let receiveItemLendingStocks = ClosingStock.lookupReceiveItemLendingStocks({
                    inventoryDate,
                    closingStockDate,
                    branchId
                });
                let receiveItemPrepaidOrders = ClosingStock.lookupReceiveItemPrepaidOrders({
                    inventoryDate,
                    closingStockDate,
                    branchId
                });
                let receiveItemRingPulls = ClosingStock.lookupReceiveItemRingPulls({
                    inventoryDate,
                    closingStockDate,
                    branchId
                });
                let transferIns = ClosingStock.lookupLocationTransferIns({inventoryDate, closingStockDate, branchId});
                //--------------Stock Out-------------------
                let lendingStocks = ClosingStock.lookupLendingStocks({inventoryDate, closingStockDate, branchId});
                let invoices = ClosingStock.lookupInvoices({inventoryDate, closingStockDate, branchId});
                let exchangeRingPulls = ClosingStock.lookupExchangeRingPulls({
                    inventoryDate,
                    closingStockDate,
                    branchId
                });
                let transferOuts = ClosingStock.lookupLocationTransferOut({inventoryDate, closingStockDate, branchId});
                let transactions = _.union(enterBills, receiveItemLendingStocks, receiveItemPrepaidOrders, receiveItemRingPulls, transferIns, lendingStocks, invoices, exchangeRingPulls, transferOuts)
                let transactionObj = {};
                let transactionArr = [];
                let transactionArrSort = [];
                transactions.forEach(function (transaction) {
                    transaction.items.forEach(function (item) {
                        if (_.isUndefined(transactionObj[transaction.date])) {
                            transactionObj[transaction.date] = {};
                            transactionObj[transaction.date] = {
                                date: transaction.date,
                                items: [item]
                            };
                        } else {
                            transactionObj[transaction.date].items.push(item)
                        }
                    });

                });
                for (let k in transactionObj) {
                    transactionArr.push(transactionObj[k]);
                }
                transactionArrSort = _.sortBy(transactionArr, function (obj) {
                    return obj.date
                });
                transactionArrSort.forEach(function (transaction) {
                    ClosingStock.insertClosingStock(transaction, branchId);
                });
                //caculate item balance
            }
        });
    }

    //enter bill (type in)
    static lookupEnterBills({inventoryDate, closingStockDate, branchId}) {
        let selector = {branchId, enterBillDate: {$lte: inventoryDate}};
        if (closingStockDate) {
            selector.enterBillDate.$gte = closingStockDate;
        }
        return EnterBills.aggregate(this.closingStockQuery({
            selector: selector,
            date: '$enterBillDate',
            qty: 'qty',
            transactionType: 'enterBill',
            type: 'in'
        }));
    }

    //receive item type lending stock (type in )
    static lookupReceiveItemLendingStocks({inventoryDate, closingStockDate, branchId}) {
        let selector = {branchId, receiveItemDate: {$lte: inventoryDate}, type: 'LendingStock'};
        if (closingStockDate) {
            selector.receiveItemDate.$gte = closingStockDate;
        }
        return ReceiveItems.aggregate(this.closingStockQuery({
            selector: selector,
            date: '$receiveItemDate',
            qty: 'qty',
            transactionType: 'receiveLendingStock',
            type: 'in'
        }));
    }

    //receive item prepaid order (type in )
    static lookupReceiveItemPrepaidOrders({branchId, inventoryDate, closingStockDate}) {
        let selector = {branchId, receiveItemDate: {$lte: inventoryDate}, type: 'PrepaidOrder'};
        if (closingStockDate) {
            selector.receiveItemDate.$gte = closingStockDate;
        }
        return ReceiveItems.aggregate(this.closingStockQuery({
            selector: selector,
            date: '$receiveItemDate',
            qty: 'qty',
            transactionType: 'receivePrepaidOrder',
            type: 'in'
        }));
    }

    //receive item company exchange ring pull (type in )
    static lookupReceiveItemRingPulls({branchId, inventoryDate, closingStockDate}) {
        let selector = {branchId, receiveItemDate: {$lte: inventoryDate}, type: 'CompanyExchangeRingPull'};
        if (closingStockDate) {
            selector.receiveItemDate.$gte = closingStockDate;
        }
        return ReceiveItems.aggregate(this.closingStockQuery({
            selector: selector,
            date: '$receiveItemDate',
            qty: 'qty',
            transactionType: 'receiveCompanyExchangeRingPull',
            type: 'in'
        }));
    }

    //Location Transfer In (type in )
    static lookupLocationTransferIns({branchId, inventoryDate, closingStockDate}) {
        let selector = {locationTransferDate: {$lte: inventoryDate}, toBranchId: branchId, status: 'closed'};
        if (closingStockDate) {
            selector.locationTransferDate.$gte = closingStockDate;
        }
        return LocationTransfers.aggregate(this.closingStockQuery({
            selector: selector,
            date: '$locationTransferDate',
            qty: 'qty',
            transactionType: 'transferIn',
            type: 'in'
        }));
    }

    //lending stock (type out)
    static lookupLendingStocks({branchId, inventoryDate, closingStockDate}) {
        let selector = {branchId, lendingStockDate: {$lte: inventoryDate}};
        if (closingStockDate) {
            selector.lendingStockDate.$gte = closingStockDate;
        }
        return LendingStocks.aggregate(this.closingStockQuery({
            selector: selector,
            date: '$lendingStockDate',
            qty: 'qty',
            transactionType: 'lendingStock',
            type: 'out'
        }));
    }

    //invoices (type out)
    static lookupInvoices({branchId, inventoryDate, closingStockDate}) {
        let selector = {branchId, invoiceDate: {$lte: inventoryDate}};
        if (closingStockDate) {
            selector.invoiceDate.$gte = closingStockDate;
        }
        return Invoices.aggregate(this.closingStockQuery({
            selector: selector,
            date: '$invoiceDate',
            qty: 'qty',
            transactionType: 'invoice',
            type: 'out'
        }));
    }

    //exchange Ring pull (type out)
    static lookupExchangeRingPulls({branchId, inventoryDate, closingStockDate}) {
        let selector = {branchId, exchangeRingPullDate: {$lte: inventoryDate}};
        if (closingStockDate) {
            selector.exchangeRingPullDate.$gte = closingStockDate;
        }
        return ExchangeRingPulls.aggregate(this.closingStockQuery({
            selector: selector,
            date: '$exchangeRingPullDate',
            qty: 'qty',
            transactionType: 'exchangeRingPull',
            type: 'out'
        }));
    }

    //Location Transfer Out (type out )
    static lookupLocationTransferOut({branchId, inventoryDate, closingStockDate}) {
        let selector = {
            locationTransferDate: {$lte: inventoryDate},
            fromBranchId: branchId,
            status: 'closed'
        };
        if (closingStockDate) {
            selector.locationTransferDate.$gte = closingStockDate;
        }
        return LocationTransfers.aggregate(this.closingStockQuery({
            selector: selector,
            date: '$locationTransferDate',
            qty: 'qty',
            transactionType: 'transferOut',
            type: 'out'
        }));
    }

    static closingStockQuery({selector, date, qty, transactionType, type}) {
        return [
            {
                $match: selector
            },
            {
                $unwind: {path: '$items', preserveNullAndEmptyArrays: true}
            },
            {
                $group: {
                    _id: {
                        itemId: '$items.itemId',
                        day: {$dayOfMonth: date},
                        month: {$month: date},
                        year: {$year: date}
                    },
                    date: {$last: date},
                    itemId: {$last: "$items.itemId"},
                    qty: {$sum: `$items.${qty}`},
                    amount: {$sum: "$items.amount"},
                    price: {$avg: "$items.price"}
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
            {$unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}},
            {
                $project: {
                    _id: 1,
                    date: {$dateToString: {format: "%Y-%m-%d", date: "$date"}},
                    item: {
                        type: {$ifNull: ["$fake", type]},
                        itemId: '$itemId',
                        itemDoc: '$itemDoc',
                        qty: '$qty',
                        amount: '$amount',
                        price: '$price',
                        transactionType: {$ifNull: ["$fake", transactionType]}
                    }
                }
            },
            {
                $group: {
                    _id: {day: '$_id.day', month: '$_id.month', year: '$_id.year'},
                    date: {$last: '$date'},
                    items: {
                        $push: '$item'
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    type: 1,
                    date: 1,
                    items: 1
                }
            }
        ]
    }

    static insertClosingStock(transaction, branchId) {
        let lastClosingStock = ClosingStockBalance.findOne({
            branchId,
        }, {sort: {closingDate: -1}});
        if (lastClosingStock) {
            console.log(lastClosingStock);
            console.log('inside last closing stock');
            ClosingStockBalance.insert({
                branchId,
                closingDate: moment(transaction.date).toDate(),
                closingDateString: transaction.date,
                items: lastClosingStock.items
            }, function (er, id) {
                transaction.items.forEach(function (item) {
                    let closingStock = ClosingStockBalance.findOne({_id: id});
                    let existItem = closingStock.items.find(o => o.itemId == item.itemId);
                    if (existItem) {
                        let balance = 0;
                        if (item.type == 'in') {
                            ClosingStockBalance.update({
                                _id: id,
                                'items.itemId': item.itemId
                            }, {$set: {'items.$.balance': existItem.balance + item.qty}});
                        } else {
                            ClosingStockBalance.update({
                                _id: id,
                                'items.itemId': item.itemId
                            }, {$set: {'items.$.balance': existItem.balance - item.qty}});
                        }

                    } else {
                        let balance = 0;
                        if (item.type == 'in') {
                            balance = item.qty
                        } else {
                            balance = -item.qty
                        }
                        ClosingStockBalance.update({
                            _id: id
                        }, {$push: {items: {itemId: item.itemId, qty: item.qty, balance: balance}}})
                    }

                });
            })
        } else {
            transaction.items.forEach(function (item) {
                let closingStock = ClosingStockBalance.findOne({branchId, closingDateString: transaction.date});
                if (closingStock) {
                    let existItem = closingStock.items.find(o => o.itemId == item.itemId);
                    if (existItem) {
                        let balance = 0;
                        if (item.type == 'in') {
                            ClosingStockBalance.update({
                                _id: closingStock._id,
                                'items.itemId': item.itemId
                            }, {$set: {'items.$.balance': existItem.balance + item.qty}});
                        } else {
                            ClosingStockBalance.update({
                                _id: closingStock._id,
                                'items.itemId': item.itemId
                            }, {$set: {'items.$.balance': existItem.balance - item.qty}});
                        }

                    } else {
                        let balance = 0;
                        if (item.type == 'in') {
                            balance = item.qty
                        } else {
                            balance = -item.qty
                        }
                        ClosingStockBalance.update({
                            _id: closingStock._id
                        }, {$push: {items: {itemId: item.itemId, qty: item.qty, balance: balance}}})
                    }
                } else {
                    if (item.type == 'in') {
                        item.balance = item.qty;
                    } else {
                        item.balance = -item.qty;
                    }
                    ClosingStock.insertNonExistClosingStockTransaction(transaction.date, branchId, item);
                }
            });

        }

    }


    static insertNonExistClosingStockTransaction(stringDate, branchId, item) {
        let selector = {
            closingDateString: stringDate,
            closingDate: moment(stringDate).toDate(),
            branchId: branchId,
            items: [{itemId: item.itemId, qty: item.qty, balance: item.balance}]
        };
        ClosingStockBalance.insert(selector)
    }

    static updateExistClosingStockTransaction({match, selector}) {
        ClosingStockBalance.update(match, selector);
    }
};

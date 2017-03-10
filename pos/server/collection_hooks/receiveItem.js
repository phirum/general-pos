import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';
import StockFunction from '../../imports/api/libs/stock';

// Collection
import {ReceiveItems} from '../../imports/api/collections/receiveItem.js';
import {AverageInventories} from '../../imports/api/collections/inventory.js';
import {Item} from '../../imports/api/collections/item.js';
import {PrepaidOrders} from '../../imports/api/collections/prepaidOrder';
import {LendingStocks} from '../../imports/api/collections/lendingStock.js';
import {CompanyExchangeRingPulls} from '../../imports/api/collections/companyExchangeRingPull.js';
import {ExchangeGratis} from '../../imports/api/collections/exchangeGratis.js';
import {AccountIntegrationSetting} from '../../imports/api/collections/accountIntegrationSetting';
import {Vendors} from '../../imports/api/collections/vendor.js';
//import state
import {receiveItemState} from '../../common/globalState/receiveItem';
import {GroupBill} from '../../imports/api/collections/groupBill.js'
import {AccountMapping} from '../../imports/api/collections/accountMapping.js'

ReceiveItems.before.insert(function (userId, doc) {
    let todayDate = moment().format('YYYYMMDD');
    let prefix = doc.branchId + "-" + todayDate;
    let tmpBillId = doc._id;
    doc._id = idGenerator.genWithPrefix(ReceiveItems, prefix, 4);
});


ReceiveItems.before.update(function (userId, doc, fieldNames, modifier, options) {
    let result = StockFunction.checkStockByLocation(doc.stockLocationId, doc.items);
    if (!result.isEnoughStock) {
        throw new Meteor.Error(result.message);
    }
});

ReceiveItems.before.remove(function (userId, doc) {
    let result = StockFunction.checkStockByLocation(doc.stockLocationId, doc.items);
    if (!result.isEnoughStock) {
        throw new Meteor.Error(result.message);
    }
});

ReceiveItems.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        let setting = AccountIntegrationSetting.findOne();
        let transaction = [];
        let type = '';
        let total = 0;
        let totalLostAmount = 0;
        doc.items.forEach(function (item) {
            total += item.qty * item.price;
            totalLostAmount += item.lostQty * item.price;
        });
        doc.total = total;
        //Account Integration
        if (setting && setting.integrate) {
            let inventoryChartAccount = AccountMapping.findOne({name: 'Inventory'});
            let lostInventoryChartAccount = AccountMapping.findOne({name: 'Lost Inventory'});


            transaction.push({
                account: inventoryChartAccount.account,
                dr: doc.total,
                cr: 0,
                drcr: doc.total
            });
            if (totalLostAmount > 0) {
                transaction.push({
                    account: lostInventoryChartAccount.account,
                    dr: totalLostAmount,
                    cr: 0,
                    drcr: totalLostAmount
                });
            }
        }
        doc.total = doc.total + totalLostAmount;
        if (doc.type == 'PrepaidOrder') {
            //Account Integration
            if (setting && setting.integrate) {
                type = 'PrepaidOrder-RI';
                let InventoryOwingChartAccount = AccountMapping.findOne({name: 'Inventory Supplier Owing'});
                transaction.push({
                    account: InventoryOwingChartAccount.account,
                    dr: 0,
                    cr: doc.total,
                    drcr: -doc.total
                });
            }
            reducePrepaidOrder(doc);
        }
        else if (doc.type == 'LendingStock') {
            //Account Integration
            if (setting && setting.integrate) {
                type = 'LendingStock-RI';
                let InventoryOwingChartAccount = AccountMapping.findOne({name: 'Lending Stock'});
                transaction.push({
                    account: InventoryOwingChartAccount.account,
                    dr: 0,
                    cr: doc.total,
                    drcr: -doc.total
                });
            }
            reduceLendingStock(doc);
        }
        else if (doc.type == 'ExchangeGratis') {
            //Account Integration
            if (setting && setting.integrate) {
                type = 'Gratis-RI';
                let InventoryOwingChartAccount = AccountMapping.findOne({name: 'Inventory Gratis Owing'});
                transaction.push({
                    account: InventoryOwingChartAccount.account,
                    dr: 0,
                    cr: doc.total,
                    drcr: -doc.total
                });
            }
            reduceExchangeGratis(doc);
        }
        else if (doc.type == 'CompanyExchangeRingPull') {
            //Account Integration
            if (setting && setting.integrate) {
                type = 'RingPull-RI';
                let InventoryOwingChartAccount = AccountMapping.findOne({name: 'Inventory Ring Pull Owing'});
                transaction.push({
                    account: InventoryOwingChartAccount.account,
                    dr: 0,
                    cr: doc.total,
                    drcr: -doc.total
                });
            }
            reduceCompanyExchangeRingPull(doc);
        }
        else {
            throw Meteor.Error('Require Receive Item type');
        }
        doc.items.forEach(function (item) {
            StockFunction.averageInventoryInsert(
                doc.branchId,
                item,
                doc.stockLocationId,
                'receiveItem',
                doc._id,
                doc.receiveItemDate
            );
        });


        //Account Integration
        if (setting && setting.integrate) {
            let data = doc;
            data.type = type;
            data.transaction = transaction;
            data.journalDate = data.receiveItemDate;

            let vendorDoc = Vendors.findOne({_id: doc.vendorId});
            if (vendorDoc) {
                data.name = vendorDoc.name;
                data.des = data.des == "" || data.des == null ? ('ទទួលទំនិញពីក្រុមហ៊ុនៈ ' + data.name) : data.des;
            }
            Meteor.call('insertAccountJournal', data);
        }
        //End Account Integration

    });
});

ReceiveItems.after.update(function (userId, doc, fieldNames, modifier, options) {
    let preDoc = this.previous;
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        let setting = AccountIntegrationSetting.findOne();
        let transaction = [];
        let type = '';
        let totalLostAmount = 0;
        let total = 0;
        doc.items.forEach(function (item) {
            total += item.qty * item.price;
            totalLostAmount += item.lostQty * item.price;
        });
        doc.total = total;
        //Account Integration
        if (setting && setting.integrate) {
            let inventoryChartAccount = AccountMapping.findOne({name: 'Inventory'});
            let lostInventoryChartAccount = AccountMapping.findOne({name: 'Lost Inventory'});


            transaction.push({
                account: inventoryChartAccount.account,
                dr: doc.total,
                cr: 0,
                drcr: doc.total
            });
            if (totalLostAmount > 0) {
                transaction.push({
                    account: lostInventoryChartAccount.account,
                    dr: totalLostAmount,
                    cr: 0,
                    drcr: totalLostAmount
                });
            }
        }
        doc.total = doc.total + totalLostAmount;

        if (doc.type == 'PrepaidOrder') {
            //Account Integration
            if (setting && setting.integrate) {
                type = 'PrepaidOrder-RI';
                let InventoryOwingChartAccount = AccountMapping.findOne({name: 'Inventory Supplier Owing'});


                transaction.push({
                    account: InventoryOwingChartAccount.account,
                    dr: 0,
                    cr: doc.total,
                    drcr: -doc.total
                });
            }
            increasePrepaidOrder(preDoc);
            reducePrepaidOrder(doc);
        } else if (doc.type == 'LendingStock') {
            //Account Integration
            if (setting && setting.integrate) {
                type = 'LendingStock-RI';
                let InventoryOwingChartAccount = AccountMapping.findOne({name: 'Lending Stock'});
                transaction.push({
                    account: InventoryOwingChartAccount.account,
                    dr: 0,
                    cr: doc.total,
                    drcr: -doc.total
                });
            }
            increaseLendingStock(preDoc);
            reduceLendingStock(doc);
        } else if (doc.type == 'ExchangeGratis') {
            //Account Integration
            if (setting && setting.integrate) {
                type = 'Gratis-RI';
                let InventoryOwingChartAccount = AccountMapping.findOne({name: 'Inventory Gratis Owing'});
                transaction.push({
                    account: InventoryOwingChartAccount.account,
                    dr: 0,
                    cr: doc.total,
                    drcr: -doc.total
                });
            }
            increaseExchangeGratis(preDoc);
            reduceExchangeGratis(doc);
        } else if (doc.type == 'CompanyExchangeRingPull') {
            //Account Integration
            if (setting && setting.integrate) {
                type = 'RingPull-RI';
                let InventoryOwingChartAccount = AccountMapping.findOne({name: 'Inventory Ring Pull Owing'});
                transaction.push({
                    account: InventoryOwingChartAccount.account,
                    dr: 0,
                    cr: doc.total,
                    drcr: -doc.total
                });
            }
            increaseCompanyExchangeRingPull(preDoc);
            reduceCompanyExchangeRingPull(doc);
        } else {
            throw Meteor.Error('Require Receive Item type');
        }
        reduceFromInventory(preDoc, 'receiveItem-return',doc.receiveItemDate);
        doc.items.forEach(function (item) {
            StockFunction.averageInventoryInsert(
                doc.branchId,
                item,
                doc.stockLocationId,
                'receiveItem',
                doc._id,
                doc.receiveItemDate
            );
        });
        //Account Integration
        if (setting && setting.integrate) {
            let data = doc;
            data.type = type;
            data.transaction = transaction;
            data.journalDate = data.receiveItemDate;
            let vendorDoc = Vendors.findOne({_id: doc.vendorId});
            if (vendorDoc) {
                data.name = vendorDoc.name;
                data.des = data.des == "" || data.des == null ? ('ទទួលទំនិញពីក្រុមហ៊ុនៈ ' + data.name) : data.des;
            }

            Meteor.call('updateAccountJournal', data);
        }
        //End Account Integration

    });
});

ReceiveItems.after.remove(function (userId, doc) {
    let type = '';
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        if (doc.type == 'PrepaidOrder') {
            type = 'PrepaidOrder-RI';
            increasePrepaidOrder(doc);
            let prepaidOrder = PrepaidOrders.findOne(doc.prepaidOrderId);
            if (prepaidOrder.sumRemainQty == 0) {
                PrepaidOrders.direct.update(prepaidOrder._id, {$set: {status: 'closed'}});
            } else {
                PrepaidOrders.direct.update(prepaidOrder._id, {$set: {status: 'active'}});
            }
        } else if (doc.type == 'LendingStock') {
            type = 'LendingStock-RI';
            increaseLendingStock(doc);
            let lendingStock = LendingStocks.findOne(doc.lendingStockId);
            if (lendingStock.sumRemainQty == 0) {
                LendingStocks.direct.update(lendingStock._id, {$set: {status: 'closed'}});
            } else {
                LendingStocks.direct.update(lendingStock._id, {$set: {status: 'active'}});
            }
        } else if (doc.type == 'ExchangeGratis') {
            type = 'ExchangeGratis-RI';
            increaseExchangeGratis(doc);
            let exchangeGratis = ExchangeGratis.findOne(doc.exchangeGratisId);
            if (exchangeGratis.sumRemainQty == 0) {
                ExchangeGratis.direct.update(exchangeGratis._id, {$set: {status: 'closed'}});
            } else {
                ExchangeGratis.direct.update(exchangeGratis._id, {$set: {status: 'active'}});
            }
        } else if (doc.type == 'CompanyExchangeRingPull') {
            type = 'RingPull-RI';
            increaseCompanyExchangeRingPull(doc);
            let companyExchangeRingPull = CompanyExchangeRingPulls.findOne(doc.companyExchangeRingPullId);
            if (companyExchangeRingPull.sumRemainQty == 0) {
                CompanyExchangeRingPulls.direct.update(companyExchangeRingPull._id, {$set: {status: 'closed'}});
            } else {
                CompanyExchangeRingPulls.direct.update(companyExchangeRingPull._id, {$set: {status: 'active'}});
            }

        } else {
            throw Meteor.Error('Require Receive Item type');
        }
        reduceFromInventory(doc, 'receiveItem-return',doc.receiveItemDate);
        //Account Integration
        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let data = {_id: doc._id, type: type};
            Meteor.call('removeAccountJournal', data)
        }
        //End Account Integration
    });
});

/*receive item type

 ----PrepaidOrder-----
 insert: increase AverageInventory and reduce from PrepaidOrder(doc)
 Note: (update the remain qty of prepaidOrder);
 update: reduce AverageInventory and increase the PrepaidOrder back(previous doc);
 increase AverageInventory and reduce from PrepaidOrder( doc)
 remove: reduce AverageInventory and Increase the PrepaidOrder back(doc)

 ----LendingStock-----
 insert: increase AverageInventory and reduce from LendingStock(doc)
 update: reduce AverageInventory and increase the LendingStock(previous doc)
 increase AverageInventory and reduce from LendingStock(doc)
 remove: reduce AverageInventory and increase the LendingStock(doc)

 ----Ring Pull----
 insert: increase AverageInventory and reduce from Ring Pull (doc)
 update: reduce AverageInventory and increase the Ring Pull(previous doc)
 increase AverageInventory and reduce from Ring Pull(doc)
 remove: reduce AverageInventory and increase teh Ring Pull(doc)

 ----Gratis----
 insert: increase AverageInventory and reduce from Gratis (doc)
 update: reduce AverageInventory and increase the Gratis(previous doc)
 increase AverageInventory and reduce from Gratis(doc)
 remove: reduce AverageInventory and increase the Gratis(doc)

 */

function reducePrepaidOrder(doc) {
    doc.items.forEach(function (item) {
        PrepaidOrders.direct.update(
            {
                _id: doc.prepaidOrderId,
                "items.itemId": item.itemId
            },
            {
                $inc: {
                    sumRemainQty: -item.qty,
                    "items.$.remainQty": -item.qty
                }
            });
    });
    let prepaidOrder = PrepaidOrders.findOne(doc.prepaidOrderId);
    if (prepaidOrder.sumRemainQty == 0) {
        PrepaidOrders.direct.update(prepaidOrder._id, {$set: {status: 'closed'}});
    } else {
        PrepaidOrders.direct.update(prepaidOrder._id, {$set: {status: 'active'}});
    }
}

function increasePrepaidOrder(preDoc) {
    let updatedFlag;
    preDoc.items.forEach(function (item) {
        PrepaidOrders.direct.update(
            {_id: preDoc.prepaidOrderId, 'items.itemId': item.itemId},
            {$inc: {'items.$.remainQty': item.qty, sumRemainQty: item.qty}}
        ); //re sum remain qty
    });
}

function reduceLendingStock(doc) {
    doc.items.forEach(function (item) {
        LendingStocks.direct.update(
            {
                _id: doc.lendingStockId,
                "items.itemId": item.itemId
            },
            {
                $inc: {
                    sumRemainQty: -item.qty,
                    "items.$.remainQty": -item.qty
                }
            });
    });
    let lendingStock = LendingStocks.findOne(doc.lendingStockId);
    if (lendingStock.sumRemainQty == 0) {
        LendingStocks.direct.update(lendingStock._id, {$set: {status: 'closed'}});
    } else {
        LendingStocks.direct.update(lendingStock._id, {$set: {status: 'active'}});
    }
}

function increaseLendingStock(preDoc) {
    //let updatedFlag;
    preDoc.items.forEach(function (item) {
        LendingStocks.direct.update(
            {_id: preDoc.lendingStockId, 'items.itemId': item.itemId},
            {$inc: {'items.$.remainQty': item.qty, sumRemainQty: item.qty}}
        ); //re sum remain qty
    });
}


function reduceCompanyExchangeRingPull(doc) {
    doc.items.forEach(function (item) {
        CompanyExchangeRingPulls.direct.update(
            {
                _id: doc.companyExchangeRingPullId,
                "items.itemId": item.itemId
            },
            {
                $inc: {
                    sumRemainQty: -item.qty,
                    "items.$.remainQty": -item.qty
                }
            });
    });
    let companyExchangeRingPull = CompanyExchangeRingPulls.findOne(doc.companyExchangeRingPullId);
    if (companyExchangeRingPull.sumRemainQty == 0) {
        CompanyExchangeRingPulls.direct.update(companyExchangeRingPull._id, {$set: {status: 'closed'}});
    } else {
        CompanyExchangeRingPulls.direct.update(companyExchangeRingPull._id, {$set: {status: 'active'}});
    }
}

function increaseCompanyExchangeRingPull(preDoc) {
    //let updatedFlag;
    preDoc.items.forEach(function (item) {
        CompanyExchangeRingPulls.direct.update(
            {_id: preDoc.companyExchangeRingPullId, 'items.itemId': item.itemId},
            {$inc: {'items.$.remainQty': item.qty, sumRemainQty: item.qty}}
        ); //re sum remain qty
    });
}


function reduceExchangeGratis(doc) {
    doc.items.forEach(function (item) {
        ExchangeGratis.direct.update(
            {
                _id: doc.exchangeGratisId,
                "items.itemId": item.itemId
            },
            {
                $inc: {
                    sumRemainQty: -item.qty,
                    "items.$.remainQty": -item.qty
                }
            });
    });
    let exchangeGratis = ExchangeGratis.findOne(doc.exchangeGratisId);
    if (exchangeGratis.sumRemainQty == 0) {
        ExchangeGratis.direct.update(exchangeGratis._id, {$set: {status: 'closed'}});
    } else {
        ExchangeGratis.direct.update(exchangeGratis._id, {$set: {status: 'active'}});
    }
}

function increaseExchangeGratis(preDoc) {
    //let updatedFlag;
    preDoc.items.forEach(function (item) {
        ExchangeGratis.direct.update(
            {_id: preDoc.exchangeGratisId, 'items.itemId': item.itemId},
            {$inc: {'items.$.remainQty': item.qty, sumRemainQty: item.qty}}
        ); //re sum remain qty
    });
}


function reduceFromInventory(receiveItem, type,receiveItemDate) {
    receiveItem.items.forEach(function (item) {
        StockFunction.minusAverageInventoryInsert(
            receiveItem.branchId,
            item,
            receiveItem.stockLocationId,
            type,
            receiveItem._id,
            receiveItemDate
        );
    });

}
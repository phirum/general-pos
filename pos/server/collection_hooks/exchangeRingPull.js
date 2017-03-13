import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';
import {AverageInventories} from '../../imports/api/collections/inventory.js';
// Collection
import {ExchangeRingPulls} from '../../imports/api/collections/exchangeRingPull.js';
import {Item} from '../../imports/api/collections/item.js'
import {RingPullInventories} from '../../imports/api/collections/ringPullInventory.js'
import {AccountIntegrationSetting} from '../../imports/api/collections/accountIntegrationSetting.js'
import {AccountMapping} from '../../imports/api/collections/accountMapping.js'
import {Customers} from '../../imports/api/collections/customer.js'
import StockFunction from '../../imports/api/libs/stock';
ExchangeRingPulls.before.insert(function (userId, doc) {
    let inventoryDate = StockFunction.getLastInventoryDate(doc.branchId, doc.stockLocationId);
    if (doc.exchangeRingPullDate <= inventoryDate) {
        throw new Meteor.Error('Date must be gather than last Transaction Date: "' +
            moment(inventoryDate).format('YYYY-MM-DD HH:mm:ss') + '"');
    }
    let result=StockFunction.checkStockByLocation(doc.stockLocationId,doc.items);
    if(!result.isEnoughStock){
        throw new Meteor.Error( result.message);
    }
    let todayDate = moment().format('YYYYMMDD');
    let prefix = doc.branchId + "-" + todayDate;
    doc._id = idGenerator.genWithPrefix(ExchangeRingPulls, prefix, 4);
});

ExchangeRingPulls.before.update(function (userId, doc, fieldNames, modifier, options) {
    let inventoryDateOld = StockFunction.getLastInventoryDate(doc.branchId, doc.stockLocationId);
    if (modifier.$set.exchangeRingPullDate < inventoryDateOld) {
        throw new Meteor.Error('Date must be gather than last Transaction Date: "' +
            moment(inventoryDateOld).format('YYYY-MM-DD HH:mm:ss') + '"');
    }

    modifier = modifier == null ? {} : modifier;
    modifier.$set.branchId=modifier.$set.branchId == null ? doc.branchId : modifier.$set.branchId;
    modifier.$set.stockLocationId= modifier.$set.stockLocationId == null ? doc.stockLocationId : modifier.$set.stockLocationId;
    let inventoryDate = StockFunction.getLastInventoryDate(modifier.$set.branchId, modifier.$set.stockLocationId);
    if (modifier.$set.exchangeRingPullDate < inventoryDate) {
        throw new Meteor.Error('Date must be gather than last Transaction Date: "' +
            moment(inventoryDate).format('YYYY-MM-DD HH:mm:ss') + '"');
    }
    let postDoc = {itemList: modifier.$set.items};
    let stockLocationId = modifier.$set.stockLocationId;
    let data = {stockLocationId: doc.stockLocationId, items: doc.items};
    let result = StockFunction.checkStockByLocationWhenUpdate(stockLocationId, postDoc.itemList, data);
    if (!result.isEnoughStock) {
        throw new Meteor.Error(result.message);
    }
});

ExchangeRingPulls.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        //ExchangeRingPullManageStock(doc);
        //---------------------------------------------//

        StockFunction.increaseRingPullInventory(doc);
        //Account Integration
        let total = 0;
        doc.items.forEach(function (item) {
            let inventoryObj = AverageInventories.findOne({
                itemId: item.itemId,
                branchId: doc.branchId,
                stockLocationId: doc.stockLocationId
            }, {sort: {_id: -1}});
            if (inventoryObj) {
                item.price = inventoryObj.averagePrice;
                item.amount = item.qty * inventoryObj.averagePrice;
                total += item.amount;
            } else {
                throw new Meteor.Error("Not Found Inventory. @ExchangeRingPull-after-insert.");
            }
        });
        let inventoryIdList = [];
        doc.items.forEach(function (item) {
            let id = StockFunction.minusAverageInventoryInsert(
                doc.branchId, item,
                doc.stockLocationId,
                'exchangeRingPull',
                doc._id,
                doc.exchangeRingPullDate
            );
            inventoryIdList.push(id);
        });
        doc.total = total;
        ExchangeRingPulls.direct.update(doc._id, {$set: {items: doc.items, total: doc.total}});

        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let transaction = [];
            let data = doc;
            data.type = "ExchangeRingPull";

            let customerDoc = Customers.findOne({_id: doc.customerId});
            if (customerDoc) {
                data.name = customerDoc.name;
                data.des = data.des == "" || data.des == null ? ("ប្តូរក្រវិលពីអតិថិជនៈ " + data.name) : data.des;
            }

            let ringPullChartAccount = AccountMapping.findOne({name: 'Ring Pull'});
            let inventoryChartAccount = AccountMapping.findOne({name: 'Inventory'});
            transaction.push({
                account: ringPullChartAccount.account,
                dr: data.total,
                cr: 0,
                drcr: data.total
            }, {
                account: inventoryChartAccount.account,
                dr: 0,
                cr: data.total,
                drcr: -data.total
            });
            data.transaction = transaction;
            data.journalDate = data.exchangeRingPullDate;
            Meteor.call('insertAccountJournal', data);
            /*Meteor.call('insertAccountJournal', data, function (er, re) {
             if (er) {
             AverageInventories.direct.remove({_id: {$in: inventoryIdList}});
             StockFunction.reduceRingPullInventory(doc);
             Meteor.call('insertRemovedCompanyExchangeRingPull', doc);
             ExchangeRingPulls.direct.remove({_id: doc._id});
             throw new Meteor.Error(er.message);
             } else if (re == null) {
             AverageInventories.direct.remove({_id: {$in: inventoryIdList}});
             StockFunction.reduceRingPullInventory(doc);
             Meteor.call('insertRemovedCompanyExchangeRingPull', doc);
             ExchangeRingPulls.direct.remove({_id: doc._id});
             throw new Meteor.Error("Can't Entry to Account System.");
             }
             });*/
        }
        //End Account Integration
    });
});
ExchangeRingPulls.after.update(function (userId, doc) {
    Meteor.defer(()=> {
        let preDoc = this.previous;
        Meteor._sleepForMs(200);
        returnToInventory(preDoc, 'exchangeRingPull-return',doc.exchangeRingPullDate);
        //Account Integration
        let total = 0;
        doc.items.forEach(function (item) {
            let inventoryObj = AverageInventories.findOne({
                itemId: item.itemId,
                branchId: doc.branchId,
                stockLocationId: doc.stockLocationId
            }, {sort: {_id: -1}});
            if (inventoryObj) {
                item.price = inventoryObj.averagePrice;
                item.amount = item.qty * inventoryObj.averagePrice;
                total += item.amount;
            } else {
                throw new Meteor.Error("Not Found Inventory. @ExchangeRingPull-after-insert.");
            }
        });
        ExchangeRingPullManageStock(doc);
        doc.total = total;
        ExchangeRingPulls.direct.update(doc._id, {$set: {items: doc.items, total: doc.total}});

        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let transaction = [];
            let data = doc;
            data.type = "ExchangeRingPull";

            let customerDoc = Customers.findOne({_id: doc.customerId});
            if (customerDoc) {
                data.name = customerDoc.name;
                data.des = data.des == "" || data.des == null ? ("ប្តូរក្រវិលពីអតិថិជនៈ " + data.name) : data.des;
            }

            let ringPullChartAccount = AccountMapping.findOne({name: 'Ring Pull'});
            let inventoryChartAccount = AccountMapping.findOne({name: 'Inventory'});
            transaction.push({
                account: ringPullChartAccount.account,
                dr: data.total,
                cr: 0,
                drcr: data.total
            }, {
                account: inventoryChartAccount.account,
                dr: 0,
                cr: data.total,
                drcr: -data.total
            });
            data.transaction = transaction;
            data.journalDate = data.exchangeRingPullDate;
            Meteor.call('updateAccountJournal', data);
        }
        //End Account Integration
    })
});

ExchangeRingPulls.after.remove(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        returnToInventory(doc, 'exchangeRingPull-return',moment().toDate());
        //Account Integration
        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let data = {_id: doc._id, type: 'ExchangeRingPull'};
            Meteor.call('removeAccountJournal', data)
        }
        //End Account Integration
    });
});


// after.insert: reduceForInventory and Add to RingPull Inventory

/*
 after.update:
 returnToInventory and reduceFrom RingPull Inventory (preDoc)
 reduceForInventory and Add to RingPull Inventory (doc)
 */

//after.remove: returnToInventory and reduceFrom RingPull Inventory

function ExchangeRingPullManageStock(exchangeRingPull) {
    //---Open Inventory type block "Average Inventory"---
    let totalCost = 0;
    // let exchangeRingPull = Invoices.findOne(exchangeRingPullId);
    let prefix = exchangeRingPull.stockLocationId + "-";
    let newItems = [];
    exchangeRingPull.items.forEach(function (item) {
        StockFunction.minusAverageInventoryInsert(
            exchangeRingPull.branchId,
            item,
            exchangeRingPull.stockLocationId,
            'exchangeRingPull',
            exchangeRingPull._id,
            exchangeRingPull.exchangeRingPullDate
        );
        //---insert to Ring Pull Stock---
        let ringPullInventory = RingPullInventories.findOne({
            branchId: exchangeRingPull.branchId,
            itemId: item.itemId,
        });
        if (ringPullInventory) {
            RingPullInventories.update(
                ringPullInventory._id,
                {
                    $inc: {qty: item.qty}
                });
        } else {
            RingPullInventories.insert({
                itemId: item.itemId,
                branchId: exchangeRingPull.branchId,
                qty: item.qty
            })
        }

    });
    //--- End Inventory type block "Average Inventory"---


}
//update inventory
function returnToInventory(exchangeRingPull, type,inventoryDate) {
    //---Open Inventory type block "Average Inventory"---
    // let exchangeRingPull = Invoices.findOne(exchangeRingPullId);
    exchangeRingPull.items.forEach(function (item) {
        StockFunction.averageInventoryInsert(
            exchangeRingPull.branchId,
            item,
            exchangeRingPull.stockLocationId,
            type,
            exchangeRingPull._id,
            inventoryDate
        );
        //---Reduce from Ring Pull Stock---
        let ringPullInventory = RingPullInventories.findOne({
            branchId: exchangeRingPull.branchId,
            itemId: item.itemId,
        });
        if (ringPullInventory) {
            RingPullInventories.update(
                ringPullInventory._id,
                {
                    $inc: {qty: -item.qty}
                });
        } else {
            RingPullInventories.insert({
                itemId: item.itemId,
                branchId: exchangeRingPull.branchId,
                qty: 0 - item.qty
            })
        }
    });
    //--- End Inventory type block "Average Inventory"---
}
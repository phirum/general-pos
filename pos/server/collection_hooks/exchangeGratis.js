import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {ExchangeGratis} from '../../imports/api/collections/exchangeGratis.js';
import {AverageInventories} from '../../imports/api/collections/inventory.js';
import {Item} from '../../imports/api/collections/item.js';
import {GratisInventories} from '../../imports/api/collections/gratisInventory.js';
import {AccountIntegrationSetting} from '../../imports/api/collections/accountIntegrationSetting.js'
import {AccountMapping} from '../../imports/api/collections/accountMapping'
import {Vendors} from '../../imports/api/collections/vendor.js'
import StockFunction from '../../imports/api/libs/stock';

ExchangeGratis.before.insert(function (userId, doc) {
    let prefix = doc.vendorId;
    doc._id = idGenerator.genWithPrefix(ExchangeGratis, prefix, 6);
});


ExchangeGratis.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        doc.items.forEach(function (item) {
            StockFunction.reduceGratisInventory(item, doc.branchId, doc.stockLocationId);
        });

        //Account Integration
        let total = 0;
        doc.items.forEach(function (item) {
            let inventoryObj = AverageInventories.findOne({
                itemId: item.itemId,
                branchId: doc.branchId,
                stockLocationId: doc.stockLocationId
            }, {sort: {_id: -1}});
            let thisItemPrice = 0;
            if (inventoryObj) {
                thisItemPrice = inventoryObj.price;
            } else {
                let thisItem = Item.findOne(item.itemId);
                thisItemPrice = thisItem && thisItem.purchasePrice ? thisItem.purchasePrice : 0;
            }
            item.price = thisItemPrice;
            item.amount = item.qty * thisItemPrice;
            total += item.amount;
        });
        doc.total = total;
        ExchangeGratis.direct.update(doc._id,{$set:{items:doc.items,total:doc.total}});

        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let transaction = [];
            let data = doc;
            data.type = "ExchangeGratis";

            let vendorDoc = Vendors.findOne({_id: doc.vendorId});
            if (vendorDoc) {
                data.name = vendorDoc.name;
                data.des = data.des == "" || data.des == null ? ("ប្តូរ Gratis ពីក្រុមហ៊ុនៈ " + data.name) : data.des;
            }

            let oweInventoryGratisChartAccount = AccountMapping.findOne({name: 'Inventory Gratis Owing'});
            let gratisChartAccount = AccountMapping.findOne({name: 'Gratis'});
            transaction.push({
                account: oweInventoryGratisChartAccount.account,
                dr: doc.total,
                cr: 0,
                drcr: doc.total
            }, {
                account: gratisChartAccount.account,
                dr: 0,
                cr: doc.total,
                drcr: -doc.total
            });
            data.transaction = transaction;
            data.journalDate = data.exchangeGratisDate;
            Meteor.call('insertAccountJournal', data);
        }
        //End Account Integration
    });
});

ExchangeGratis.after.update(function (userId, doc) {
    let preDoc = this.previous;
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        preDoc.items.forEach(function (item) {
            StockFunction.increaseGratisInventory(item, preDoc.branchId, preDoc.stockLocationId);
        });
        doc.items.forEach(function (item) {
            StockFunction.reduceGratisInventory(item, doc.branchId, doc.stockLocationId);
        });
        //Account Integration
        let total = 0;
        doc.items.forEach(function (item) {
            let inventoryObj = AverageInventories.findOne({
                itemId: item.itemId,
                branchId: doc.branchId,
                stockLocationId: doc.stockLocationId
            }, {sort: {_id: -1}});
            let thisItemPrice = 0;
            if (inventoryObj) {
                thisItemPrice = inventoryObj.price;
            } else {
                let thisItem = Item.findOne(item.itemId);
                thisItemPrice = thisItem && thisItem.purchasePrice ? thisItem.purchasePrice : 0;
            }
            item.price = thisItemPrice;
            item.amount = item.qty * thisItemPrice;
            total += item.amount;
        });
        doc.total = total;
        ExchangeGratis.direct.update(doc._id,{$set:{items:doc.items,total:doc.total}});


        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let transaction = [];
            let data = doc;
            data.type = "ExchangeGratis";

            let vendorDoc = Vendors.findOne({_id: doc.vendorId});
            if (vendorDoc) {
                data.name = vendorDoc.name;
                data.des = data.des == "" || data.des == null ? ("ប្តូរ Gratis ពីក្រុមហ៊ុនៈ " + data.name) : data.des;
            }

            let oweInventoryGratisChartAccount = AccountMapping.findOne({name: 'Inventory Gratis Owing'});
            let gratisChartAccount = AccountMapping.findOne({name: 'Gratis'});
            transaction.push({
                account: oweInventoryGratisChartAccount.account,
                dr: doc.total,
                cr: 0,
                drcr: doc.total
            }, {
                account: gratisChartAccount.account,
                dr: 0,
                cr: doc.total,
                drcr: -doc.total
            });
            data.transaction = transaction;
            data.journalDate = data.exchangeGratisDate;
            Meteor.call('updateAccountJournal', data);
        }
        //End Account Integration
    });
});

//remove
ExchangeGratis.after.remove(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        doc.items.forEach(function (item) {
            StockFunction.increaseGratisInventory(item, doc.branchId, doc.stockLocationId);
        });
        //Account Integration
        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let data = {_id: doc._id, type: 'ExchangeGratis'};
            Meteor.call('removeAccountJournal', data)
        }
        //End Account Integration
    });
});


/*
 Insert: reduce from gratis inventory(doc)
 Update: increase gratis inventory(preDoc)
 reduce from ring pull inventory(doc);
 Remove: increase from ring pull inventory(doc)
 */



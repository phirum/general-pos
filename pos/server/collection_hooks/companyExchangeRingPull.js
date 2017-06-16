import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';
import {AverageInventories} from '../../imports/api/collections/inventory.js';

// Collection
import {CompanyExchangeRingPulls} from '../../imports/api/collections/companyExchangeRingPull.js';
import {Item} from '../../imports/api/collections/item.js'
import {RingPullInventories} from '../../imports/api/collections/ringPullInventory.js'
import {AccountIntegrationSetting} from '../../imports/api/collections/accountIntegrationSetting.js'
import {AccountMapping} from '../../imports/api/collections/accountMapping.js'
import {Vendors} from '../../imports/api/collections/vendor.js'
import StockFunction from '../../imports/api/libs/stock';

CompanyExchangeRingPulls.before.insert(function (userId, doc) {

    let result = StockFunction.checkRingPullByBranch(doc.branchId, doc.items);
    if (!result.isEnoughStock) {
        throw new Meteor.Error(result.message);
    }


    let todayDate = moment().format('YYYYMMDD');
    let prefix = doc.branchId + "-" + todayDate;
    doc._id = idGenerator.genWithPrefix(CompanyExchangeRingPulls, prefix, 4);
});

CompanyExchangeRingPulls.before.update(function (userId, doc, fieldNames, modifier, options) {
    let postDoc = {itemList: modifier.$set.items};
    let branchId = modifier.$set.branchId;
    let data = {stockLocationId: doc.stockLocationId, items: doc.items};
    let result = StockFunction.checkRingPullByBranchWhenUpdate(branchId, postDoc.itemList, data);
    if (!result.isEnoughStock) {
        throw new Meteor.Error(result.message);
    }
});


CompanyExchangeRingPulls.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        StockFunction.reduceRingPullInventory(doc);
        //Account Integration
        let total = 0;
        doc.items.forEach(function (item) {
            let inventoryObj = AverageInventories.findOne({
                itemId: item.itemId,
                branchId: doc.branchId,
                //stockLocationId: doc.stockLocationId
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
        CompanyExchangeRingPulls.direct.update(doc._id, {$set: {items: doc.items, total: doc.total}});

        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let transaction = [];
            let data = doc;
            data.type = "CompanyExchangeRingPull";
            let vendorDoc = Vendors.findOne({_id: doc.vendorId});

            if (vendorDoc) {
                data.name = vendorDoc.name;
                data.des = data.des == "" || data.des == null ? ("ប្តូរក្រវិលពីក្រុមហ៊ុនៈ " + data.name) : data.des;
            }

            let oweInventoryRingPullChartAccount = AccountMapping.findOne({name: 'Inventory Ring Pull Owing'});
            let ringPullChartAccount = AccountMapping.findOne({name: 'Ring Pull'});
            transaction.push({
                account: oweInventoryRingPullChartAccount.account,
                dr: doc.total,
                cr: 0,
                drcr: doc.total
            }, {
                account: ringPullChartAccount.account,
                dr: 0,
                cr: doc.total,
                drcr: -doc.total
            });
            data.transaction = transaction;
            data.journalDate = data.companyExchangeRingPullDate;
            Meteor.call('insertAccountJournal', data);
        }
        //End Account Integration
    });

});
CompanyExchangeRingPulls.after.update(function (userId, doc) {
    let preDoc = this.previous;
    Meteor.defer(function () {
        StockFunction.increaseRingPullInventory(preDoc);
        StockFunction.reduceRingPullInventory(doc);
        //Account Integration
        let total = 0;
        doc.items.forEach(function (item) {
            let inventoryObj = AverageInventories.findOne({
                itemId: item.itemId,
                branchId: doc.branchId,
                //stockLocationId: doc.stockLocationId
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
        CompanyExchangeRingPulls.direct.update(doc._id, {$set: {items: doc.items, total: doc.total}});


        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let transaction = [];
            let data = doc;
            data.type = "CompanyExchangeRingPull";

            let vendorDoc = Vendors.findOne({_id: doc.vendorId});
            if (vendorDoc) {
                data.name = vendorDoc.name;
                data.des = data.des == "" || data.des == null ? ("ប្តូរក្រវិលពីក្រុមហ៊ុនៈ " + data.name) : data.des;
            }

            let oweInventoryRingPullChartAccount = AccountMapping.findOne({name: 'Inventory Ring Pull Owing'});
            let ringPullChartAccount = AccountMapping.findOne({name: 'Ring Pull'});
            transaction.push({
                account: oweInventoryRingPullChartAccount.account,
                dr: doc.total,
                cr: 0,
                drcr: doc.total
            }, {
                account: ringPullChartAccount.account,
                dr: 0,
                cr: doc.total,
                drcr: -doc.total
            });
            data.transaction = transaction;
            data.journalDate = data.companyExchangeRingPullDate;
            Meteor.call('updateAccountJournal', data);
        }
        //End Account Integration
    });
});

CompanyExchangeRingPulls.after.remove(function (userId, doc) {
    Meteor.defer(function () {
        StockFunction.increaseRingPullInventory(doc);
        //Account Integration
        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let data = {_id: doc._id, type: 'CompanyExchangeRingPull'};
            Meteor.call('removeAccountJournal', data)
        }
        //End Account Integration
    });
});


/*
 insert: reduce from RingPull Inventory(doc)
 update: increase ring pull inventory (predoc)
 reduce from ring pull inventory(doc)
 remove: increase ring pull inventory(doc)
 */

Meteor.methods({
    correctAccountCompanyExchangeRingPull(){
        if (!Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }
        let i=1;
        let companyExchangeRingPulls=CompanyExchangeRingPulls.find({});
        companyExchangeRingPulls.forEach(function (doc) {
            console.log(i);
            i++;
            let setting = AccountIntegrationSetting.findOne();
            if (setting && setting.integrate) {
                let transaction = [];
                let data = doc;
                data.type = "CompanyExchangeRingPull";
                let vendorDoc = Vendors.findOne({_id: doc.vendorId});

                if (vendorDoc) {
                    data.name = vendorDoc.name;
                    data.des = data.des == "" || data.des == null ? ("ប្តូរក្រវិលពីក្រុមហ៊ុនៈ " + data.name) : data.des;
                }

                let oweInventoryRingPullChartAccount = AccountMapping.findOne({name: 'Inventory Ring Pull Owing'});
                let ringPullChartAccount = AccountMapping.findOne({name: 'Ring Pull'});
                transaction.push({
                    account: oweInventoryRingPullChartAccount.account,
                    dr: doc.total,
                    cr: 0,
                    drcr: doc.total
                }, {
                    account: ringPullChartAccount.account,
                    dr: 0,
                    cr: doc.total,
                    drcr: -doc.total
                });
                data.transaction = transaction;
                data.journalDate = data.companyExchangeRingPullDate;
                Meteor.call('insertAccountJournal', data);
            }
            //End Account Integration
        })
    }
})






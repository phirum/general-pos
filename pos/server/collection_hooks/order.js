import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {Order} from '../../imports/api/collections/order.js';
import {PurchaseOrder} from '../../imports/api/collections/purchaseOrder.js';
import {AccountIntegrationSetting} from '../../imports/api/collections/accountIntegrationSetting.js'
import {Item} from '../../imports/api/collections/item.js'
import {Vendors} from '../../imports/api/collections/vendor.js'
import {AverageInventories} from '../../imports/api/collections/inventory.js'
import {AccountMapping} from '../../imports/api/collections/accountMapping.js'
import {Customers} from '../../imports/api/collections/customer.js'
Order.before.insert(function (userId, doc) {
    let prefix = doc.customerId;
    doc._id = idGenerator.genWithPrefix(Order, prefix, 6);
});


Order.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        let sumRemainQty = 0;
        let totalCOGS = 0;
        doc.items.forEach(function (item) {
            sumRemainQty += item.remainQty;
            //We have to think about the StockLocation for Sale Order ....
            let inventoryObj = AverageInventories.findOne({
                itemId: item.itemId,
                branchId: doc.branchId
            }, {sort: {_id: -1}});
            let thisItemPrice = 0;
            if (inventoryObj) {
                thisItemPrice = inventoryObj.price;
            } else {
                let thisItem = Item.findOne(item.itemId);
                thisItemPrice = thisItem && thisItem.purchasePrice ? thisItem.purchasePrice : 0;
            }
            totalCOGS += item.qty * thisItemPrice;

            /// let inventory=
        });
        Order.direct.update(doc._id, {
            $set: {
                sumRemainQty: sumRemainQty
            }
        });
        /*  if (doc.isPurchased) {
         //Auto Purchase Order
         //let vendor = Vendors.findOne(doc.voucherId);
         let purchaseObj = {
         //repId: vendor.repId,
         vendorId: doc.voucherId,
         purchaseOrderDate: new Date(),
         des: 'From Sale Order: "' + doc._id + '"',
         branchId: doc.branchId,
         total: 0,
         items: [],
         saleOrderId: doc._id
         };
         doc.items.forEach(function (item) {
         let inventory = AverageInventories.findOne({
         branchId: doc.branchId,
         itemId: item.itemId,
         });
         if (inventory) {
         purchaseObj.items.push({
         itemId: item.itemId,
         price: inventory.price,
         qty: doc.qty,
         amount: doc.qty * inventory.price,
         });
         purchaseObj.total += doc.qty * inventory.price;
         } else {
         let thisItem = Item.findOne(item.itemId);
         purchaseObj.items.push({
         itemId: item.itemId,
         price: item.price,
         qty: doc.qty,
         amount: doc.qty * thisItem.purchasePrice,
         });
         purchaseObj.total += doc.qty * inventory.price;
         }
         });
         PurchaseOrder.insert(purchaseObj);

         }*/
        //Account Integration
        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let transaction = [];
            let totalSaleOrder=doc.total;
            let data = doc;
            data.type = "SaleOrder";
            data.total = totalSaleOrder + totalCOGS;
            let oweInventoryChartAccount = AccountMapping.findOne({name: 'Owe Inventory Customer'});
            let cashChartAccount = AccountMapping.findOne({name: 'Cash on Hand'});
            let saleIncomeChartAccount = AccountMapping.findOne({name: 'Sale Income'});
            let cogsChartAccount = AccountMapping.findOne({name: 'COGS'});

            let customerDoc = Customers.findOne({_id: doc.customerId});
            if (customerDoc) {
                data.name = customerDoc.name;
                data.des = data.des == "" || data.des == null ? ('កម្ម៉ង់ទិញទំនិញពីអតិថិជនៈ ' + data.name) : data.des;
            }

            transaction.push(
                {
                    account: cashChartAccount.account,
                    dr: totalSaleOrder,
                    cr: 0,
                    drcr: totalSaleOrder
                },
                {
                    account: saleIncomeChartAccount.account,
                    dr: 0,
                    cr: totalSaleOrder,
                    drcr: -totalSaleOrder
                },
                {
                    account: cogsChartAccount.account,
                    dr: totalCOGS,
                    cr: 0,
                    drcr: totalCOGS
                },
                {
                    account: oweInventoryChartAccount.account,
                    dr: 0,
                    cr: totalCOGS,
                    drcr: -totalCOGS
                });
            data.transaction = transaction;
            data.journalDate = data.orderDate;
            Meteor.call('insertAccountJournal', data);
        }
        //End Account Integration
    });
});

Order.after.update(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        let sumRemainQty = 0;
        let totalCOGS = 0;
        doc.items.forEach(function (item) {
            sumRemainQty += item.remainQty;
            //We have to think about the StockLocation for Sale Order ....
            let inventoryObj = AverageInventories.findOne({
                itemId: item.itemId,
                branchId: doc.branchId
            }, {sort: {_id: -1}});
            let thisItemPrice = 0;
            if (inventoryObj) {
                thisItemPrice = inventoryObj.price;
            } else {
                let thisItem = Item.findOne(item.itemId);
                thisItemPrice = thisItem && thisItem.purchasePrice ? thisItem.purchasePrice : 0;
            }
            totalCOGS += item.qty * thisItemPrice;
        });
        Order.direct.update(doc._id, {
            $set: {
                sumRemainQty: sumRemainQty
            }
        });
        //Account Integration
        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let transaction = [];
            let totalSaleOrder=doc.total;
            let data = doc;
            data.total = totalSaleOrder + totalCOGS;
            data.type = "SaleOrder";
            let oweInventoryChartAccount = AccountMapping.findOne({name: 'Owe Inventory Customer'});
            let cashChartAccount = AccountMapping.findOne({name: 'Cash on Hand'});
            let saleIncomeChartAccount = AccountMapping.findOne({name: 'Sale Income'});
            let cogsChartAccount = AccountMapping.findOne({name: 'COGS'});

            let customerDoc = Customers.findOne({_id: doc.customerId});
            if (customerDoc) {
                data.name = customerDoc.name;
                data.des = data.des == "" || data.des == null ? ('កម្ម៉ង់ទិញទំនិញពីអតិថិជនៈ ' + data.name) : data.des;
            }

            transaction.push(
                {
                    account: cashChartAccount.account,
                    dr: totalSaleOrder,
                    cr: 0,
                    drcr: totalSaleOrder
                },
                {
                    account: saleIncomeChartAccount.account,
                    dr: 0,
                    cr: totalSaleOrder,
                    drcr: -totalSaleOrder
                },
                {
                    account: cogsChartAccount.account,
                    dr: totalCOGS,
                    cr: 0,
                    drcr: totalCOGS
                },
                {
                    account: oweInventoryChartAccount.account,
                    dr: 0,
                    cr: totalCOGS,
                    drcr: -totalCOGS
                });
            data.transaction = transaction;
            data.journalDate = data.orderDate;
            Meteor.call('updateAccountJournal', data);
        }
        //End Account Integration
        /*if (doc.isPurchased) {
         //Auto Purchase Order
         //let vendor = Vendors.findOne(doc.voucherId);
         let purchaseObj = {
         //repId: vendor.repId,
         vendorId: doc.voucherId,
         purchaseOrderDate: new Date(),
         des: 'From Sale Order: "' + doc._id + '"',
         branchId: doc.branchId,
         total: 0,
         items: [],
         saleOrderId: doc._id
         };
         doc.items.forEach(function (item) {
         let inventory = AverageInventories.findOne({
         branchId: doc.branchId,
         itemId: item.itemId,
         });
         if (inventory) {
         purchaseObj.items.push({
         itemId: item.itemId,
         price: inventory.price,
         qty: doc.qty,
         amount: doc.qty * inventory.price,
         });
         purchaseObj.total += doc.qty * inventory.price;
         } else {
         let thisItem = Item.findOne(item.itemId);
         purchaseObj.items.push({
         itemId: item.itemId,
         price: item.price,
         qty: doc.qty,
         amount: doc.qty * thisItem.purchasePrice,
         });
         purchaseObj.total += doc.qty * inventory.price;
         }
         });
         PurchaseOrder.update({saleOrderId: doc._id}, {$set: purchaseObj});
         }*/
    });
});

Order.after.remove(function (userId, doc) {
    Meteor.defer(function () {
        //Account Integration
        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let data = {_id: doc._id, type: 'SaleOrder'};
            Meteor.call('removeAccountJournal', data)
        }
        //End Account Integration
        PurchaseOrder.remove({saleOrderId: doc._id});
    })

});
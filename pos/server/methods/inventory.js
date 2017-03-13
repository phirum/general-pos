import {AverageInventories} from '../../imports/api/collections/inventory.js';
import {EnterBills} from '../../imports/api/collections/enterBill.js'
import {Invoices} from '../../imports/api/collections/invoice.js'
import {LocationTransfers} from '../../imports/api/collections/locationTransfer.js'
import {Item} from '../../imports/api/collections/item.js'
import {RingPullInventories} from '../../imports/api/collections/ringPullInventory.js'
import {RingPullTransfers} from '../../imports/api/collections/ringPullTransfer.js'
import {AccountIntegrationSetting} from '../../imports/api/collections/accountIntegrationSetting.js'
import {AccountMapping} from '../../imports/api/collections/accountMapping'
import {Branch} from '../../../core/imports/api/collections/branch.js'
import {TransferMoney} from '../../imports/api/collections/transferMoney.js'
import {idGenerator} from 'meteor/theara:id-generator';
import 'meteor/matb33:collection-hooks';
import StockFunction from '../../imports/api/libs/stock';

Meteor.methods({
    enterBillManageStock: function (enterBillId) {
        if (!Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }
        Meteor.defer(function () {
            Meteor._sleepForMs(200);
            //---Open Inventory type block "Average Inventory"---
            let enterBill = EnterBills.findOne(enterBillId);
            enterBill.items.forEach(function (item) {
                averageInventoryInsert(enterBill.branchId, item, enterBill.stockLocationId, 'enterBill', enterBill._id);
            });
            //--- End Inventory type block "Average Inventory"---
        });
    },
    invoiceManageStock: function (invoiceId) {
        if (!Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }
        Meteor.defer(function () {
            //---Open Inventory type block "Average Inventory"---
            let totalCost = 0;
            let invoice = Invoices.findOne(invoiceId);
            let prefix = invoice.stockLocationId + "-";
            let newItems = [];
            invoice.items.forEach(function (item) {
                let inventory = AverageInventories.findOne({
                    branchId: invoice.branchId,
                    itemId: item.itemId,
                    stockLocationId: invoice.stockLocationId
                }, {sort: {_id: -1}});
                if (inventory) {
                    item.cost = inventory.price;
                    item.amountCost = inventory.price * item.qty;
                    item.profit = item.amount - item.amountCost;
                    totalCost += item.amountCost;
                    newItems.push(item);
                    let newInventory = {
                        _id: idGenerator.genWithPrefix(AverageInventories, prefix, 13),
                        branchId: invoice.branchId,
                        stockLocationId: invoice.stockLocationId,
                        itemId: item.itemId,
                        qty: item.qty,
                        price: inventory.price,
                        remainQty: inventory.remainQty - item.qty,
                        coefficient: -1,
                        type: 'invoice',
                        refId: invoice._id
                    };
                    AverageInventories.insert(newInventory);
                }
                else {
                    var thisItem = Item.findOne(item.itemId);
                    item.cost = thisItem.purchasePrice;
                    item.amountCost = thisItem.purchasePrice * item.qty;
                    item.profit = item.amount - item.amountCost;
                    totalCost += item.amountCost;
                    newItems.push(item);
                    let newInventory = {
                        _id: idGenerator.genWithPrefix(AverageInventories, prefix, 13),
                        branchId: invoice.branchId,
                        stockLocationId: invoice.stockLocationId,
                        itemId: item.itemId,
                        qty: item.qty,
                        price: thisItem.purchasePrice,
                        remainQty: 0 - item.qty,
                        coefficient: -1,
                        type: 'invoice',
                        refId: invoice._id
                    };
                    AverageInventories.insert(newInventory);
                }
            });
            let totalProfit = invoice.total - totalCost;
            Invoices.direct.update(
                invoice._id,
                {$set: {items: newItems, totalCost: totalCost, profit: totalProfit}}
            );
            //--- End Inventory type block "Average Inventory"---
        });

    },
    locationTransferManageStock: function (locationTransferId) {
        if (!Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }
        let userId = Meteor.userId();
        let locationTransfer = LocationTransfers.findOne(locationTransferId);

        let fromInventoryDate = StockFunction.getLastInventoryDate(locationTransfer.fromBranchId, doc.fromStockLocationId);
        if (doc.locationTransferDate <= fromInventoryDate) {
            throw new Meteor.Error('Date must be gather than last Transaction Date: "' +
                moment(fromInventoryDate).format('YYYY-MM-DD HH:mm:ss') + '"');
        }

        let toInventoryDate = StockFunction.getLastInventoryDate(locationTransfer.toBranchId, doc.toStockLocationId);
        if (doc.locationTransferDate <= toInventoryDate) {
            throw new Meteor.Error('Date must be gather than last Transaction Date: "' +
                moment(toInventoryDate).format('YYYY-MM-DD HH:mm:ss') + '"');
        }
        let result = StockFunction.checkStockByLocation(locationTransfer.fromStockLocationId, locationTransfer.items);
        if (!result.isEnoughStock) {
            throw new Meteor.Error(result.message);
        }

        Meteor.defer(function () {
            Meteor._sleepForMs(200);
            //---Open Inventory type block "FIFO Inventory"---
            let locationTransferTotalCost = 0;

            let prefix = locationTransfer.fromStockLocationId + "-";
            let newItems = [];
            let total = 0;


            locationTransfer.items.forEach(function (item) {
                let inventory = AverageInventories.findOne({
                    branchId: locationTransfer.fromBranchId,
                    itemId: item.itemId,
                    stockLocationId: locationTransfer.fromStockLocationId
                }, {sort: {_id: -1}});

                if (inventory) {
                    item.price = inventory.averagePrice;
                    item.amount = inventory.averagePrice * item.qty;
                    total += item.amount;
                    newItems.push(item);
                    StockFunction.minusAverageInventoryInsert(
                        locationTransfer.fromBranchId,
                        item,
                        locationTransfer.fromStockLocationId,
                        'transfer-from',
                        locationTransferId,
                        locationTransfer.locationTransferDate
                    );
                    StockFunction.averageInventoryInsert(
                        locationTransfer.toBranchId,
                        item,
                        locationTransfer.toStockLocationId,
                        'transfer-to',
                        locationTransferId,
                        locationTransfer.locationTransferDate
                    );
                } else {
                    throw new Meteor.Error('Not Found Inventory. @locationTransfer-manage-stock. refId:' + locationTransferId);
                }

                //inventories=sortArrayByKey()
            });
            let setObj = {};
            setObj.items = newItems;
            setObj.total = total;
            setObj.pending = false;
            setObj.status = "closed";
            setObj.toUserId = userId;
            LocationTransfers.update(
                locationTransferId,
                {$set: setObj}
            );
            //--- End Inventory type block "FIFO Inventory"---

            if (locationTransfer.fromStockLocationId != locationTransfer.toStockLocationId) {
                //Account Integration
                let totalAmount = 0;
                let doc = locationTransfer;
                let fromBranchName = Branch.findOne(doc.fromBranchId).khName;
                let toBranchName = Branch.findOne(doc.toBranchId).khName;
                let des = "ផ្ទេរស្តុកពីសាខាៈ " + fromBranchName + " ទៅ " + toBranchName;
                doc.des = doc.des == "" || doc.des == null ? des : doc.des;
                doc.items.forEach(function (item) {
                    let inventoryObj = AverageInventories.findOne({
                        itemId: item.itemId,
                        branchId: doc.branchId,
                        stockLocationId: doc.fromStockLocationId
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
                    totalAmount += item.amount;
                });
                doc.total = totalAmount;
                let setting = AccountIntegrationSetting.findOne();
                if (setting && setting.integrate) {
                    let inventoryChartAccount = AccountMapping.findOne({name: 'Inventory'});
                    let data1 = doc;
                    data1.transaction = [];
                    data1.branchId = doc.fromBranchId;
                    data1.type = "LocationTransferFrom";
                    data1.journalDate = moment().toDate();
                    data1.transaction.push({
                        account: inventoryChartAccount.account,
                        dr: 0,
                        cr: data1.total,
                        drcr: -data1.total
                    });
                    Meteor.call('insertAccountJournal', data1);

                    let data2 = doc;
                    data2.transaction = [];
                    data2.branchId = doc.toBranchId;
                    data2.journalDate = moment().toDate();
                    data2.type = "LocationTransferTo";
                    data2.transaction.push({
                        account: inventoryChartAccount.account,
                        dr: data2.total,
                        cr: 0,
                        drcr: data2.total
                    });
                    Meteor.call('insertAccountJournal', data2);
                }
                //End Account Integration
            }

        });
    },
    returnToInventory: function (invoiceId) {
        if (!Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }

        Meteor.defer(function () {
            //---Open Inventory type block "Average Inventory"---
            let invoice = Invoices.findOne(invoiceId);
            invoice.items.forEach(function (item) {
                item.price = item.cost;
                averageInventoryInsert(
                    invoice.branchId,
                    item,
                    invoice.stockLocationId,
                    'invoice-return',
                    invoice._id
                );
            });
            //--- End Inventory type block "Average Inventory"---
        });
    },
    isEnoughStock: function (enterBillId) {
        let enterBill = enterBill.findOne(enterBillId);
        let enough = true;
        enterBill.items.forEach(function (item) {
            let inventory = AverageInventories.findOne({
                branchId: enterBill.branchId,
                itemId: item.itemId,
                locationId: item.locationId,
                price: item.price
            }, {sort: {_id: -1}, fields: {_id: 1, remainQty: 1, quantity: 1}});
            if (inventory.remainQty < item.qty) {
                enough = false;
                return false;
            }
        });
        return enough;
    },
    reduceFromInventory: function (enterBillId) {
        if (!Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }
        Meteor.defer(function () {
            let enterBill = EnterBills.findOne(enterBillId);
            enterBill.items.forEach(function (item) {
                let inventory = AverageInventories.findOne({
                    branchId: enterBill.branchId,
                    itemId: item.itemId,
                    stockLocationId: enterBill.stockLocationId
                }, {sort: {_id: -1}});
                if (inventory) {
                    let newInventory = {
                        _id: idGenerator.genWithPrefix(AverageInventories, prefix, 13),
                        branchId: enterBill.branchId,
                        stockLocationId: enterBill.stockLocationId,
                        itemId: item.itemId,
                        qty: item.qty,
                        price: inventory.price,
                        remainQty: inventory.remainQty - item.qty,
                        coefficient: -1,
                        type: 'enter-return',
                        refId: enterBill._id
                    };
                    AverageInventories.insert(newInventory);
                } else {
                    let thisItem = Item.findOne(item.itemId);
                    let newInventory = {
                        _id: idGenerator.genWithPrefix(AverageInventories, prefix, 13),
                        branchId: enterBill.branchId,
                        stockLocationId: enterBill.stockLocationId,
                        itemId: item.itemId,
                        qty: item.qty,
                        price: thisItem.purchasePrice,
                        remainQty: 0 - item.qty,
                        coefficient: -1,
                        type: 'enter-return',
                        refId: enterBill._id
                    };
                    AverageInventories.insert(newInventory);
                }

            });
        });
    },
    declineTransfer(locationTransferId){
        let userId = Meteor.userId();
        let setObj = {};
        setObj.status = "declined";
        setObj.pending = false;
        setObj.toUserId = userId;
        LocationTransfers.update(
            locationTransferId,
            {$set: setObj}
        );
    },
    ringPullTransferManageStock: function (ringPullTransferId) {
        if (!Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }
        let userId = Meteor.userId();
        Meteor.defer(function () {
            Meteor._sleepForMs(200);

            //---Open Inventory type block "FIFO Inventory"---
            let ringPullTransferTotalCost = 0;
            let ringPullTransfer = RingPullTransfers.findOne(ringPullTransferId);
            let prefix = ringPullTransfer.stockLocationId + "-";
            let newItems = [];
            let total = 0;

            ringPullTransfer.items.forEach(function (item) {
                //1. reduce stock from the current stock location Or Add to some Account?....
                /*  let inventory = AverageInventories.findOne({
                 branchId: ringPullTransfer.fromBranchId,
                 itemId: item.itemId,
                 stockLocationId: ringPullTransfer.stockLocationId
                 }, {sort: {_id: 1}});

                 if (inventory) {
                 let newInventory = {
                 _id: idGenerator.genWithPrefix(AverageInventories, prefix, 13),
                 branchId: ringPullTransfer.fromBranchId,
                 stockLocationId: ringPullTransfer.stockLocationId,
                 itemId: item.itemId,
                 qty: item.qty,
                 price: inventory.price,
                 remainQty: inventory.remainQty - item.qty,
                 coefficient: -1,
                 type: 'ringPullTransfer-from',
                 refId: ringPullTransferId
                 };
                 AverageInventories.insert(newInventory);
                 item.price = inventory.price;
                 item.amount = inventory.price * item.qty;
                 }
                 else {
                 let thisItem = Item.findOne(item.itemId);
                 let newInventory = {
                 _id: idGenerator.genWithPrefix(AverageInventories, prefix, 13),
                 branchId: ringPullTransfer.fromBranchId,
                 stockLocationId: ringPullTransfer.fromStockLocationId,
                 itemId: item.itemId,
                 qty: item.qty,
                 price: thisItem.purchasePrice,
                 remainQty: 0 - item.qty,
                 coefficient: -1,
                 type: 'ringPullTransfer-from',
                 refId: ringPullTransferId
                 };
                 AverageInventories.insert(newInventory);
                 item.price = thisItem.purchasePrice;
                 item.amount = thisItem.purchasePrice * item.qty;
                 }
                 //total += item.amount;
                 newItems.push(item);
                 averageInventoryInsert(
                 ringPullTransfer.toBranchId,
                 item,
                 ringPullTransfer.toStockLocationId,
                 'ringPullTransfer-to',
                 ringPullTransferId
                 );*/

                //inventories=sortArrayByKey()
                //2. reduce RingPullInventory from fromBranch
                //---Reduce from Ring Pull Stock---
                let ringPullInventory = RingPullInventories.findOne({
                    branchId: ringPullTransfer.fromBranchId,
                    itemId: item.itemId,
                });
                if (ringPullInventory) {
                    RingPullInventories.update(
                        ringPullInventory._id,
                        {
                            $inc: {qty: -item.qty}
                        });
                }
                else {
                    RingPullInventories.insert({
                        itemId: item.itemId,
                        branchId: ringPullTransfer.fromBranchId,
                        qty: 0 - item.qty
                    })
                }
                //3. increase RingPullInventory to toBranch
                //---insert to Ring Pull Stock---
                let toRingPullInventory = RingPullInventories.findOne({
                    branchId: ringPullTransfer.toBranchId,
                    itemId: item.itemId,
                });
                if (toRingPullInventory) {
                    RingPullInventories.update(
                        toRingPullInventory._id,
                        {
                            $inc: {qty: item.qty}
                        });
                }
                else {
                    RingPullInventories.insert({
                        itemId: item.itemId,
                        branchId: ringPullTransfer.toBranchId,
                        qty: item.qty
                    })
                }
            });
            let setObj = {};
            //setObj.items = newItems;
            //setObj.total = total;
            setObj.pending = false;
            setObj.status = "closed";
            setObj.toUserId = userId;
            RingPullTransfers.update(
                ringPullTransferId,
                {$set: setObj}
            );
            //--- End Inventory type block "FIFO Inventory"---

            //Account Integration
            let doc = ringPullTransfer;
            let fromBranchName = Branch.findOne(doc.fromBranchId).khName;
            let toBranchName = Branch.findOne(doc.toBranchId).khName;
            let des = "ផ្ទេរក្រវិលពីសាខាៈ " + fromBranchName + " ទៅ " + toBranchName;
            doc.des = doc.des == "" || doc.des == null ? des : doc.des;
            let setting = AccountIntegrationSetting.findOne();
            if (setting && setting.integrate) {

                let ringPullChartAccount = AccountMapping.findOne({name: 'Ring Pull'});
                let data1 = doc;
                data1.transaction = [];
                data1.branchId = doc.fromBranchId;
                data1.type = "RingPullTransferFrom";
                data1.journalDate = moment().toDate();
                data1.transaction.push({
                    account: ringPullChartAccount.account,
                    dr: 0,
                    cr: data1.total,
                    drcr: -data1.total
                });
                Meteor.call('insertAccountJournal', data1);

                let data2 = doc;
                data2.transaction = [];
                data2.branchId = doc.toBranchId;
                data2.type = "RingPullTransferTo";
                data2.journalDate = moment().toDate();
                data2.transaction.push({
                    account: ringPullChartAccount.account,
                    dr: data2.total,
                    cr: 0,
                    drcr: data2.total
                });
                Meteor.call('insertAccountJournal', data2);
            }
            //End Account Integration
        });


    },
    declineRingPullTransfer(ringPullTransferId){
        let userId = Meteor.userId();
        let setObj = {};
        setObj.status = "declined";
        setObj.pending = false;
        setObj.toUserId = userId;
        RingPullTransfers.update(
            ringPullTransferId,
            {$set: setObj}
        );
    },
    transferMoney: function (moneyTransferId) {
        if (!Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }
        let userId = Meteor.userId();
        Meteor.defer(function () {
            Meteor._sleepForMs(200);
            let moneyTransfer = TransferMoney.findOne(moneyTransferId);
            let setObj = {};
            setObj.pending = false;
            setObj.status = "closed";
            setObj.toUserId = userId;
            TransferMoney.update(
                moneyTransferId,
                {$set: setObj}
            );
            //--- End Inventory type block "FIFO Inventory"---
            //Account Integration
            let setting = AccountIntegrationSetting.findOne();
            if (setting && setting.integrate) {
                let doc = moneyTransfer;
                let fromBranchName = Branch.findOne(doc.fromBranchId).khName;
                let toBranchName = Branch.findOne(doc.toBranchId).khName;
                let des = "ផ្ទេរប្រាក់ពីសាខាៈ " + fromBranchName + " ទៅ " + toBranchName;
                doc.des = doc.des == "" || doc.des == null ? des : doc.des;

                let ringPullChartAccount = AccountMapping.findOne({name: 'Cash on Hand'});
                let data1 = doc;
                data1.total = doc.transferAmount;
                data1.transaction = [];
                data1.branchId = doc.fromBranchId;
                data1.journalDate = moment().toDate();
                data1.type = "MoneyTransferFrom";
                data1.transaction.push({
                    account: ringPullChartAccount.account,
                    dr: 0,
                    cr: data1.transferAmount,
                    drcr: -data1.transferAmount
                });
                Meteor.call('insertAccountJournal', data1);
                let data2 = doc;
                data2.transaction = [];
                data2.branchId = doc.toBranchId;
                data2.type = "MoneyTransferTo";
                data2.journalDate = moment().toDate();
                data2.total = doc.transferAmount;
                data2.transaction.push({
                    account: ringPullChartAccount.account,
                    dr: data2.transferAmount,
                    cr: 0,
                    drcr: data2.transferAmount
                });
                Meteor.call('insertAccountJournal', data2);
            }
            //End Account Integration
        });


    },
    declineTransferMoney(moneyTransferId){
        let userId = Meteor.userId();
        let setObj = {};
        setObj.status = "declined";
        setObj.pending = false;
        setObj.toUserId = userId;
        TransferMoney.update(
            moneyTransferId,
            {$set: setObj}
        );
    },
});


function averageInventoryInsert(branchId, item, stockLocationId, type, refId) {
    let lastPurchasePrice = 0;
    let remainQuantity = 0;
    let prefix = stockLocationId + '-';
    let inventory = AverageInventories.findOne({
        branchId: branchId,
        itemId: item.itemId,
        stockLocationId: stockLocationId
    }, {sort: {createdAt: -1}});
    if (inventory == null) {
        let inventoryObj = {};
        inventoryObj._id = idGenerator.genWithPrefix(AverageInventories, prefix, 13);
        inventoryObj.branchId = branchId;
        inventoryObj.stockLocationId = stockLocationId;
        inventoryObj.itemId = item.itemId;
        inventoryObj.qty = item.qty;
        inventoryObj.price = item.price;
        inventoryObj.remainQty = item.qty;
        inventoryObj.type = type;
        inventoryObj.coefficient = 1;
        inventoryObj.refId = refId;
        lastPurchasePrice = item.price;
        remainQuantity = inventoryObj.remainQty;
        AverageInventories.insert(inventoryObj);
    }
    else if (inventory.price == item.price) {
        let inventoryObj = {};
        inventoryObj._id = idGenerator.genWithPrefix(AverageInventories, prefix, 13);
        inventoryObj.branchId = branchId;
        inventoryObj.stockLocationId = stockLocationId;
        inventoryObj.itemId = item.itemId;
        inventoryObj.qty = item.qty;
        inventoryObj.price = item.price;
        inventoryObj.remainQty = item.qty + inventory.remainQty;
        inventoryObj.type = type;
        inventoryObj.coefficient = 1;
        inventoryObj.refId = refId;
        lastPurchasePrice = item.price;
        remainQuantity = inventoryObj.remainQty;
        AverageInventories.insert(inventoryObj);
        /*
         let
         inventorySet = {};
         inventorySet.qty = item.qty + inventory.qty;
         inventorySet.remainQty = inventory.remainQty + item.qty;
         AverageInventories.update(inventory._id, {$set: inventorySet});
         */
    }
    else {
        let totalQty = inventory.remainQty + item.qty;
        let price = 0;
        //should check totalQty or inventory.remainQty
        if (totalQty <= 0) {
            price = inventory.price;
        } else if (inventory.remainQty <= 0) {
            price = item.price;
        } else {
            price = ((inventory.remainQty * inventory.price) + (item.qty * item.price)) / totalQty;
        }
        let nextInventory = {};
        nextInventory._id = idGenerator.genWithPrefix(AverageInventories, prefix, 13);
        nextInventory.branchId = branchId;
        nextInventory.stockLocationId = stockLocationId;
        nextInventory.itemId = item.itemId;
        nextInventory.qty = item.qty;
        nextInventory.price = math.round(price, 2);
        nextInventory.remainQty = totalQty;
        nextInventory.type = type;
        nextInventory.coefficient = 1;
        nextInventory.refId = refId;
        lastPurchasePrice = price;
        remainQuantity = nextInventory.remainQty;
        AverageInventories.insert(nextInventory);
    }

    var setModifier = {$set: {purchasePrice: lastPurchasePrice}};
    setModifier.$set['qtyOnHand.' + stockLocationId] = remainQuantity;
    Item.direct.update(item.itemId, setModifier);
}

/*
 //Account Integration
 let setting = AccountIntegrationSetting.findOne();
 if (setting && setting.integrate) {
 let transaction = [];
 let data = doc;
 data.type = "PrepaidOrder";
 data.items.forEach(function (item) {
 let itemDoc = Item.findOne(item.itemId);
 if (itemDoc.accountMapping.accountReceivable && itemDoc.accountMapping.inventoryAsset) {
 transaction.push({
 account: itemDoc.accountMapping.accountReceivable,
 dr: item.amount,
 cr: 0,
 drcr: item.amount
 }, {
 account: itemDoc.accountMapping.inventoryAsset,
 dr: 0,
 cr: item.amount,
 drcr: -item.amount
 })
 }
 });
 data.transaction = transaction;
 Meteor.call('updateAccountJournal', data);
 }
 //End Account Integration


 */
/*
 //Account Integration
 let setting = AccountIntegrationSetting.findOne();
 if (setting && setting.integrate) {
 let data = {_id: doc._id, type: 'PrepaidOrder'};
 Meteor.call('removeAccountJournal', data)
 }
 //End Account Integration
 */
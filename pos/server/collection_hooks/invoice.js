import 'meteor/matb33:collection-hooks'
import {idGenerator} from 'meteor/theara:id-generator'
import StockFunction from '../../imports/api/libs/stock';
// Collection
import {Invoices} from '../../imports/api/collections/invoice.js'
import {ReceivePayment} from '../../imports/api/collections/receivePayment.js'
import {Order} from '../../imports/api/collections/order'
import {GroupInvoice} from '../../imports/api/collections/groupInvoice'
import {AverageInventories} from '../../imports/api/collections/inventory.js'
import {Item} from '../../imports/api/collections/item.js'
import {GratisInventories} from '../../imports/api/collections/gratisInventory.js'
import {AccountIntegrationSetting} from '../../imports/api/collections/accountIntegrationSetting.js'
import {AccountMapping} from '../../imports/api/collections/accountMapping'
import {Customers} from '../../imports/api/collections/customer.js'
// import invoice state
import {invoiceState} from '../../common/globalState/invoice'
// import methods
import {updateItemInSaleOrder} from '../../common/methods/sale-order'
Invoices.before.insert(function (userId, doc) {
    doc.printId = doc._id;
    let inventoryDate = StockFunction.getLastInventoryDate(doc.branchId, doc.stockLocationId);
    if (doc.invoiceDate <= inventoryDate) {
        throw new Meteor.Error('Date must be gather than last Transaction Date: "' +
            moment(inventoryDate).format('YYYY-MM-DD HH:mm:ss') + '"');
    }

    let result = StockFunction.checkStockByLocation(doc.stockLocationId, doc.items);
    if (!result.isEnoughStock) {
        throw new Meteor.Error(result.message);
    }
    if (doc.total == 0) {
        doc.status = 'closed';
        doc.invoiceType = 'saleOrder'
    } else if (doc.termId) {
        doc.status = 'active';
        doc.invoiceType = 'term'
    } else {
        doc.status = 'active';
        doc.invoiceType = 'group'
    }
    let tmpInvoiceId = doc._id;
    let todayDate = moment().format('YYYYMMDD');
    let prefix = doc.branchId + '-' + todayDate;
    doc._id = idGenerator.genWithPrefix(Invoices, prefix, 4);
    invoiceState.set(tmpInvoiceId, {customerId: doc.customerId, invoiceId: doc._id, total: doc.total})
});

Invoices.before.update(function (userId, doc, fieldNames, modifier, options) {
    let inventoryDateOld = StockFunction.getLastInventoryDate(doc.branchId, doc.stockLocationId);
    if (modifier.$set.invoiceDate < inventoryDateOld) {
        throw new Meteor.Error('Date must be gather than last Transaction Date: "' +
            moment(inventoryDateOld).format('YYYY-MM-DD HH:mm:ss') + '"');
    }

    modifier = modifier == null ? {} : modifier;
    modifier.$set.branchId=modifier.$set.branchId == null ? doc.branchId : modifier.$set.branchId;
    modifier.$set.stockLocationId= modifier.$set.stockLocationId == null ? doc.stockLocationId : modifier.$set.stockLocationId;
    let inventoryDate = StockFunction.getLastInventoryDate(modifier.$set.branchId, modifier.$set.stockLocationId);
    if (modifier.$set.invoiceDate < inventoryDate) {
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

Invoices.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        let des = "វិក្កយបត្រ អតិថិជនៈ ";
        Meteor._sleepForMs(200);
        let setting = AccountIntegrationSetting.findOne();
        let transaction = [];
        let totalRemain = 0;
        let accountRefType = 'Invoice';
        if (doc.saleId) {
            des = "វិក្កយបត្រ SO អតិថិជនៈ ";
            accountRefType = 'Invoice-SaleOrder';
            let total = 0;
            let totalCost = 0;
            doc.items.forEach(function (item) {
                Order.direct.update(
                    {
                        _id: doc.saleId,
                        'items.itemId': item.itemId
                    },
                    {
                        $inc: {
                            sumRemainQty: -item.qty,
                            'items.$.remainQty': -item.qty
                        }
                    });
                total += item.qty * item.price
            });
            let saleOrder = Order.findOne(doc.saleId);
            if (saleOrder.sumRemainQty == 0) {
                Order.direct.update(saleOrder._id, {$set: {status: 'closed'}})
            }
            // Account Integration
            if (setting && setting.integrate) {
                let oweInventoryCustomerChartAccount = AccountMapping.findOne({name: 'Owe Inventory Customer'});
                let inventoryChartAccount = AccountMapping.findOne({name: 'Inventory'});

                doc.total = total;
                transaction.push(
                    {
                        account: oweInventoryCustomerChartAccount.account,
                        dr: doc.total,
                        cr: 0,
                        drcr: doc.total

                    }, {
                        account: inventoryChartAccount.account,
                        dr: 0,
                        cr: doc.total,
                        drcr: -doc.total
                    }
                )
            }
            // End Account Integration
            let totalGratis = 0;
            let totalCOGS = 0;
            doc.items.forEach(function (item) {
                if (item.price == 0) {
                    increaseGratisInventory(item, doc.branchId, doc.stockLocationId);
                    let inventoryObj = AverageInventories.findOne({
                        itemId: item.itemId,
                        branchId: doc.branchId,
                        stockLocationId: doc.stockLocationId
                    }, {sort: {_id: -1}});
                    if (inventoryObj) {
                        totalGratis += item.qty * inventoryObj.averagePrice;
                    } else {
                        throw new Meteor.Error('Not Found Inventory. @Invoices-after-insert. refId:' + doc._id);
                    }
                }
                else {
                    let inventoryObj = AverageInventories.findOne({
                        itemId: item.itemId,
                        branchId: doc.branchId,
                        stockLocationId: doc.stockLocationId
                    }, {sort: {_id: -1}});
                    if (inventoryObj) {
                        totalCOGS += item.qty * inventoryObj.averagePrice;
                    } else {
                        throw new Meteor.Error('Not Found Inventory. @Invoices-after-insert. refId:' + doc._id);
                    }
                }
            });
            invoiceManageStock(doc);
            let totalInventory = totalCOGS + totalGratis;
            // more to do .......
        }
        else if (doc.invoiceType == 'term') {
            accountRefType = 'Invoice';
            let totalGratis = 0;
            let totalCOGS = 0;
            doc.items.forEach(function (item) {
                if (item.price == 0) {
                    increaseGratisInventory(item, doc.branchId, doc.stockLocationId);
                    let inventoryObj = AverageInventories.findOne({
                        itemId: item.itemId,
                        branchId: doc.branchId,
                        stockLocationId: doc.stockLocationId
                    }, {sort: {_id: -1}});
                    if (inventoryObj) {
                        totalGratis += item.qty * inventoryObj.averagePrice;
                    } else {
                        throw new Meteor.Error('Not Found Inventory. @Invoices-after-insert. refId:' + doc._id);
                    }
                }
                else {
                    let inventoryObj = AverageInventories.findOne({
                        itemId: item.itemId,
                        branchId: doc.branchId,
                        stockLocationId: doc.stockLocationId
                    }, {sort: {_id: -1}});
                    if (inventoryObj) {
                        totalCOGS += item.qty * inventoryObj.averagePrice;
                    } else {
                        throw new Meteor.Error('Not Found Inventory. @Invoices-after-insert. refId:' + doc._id);
                    }
                }
            });
            invoiceManageStock(doc);
            let totalInventory = totalCOGS + totalGratis;
            // Account Integration
            if (setting && setting.integrate) {
                let arChartAccount = AccountMapping.findOne({name: 'A/R'});
                let saleIncomeChartAccount = AccountMapping.findOne({name: 'Sale Income'});
                let cogsChartAccount = AccountMapping.findOne({name: 'COGS'});
                let gratisChartAccount = AccountMapping.findOne({name: 'Gratis'});
                let inventoryChartAccount = AccountMapping.findOne({name: 'Inventory'});
                transaction.push(
                    {
                        account: arChartAccount.account,
                        dr: doc.total,
                        cr: 0,
                        drcr: doc.total
                    },
                    {
                        account: saleIncomeChartAccount.account,
                        dr: 0,
                        cr: doc.total,
                        drcr: -doc.total
                    },
                    {
                        account: cogsChartAccount.account,
                        dr: totalCOGS,
                        cr: 0,
                        drcr: totalCOGS
                    }
                );

                if (totalGratis > 0) {
                    accountRefType = 'Invoice-Gratis';
                    transaction.push({
                        account: gratisChartAccount.account,
                        dr: totalGratis,
                        cr: 0,
                        drcr: totalGratis
                    })
                }
                transaction.push({
                    account: inventoryChartAccount.account,
                    dr: 0,
                    cr: totalInventory,
                    drcr: -totalInventory
                })
            }
            // End Account Integration
            doc.total = doc.total + totalInventory
        }
        else {
            Meteor.call('pos.generateInvoiceGroup', {doc});
            accountRefType = 'Invoice';
            let totalGratis = 0;
            let totalCOGS = 0;
            doc.items.forEach(function (item) {
                if (item.price == 0) {
                    increaseGratisInventory(item, doc.branchId, doc.stockLocationId);
                    let inventoryObj = AverageInventories.findOne({
                        itemId: item.itemId,
                        branchId: doc.branchId,
                        stockLocationId: doc.stockLocationId
                    }, {sort: {_id: -1}});
                    if (inventoryObj) {
                        totalGratis += item.qty * inventoryObj.averagePrice;
                    } else {
                        throw new Meteor.Error('Not Found Inventory. @Invoices-after-insert. refId:' + doc._id);
                    }
                } else {
                    let inventoryObj = AverageInventories.findOne({
                        itemId: item.itemId,
                        branchId: doc.branchId,
                        stockLocationId: doc.stockLocationId
                    }, {sort: {_id: -1}});
                    if (inventoryObj) {
                        totalCOGS += item.qty * inventoryObj.averagePrice;
                    } else {
                        throw new Meteor.Error('Not Found Inventory. @Invoices-after-insert. refId:' + doc._id);
                    }
                }
            });
            invoiceManageStock(doc);
            let totalInventory = totalCOGS + totalGratis;
            // Account Integration
            if (setting && setting.integrate) {
                let arChartAccount = AccountMapping.findOne({name: 'A/R'});
                let saleIncomeChartAccount = AccountMapping.findOne({name: 'Sale Income'});
                let cogsChartAccount = AccountMapping.findOne({name: 'COGS'});
                let gratisChartAccount = AccountMapping.findOne({name: 'Gratis'});
                let inventoryChartAccount = AccountMapping.findOne({name: 'Inventory'});

                transaction.push(
                    {
                        account: arChartAccount.account,
                        dr: doc.total,
                        cr: 0,
                        drcr: doc.total
                    },
                    {
                        account: saleIncomeChartAccount.account,
                        dr: 0,
                        cr: doc.total,
                        drcr: -doc.total
                    },
                    {
                        account: cogsChartAccount.account,
                        dr: totalCOGS,
                        cr: 0,
                        drcr: totalCOGS
                    }
                );

                if (totalGratis > 0) {
                    accountRefType = 'Invoice-Gratis';
                    transaction.push({
                        account: gratisChartAccount.account,
                        dr: totalGratis,
                        cr: 0,
                        drcr: totalGratis
                    })
                }
                transaction.push({
                    account: inventoryChartAccount.account,
                    dr: 0,
                    cr: totalInventory,
                    drcr: -totalInventory
                })
            }
            // End Account Integration
            doc.total = doc.total + totalInventory
        }
        // Account Integration
        if (setting && setting.integrate) {
            let data = doc;
            data.type = accountRefType;

            /*data.items.forEach(function (item) {
             let itemDoc = Item.findOne(item.itemId)
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
             });*/

            let customerDoc = Customers.findOne({_id: doc.customerId});
            if (customerDoc) {
                data.name = customerDoc.name;
                data.des = data.des == "" || data.des == null ? (des + data.name) : data.des;
            }

            data.transaction = transaction;
            data.journalDate = data.invoiceDate;
            Meteor.call('insertAccountJournal', data)
        }
        // End Account Integration
    })
});

Invoices.after.update(function (userId, doc) {
    Meteor.defer(() => {
        let des = "វិក្កយបត្រ អតិថិជនៈ ";
        let preDoc = this.previous;
        let setting = AccountIntegrationSetting.findOne();
        let type = {
            saleOrder: doc.invoiceType == 'saleOrder',
            term: doc.invoiceType == 'term',
            group: doc.invoiceType == 'group'
        };

        let accountRefType = 'Invoice';
        let transaction = [];
        if (type.saleOrder) {
            des = "វិក្កយបត្រ SO អតិថិជនៈ ";
            accountRefType = 'Invoice-SaleOrder';
            recalculateQty(preDoc);
            updateQtyInSaleOrder(doc);
            let saleOrder = Order.aggregate([{$match: {_id: doc.saleId}}, {$projection: {sumRemainQty: 1}}]);
            if (saleOrder.sumRemainQty == 0) {
                Order.direct.update(doc.saleId, {$set: {status: 'closed'}})
            } else {
                Order.direct.update(doc.saleId, {$set: {status: 'active'}})
            }
            let total = 0;
            doc.items.forEach(function (item) {
                total += item.amount;
            });
            doc.total = total;
            if (setting && setting.integrate) {
                let oweInventoryCustomerChartAccount = AccountMapping.findOne({name: 'Owe Inventory Customer'});
                let inventoryChartAccount = AccountMapping.findOne({name: 'Inventory'});

                transaction.push({
                    account: oweInventoryCustomerChartAccount.account,
                    dr: doc.total,
                    cr: 0,
                    drcr: doc.total
                }, {
                    account: inventoryChartAccount.account,
                    dr: 0,
                    cr: doc.total,
                    drcr: -doc.total
                })
            }
            // End Account Integration
            preDoc.items.forEach(function (item) {
                if (item.price == 0) {
                    reduceGratisInventory(item, preDoc.branchId, preDoc.stockLocationId)
                }
            });
            returnToInventory(preDoc);
            let totalGratis = 0;
            let totalCOGS = 0;
            doc.items.forEach(function (item) {
                let inventoryObj = AverageInventories.findOne({
                    itemId: item.itemId,
                    branchId: doc.branchId,
                    stockLocationId: doc.stockLocationId
                }, {sort: {_id: -1}});
                if (inventoryObj) {
                    if (item.price == 0) {
                        increaseGratisInventory(item, doc.branchId, doc.stockLocationId);
                        totalGratis += item.qty * inventoryObj.averagePrice;
                    } else {
                        totalCOGS += item.qty * inventoryObj.averagePrice;
                    }
                } else {
                    throw new Meteor.Error('Not Found Inventory. @Invoices-after-update. refId:' + doc._id);
                }
            });
            invoiceManageStock(doc);
            let totalInventory = totalCOGS + totalGratis;
            //more to do .....

        }
        else if (type.group) {
            accountRefType = 'Invoice';
            preDoc.items.forEach(function (item) {
                if (item.price == 0) {
                    reduceGratisInventory(item, preDoc.branchId, preDoc.stockLocationId)
                }
            });
            removeInvoiceFromGroup(preDoc);
            pushInvoiceFromGroup(doc);
            recalculatePayment({preDoc, doc});
            // average inventory calculate
            returnToInventory(preDoc, doc.invoiceDate);
            // invoiceState.set(doc._id, {customerId: doc.customerId, invoiceId: doc._id, total: doc.total})
            let totalGratis = 0;
            let totalCOGS = 0;
            doc.items.forEach(function (item) {
                let inventoryObj = AverageInventories.findOne({
                    itemId: item.itemId,
                    branchId: doc.branchId,
                    stockLocationId: doc.stockLocationId
                }, {sort: {_id: -1}});
                if (inventoryObj) {
                    if (item.price == 0) {
                        increaseGratisInventory(item, doc.branchId, doc.stockLocationId);
                        totalGratis += item.qty * inventoryObj.averagePrice;
                    } else {
                        totalCOGS += item.qty * inventoryObj.averagePrice;
                    }
                } else {
                    throw new Meteor.Error('Not Found Inventory. @Invoices-after-update. refId:' + doc._id);
                }
            });
            invoiceManageStock(doc);
            let totalInventory = totalCOGS + totalGratis;
            if (setting && setting.integrate) {
                let arChartAccount = AccountMapping.findOne({name: 'A/R'});
                let saleIncomeChartAccount = AccountMapping.findOne({name: 'Sale Income'});
                let cogsChartAccount = AccountMapping.findOne({name: 'COGS'});
                let gratisChartAccount = AccountMapping.findOne({name: 'Gratis'});
                let inventoryChartAccount = AccountMapping.findOne({name: 'Inventory'});


                transaction.push(
                    {
                        account: arChartAccount.account,
                        dr: doc.total,
                        cr: 0,
                        drcr: doc.total
                    },
                    {
                        account: saleIncomeChartAccount.account,
                        dr: 0,
                        cr: doc.total,
                        drcr: -doc.total
                    },
                    {
                        account: cogsChartAccount.account,
                        dr: totalCOGS,
                        cr: 0,
                        drcr: totalCOGS
                    }
                );
                if (totalGratis > 0) {
                    accountRefType = 'Invoice-Gratis';
                    transaction.push({
                        account: gratisChartAccount.account,
                        dr: totalGratis,
                        cr: 0,
                        drcr: totalGratis
                    })
                }
                transaction.push({
                    account: inventoryChartAccount.account,
                    dr: 0,
                    cr: totalInventory,
                    drcr: -totalInventory
                })
            }
            // End Account Integration
            doc.total = doc.total + totalInventory;
        }
        else {
            accountRefType = 'Invoice';
            preDoc.items.forEach(function (item) {
                if (item.price == 0) {
                    reduceGratisInventory(item, preDoc.branchId, preDoc.stockLocationId)
                }
            });
            recalculatePayment({preDoc, doc});
            // average inventory calculate
            returnToInventory(preDoc, doc.invoiceDate);
            let totalGratis = 0;
            let totalCOGS = 0;
            doc.items.forEach(function (item) {
                let inventoryObj = AverageInventories.findOne({
                    itemId: item.itemId,
                    branchId: doc.branchId,
                    stockLocationId: doc.stockLocationId
                }, {sort: {_id: -1}});
                if (inventoryObj) {
                    if (item.price == 0) {
                        increaseGratisInventory(item, doc.branchId, doc.stockLocationId)
                        totalGratis += item.qty * inventoryObj.averagePrice;
                    } else {
                        totalCOGS += item.qty * inventoryObj.averagePrice;
                    }
                } else {
                    throw new Meteor.Error('Not Found Inventory. @Invoices-after-update. refId:' + doc._id);
                }
            });
            invoiceManageStock(doc);
            let totalInventory = totalCOGS + totalGratis;
            if (setting && setting.integrate) {
                let arChartAccount = AccountMapping.findOne({name: 'A/R'});
                let saleIncomeChartAccount = AccountMapping.findOne({name: 'Sale Income'});
                let cogsChartAccount = AccountMapping.findOne({name: 'COGS'});
                let gratisChartAccount = AccountMapping.findOne({name: 'Gratis'});
                let inventoryChartAccount = AccountMapping.findOne({name: 'Inventory'});


                transaction.push(
                    {
                        account: arChartAccount.account,
                        dr: doc.total,
                        cr: 0,
                        drcr: doc.total
                    },
                    {
                        account: saleIncomeChartAccount.account,
                        dr: 0,
                        cr: doc.total,
                        drcr: -doc.total
                    },
                    {
                        account: cogsChartAccount.account,
                        dr: totalCOGS,
                        cr: 0,
                        drcr: totalCOGS
                    }
                );
                if (totalGratis > 0) {
                    accountRefType = 'Invoice-Gratis';
                    transaction.push({
                        account: gratisChartAccount.account,
                        dr: totalGratis,
                        cr: 0,
                        drcr: totalGratis
                    })
                }
                transaction.push({
                    account: inventoryChartAccount.account,
                    dr: 0,
                    cr: totalInventory,
                    drcr: -totalInventory
                })
            }
            // End Account Integration
            doc.total = doc.total + totalInventory;
        }
        // Account Integration
        if (setting && setting.integrate) {
            let data = doc;
            data.type = accountRefType;
            data.transaction = transaction;
            data.journalDate = data.invoiceDate;
            let customerDoc = Customers.findOne({_id: doc.customerId});
            if (customerDoc) {
                data.name = customerDoc.name;
                data.des = data.des == "" || data.des == null ? (des + data.name) : data.des;
            }

            Meteor.call('updateAccountJournal', data)
        }
        // End Account Integration
    })
});
// remove
Invoices.after.remove(function (userId, doc) {
    Meteor.defer(function () {
        let accountRefType = 'Invoice';
        Meteor._sleepForMs(200);
        let type = {
            saleOrder: doc.invoiceType == 'saleOrder',
            term: doc.invoiceType == 'term',
            group: doc.invoiceType == 'group'
        };
        if (type.saleOrder) {
            accountRefType = 'Invoice-SaleOrder';
            recalculateQty(doc);
            Order.direct.update(doc.saleId, {$set: {status: 'active'}})
        } else if (type.group) {
            accountRefType = 'Invoice';
            doc.items.forEach(function (item) {
                if (item.price == 0) {
                    accountRefType = 'Invoice-Gratis';
                    reduceGratisInventory(item, doc.branchId, doc.stockLocationId)
                }
            });
            removeInvoiceFromGroup(doc);
            let groupInvoice = GroupInvoice.findOne(doc.paymentGroupId);
            if (groupInvoice && groupInvoice.invoices.length <= 0) {
                GroupInvoice.direct.remove(doc.paymentGroupId)
            } else {
                recalculatePaymentAfterRemoved({doc})
            }
            // average inventory calculation
            returnToInventory(doc, moment().toDate())
        } else {
            accountRefType = 'Invoice';
            doc.items.forEach(function (item) {
                if (item.price == 0) {
                    reduceGratisInventory(item, doc.branchId, doc.stockLocationId);
                    accountRefType = 'Invoice-Gratis'
                }
            });
            // average inventory calculation
            returnToInventory(doc, moment().toDate())
        }
        Meteor.call('insertRemovedInvoice', doc);
        // Account Integration
        console.log(accountRefType);
        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let data = {_id: doc._id, type: accountRefType};
            Meteor.call('removeAccountJournal', data)
        }
        // End Account Integration

    })
});

// update qty
function updateQtyInSaleOrder(doc) {
    Meteor._sleepForMs(200);
    doc.items.forEach(function (item) {
        Order.direct.update(
            {_id: doc.saleId, 'items.itemId': item.itemId},
            {$inc: {'items.$.remainQty': -item.qty, sumRemainQty: -item.qty}}
        )
    })
}
// recalculate qty
function recalculateQty(preDoc) {
    Meteor._sleepForMs(200);
    let updatedFlag;
    preDoc.items.forEach(function (item) {
        Order.direct.update(
            {_id: preDoc.saleId, 'items.itemId': item.itemId},
            {$inc: {'items.$.remainQty': item.qty, sumRemainQty: item.qty}}
        ); // re sum remain qty
    })
}
// update group invoice
function removeInvoiceFromGroup(doc) {
    Meteor._sleepForMs(200);
    GroupInvoice.update({_id: doc.paymentGroupId}, {$pull: {invoices: {_id: doc._id}}, $inc: {total: -doc.total}})
}
function pushInvoiceFromGroup(doc) {
    Meteor._sleepForMs(200);
    GroupInvoice.update({_id: doc.paymentGroupId}, {$addToSet: {invoices: doc}, $inc: {total: doc.total}})
}
// update inventory
function returnToInventory(invoice, invoiceDate) {
    // ---Open Inventory type block "Average Inventory"---
    // let invoice = Invoices.findOne(invoiceId)
    invoice.items.forEach(function (item) {
        item.price = item.cost;
        StockFunction.averageInventoryInsert(
            invoice.branchId,
            item,
            invoice.stockLocationId,
            'invoice-return',
            invoice._id,
            invoiceDate
        )
    });
// --- End Inventory type block "Average Inventory"---
}
function invoiceManageStock(invoice) {
    // ---Open Inventory type block "Average Inventory"---
    let totalCost = 0;
    // let invoice = Invoices.findOne(invoiceId)
    let prefix = invoice.stockLocationId + '-';
    let newItems = [];
    invoice.items.forEach(function (item) {
        let refType = 'invoice';
        if (item.price == 0) {
            refType = 'invoice-free';
        }
        let inventory = AverageInventories.findOne({
            branchId: invoice.branchId,
            itemId: item.itemId,
            stockLocationId: invoice.stockLocationId
        }, {sort: {_id: -1}});
        if (inventory) {
            item.cost = inventory.averagePrice;
            item.amountCost = inventory.averagePrice * item.qty;
            item.profit = item.amount - item.amountCost;
            totalCost += item.amountCost;
            newItems.push(item);

            let remainQty = inventory.remainQty - item.qty;
            let lastAmount = 0;
            let averagePrice = 0;
            if (remainQty != 0) {
                lastAmount = inventory.lastAmount - (inventory.averagePrice * item.qty);
                averagePrice = lastAmount / remainQty;
            }
            let imeis=subtractImeiArray(inventory.imei,item.imei);
            let newInventory = {
                _id: idGenerator.genWithPrefix(AverageInventories, prefix, 13),
                branchId: invoice.branchId,
                stockLocationId: invoice.stockLocationId,
                itemId: item.itemId,
                qty: -item.qty,
                price: inventory.averagePrice,
                amount: -item.qty * inventory.averagePrice,
                lastAmount: lastAmount,
                remainQty: remainQty,
                averagePrice: averagePrice,
                coefficient: -1,
                type: refType,
                refId: invoice._id,
                inventoryDate: invoice.invoiceDate,
                imei:imeis
            };
            id = AverageInventories.insert(newInventory);
            let setModifier = {$set: {}};
            setModifier.$set['qtyOnHand.' + invoice.stockLocationId] = remainQty;
            setModifier.$set['imei.' + invoice.stockLocationId] = imeis;
            Item.direct.update(item.itemId, setModifier);

        } else {
            throw new Meteor.Error('Not Found Inventory. @invoiceManageStock. refId:' + invoice._id);
        }
    });
    let totalProfit = invoice.total - totalCost;
    Invoices.direct.update(
        invoice._id,
        {$set: {items: newItems, totalCost: totalCost, profit: totalProfit}}
    );
// --- End Inventory type block "Average Inventory"---
}
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
        AverageInventories.insert(inventoryObj)
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
         inventorySet = {}
         inventorySet.qty = item.qty + inventory.qty
         inventorySet.remainQty = inventory.remainQty + item.qty
         AverageInventories.update(inventory._id, {$set: inventorySet})
         */
    } else {
        let totalQty = inventory.remainQty + item.qty;
        let price = 0;
        // should check totalQty or inventory.remainQty
        if (totalQty <= 0) {
            price = inventory.price
        } else if (inventory.remainQty <= 0) {
            price = item.price
        } else {
            price = ((inventory.remainQty * inventory.price) + (item.qty * item.price)) / totalQty
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
        AverageInventories.insert(nextInventory)
    }

    var setModifier = {$set: {purchasePrice: lastPurchasePrice}};
    setModifier.$set['qtyOnHand.' + stockLocationId] = remainQuantity;
    Item.direct.update(item.itemId, setModifier)
}
// update payment
function recalculatePayment({doc, preDoc}) {
    let totalChanged = doc.total - preDoc.total;
    if (totalChanged != 0) {
        let invoiceId = doc.paymentGroupId || doc._id;
        let receivePayment = ReceivePayment.find({invoiceId: invoiceId});
        if (receivePayment.count() > 0) {
            ReceivePayment.update({invoiceId: invoiceId}, {
                $inc: {
                    dueAmount: totalChanged,
                    balanceAmount: totalChanged
                }
            }, {multi: true});
            ReceivePayment.direct.remove({invoiceId: invoiceId, dueAmount: {$lte: 0}})
        }
    }
}
// update payment after remove
function recalculatePaymentAfterRemoved({doc}) {
    let totalChanged = -doc.total;
    if (totalChanged != 0) {
        let invoiceId = doc.paymentGroupId;
        let receivePayment = ReceivePayment.find({invoiceId: invoiceId});
        if (receivePayment.count() > 0) {
            ReceivePayment.update({invoiceId: invoiceId}, {
                $inc: {
                    dueAmount: totalChanged,
                    balanceAmount: totalChanged
                }
            }, {multi: true});
            ReceivePayment.direct.remove({invoiceId: invoiceId, dueAmount: {$lte: 0}})
        }
    }
}
function increaseGratisInventory(item, branchId, stockLocationId) {
    let prefix = stockLocationId + '-';
    let gratisInventory = GratisInventories.findOne({
        branchId: branchId,
        itemId: item.itemId,
        stockLocationId: stockLocationId
    }, {sort: {createdAt: -1}});
    if (gratisInventory == null) {
        let gratisInventoryObj = {};
        gratisInventoryObj._id = idGenerator.genWithPrefix(GratisInventories, prefix, 13);
        gratisInventoryObj.branchId = branchId;
        gratisInventoryObj.stockLocationId = stockLocationId;
        gratisInventoryObj.itemId = item.itemId;
        gratisInventoryObj.qty = item.qty;
        GratisInventories.insert(gratisInventoryObj)
    } else {
        GratisInventories.update(
            gratisInventory._id,
            {
                $inc: {qty: item.qty}
            })
    }
}
function reduceGratisInventory(item, branchId, stockLocationId) {
    let prefix = stockLocationId + '-';
    let gratisInventory = GratisInventories.findOne({
        branchId: branchId,
        itemId: item.itemId,
        stockLocationId: stockLocationId
    }, {sort: {createdAt: -1}});
    if (gratisInventory) {
        GratisInventories.update(
            gratisInventory._id,
            {
                $inc: {qty: -item.qty}
            }
        )
    } else {
        let gratisInventoryObj = {};
        gratisInventoryObj._id = idGenerator.genWithPrefix(GratisInventories, prefix, 13);
        gratisInventoryObj.branchId = branchId;
        gratisInventoryObj.stockLocationId = stockLocationId;
        gratisInventoryObj.itemId = item.itemId;
        gratisInventoryObj.qty = -item.qty;
        GratisInventories.insert(gratisInventoryObj)
    }
}
function subtractImeiArray(src, filt) {
    let temp = {}, i, result = [];
    // load contents of filt into an object
    // for faster lookup
    for (i = 0; i < filt.length; i++) {
        temp[filt[i]] = true;
    }

    // go through each item in src
    for (i = 0; i < src.length; i++) {
        if (!(src[i] in temp)) {
            result.push(src[i]);
        }
    }
    return (result);
}
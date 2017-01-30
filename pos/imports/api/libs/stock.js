import  {AverageInventories} from '../collections/inventory'
import  {Item} from '../collections/item'
import {RingPullInventories} from '../collections/ringPullInventory.js'
import {GratisInventories} from '../collections/gratisInventory'

export  default class StockFunction {
    static averageInventoryInsert(branchId, item, stockLocationId, type, refId) {
        let lastPurchasePrice = 0;
        let remainQuantity = 0;
        let prefix = stockLocationId + '-';
        let inventory = AverageInventories.findOne({
            branchId: branchId,
            itemId: item.itemId,
            stockLocationId: stockLocationId
        }, {sort: {createdAt: -1}});
        if (inventory) {
            let totalQty = inventory.remainQty + item.qty;
            let lastAmount = inventory.lastAmount + (item.qty * item.price);
            let averagePrice = lastAmount / totalQty;
            let nextInventory = {};
            nextInventory._id = idGenerator.genWithPrefix(AverageInventories, prefix, 13);
            nextInventory.branchId = branchId;
            nextInventory.stockLocationId = stockLocationId;
            nextInventory.itemId = item.itemId;
            nextInventory.qty = item.qty;
            nextInventory.price = item.price;
            nextInventory.amount = item.qty * item.price;
            nextInventory.lastAmount = lastAmount;
            nextInventory.remainQty = totalQty;
            nextInventory.averagePrice = averagePrice;
            nextInventory.type = type;
            nextInventory.coefficient = 1;
            nextInventory.refId = refId;
            //lastPurchasePrice = price;
            remainQuantity = totalQty;
            console.log(nextInventory);
            AverageInventories.insert(nextInventory);
        }
        else {
            let totalQty = item.qty;
            let lastAmount = item.qty * item.price;
            let averagePrice = lastAmount / totalQty;
            let inventoryObj = {};
            inventoryObj._id = idGenerator.genWithPrefix(AverageInventories, prefix, 13);
            inventoryObj.branchId = branchId;
            inventoryObj.stockLocationId = stockLocationId;
            inventoryObj.itemId = item.itemId;
            inventoryObj.qty = item.qty;
            inventoryObj.price = item.price;
            inventoryObj.amount = item.price * item.qty;
            inventoryObj.lastAmount = item.price * item.qty;
            inventoryObj.remainQty = item.qty;
            inventoryObj.averagePrice = averagePrice;
            inventoryObj.type = type;
            inventoryObj.coefficient = 1;
            inventoryObj.refId = refId;
            //lastPurchasePrice = item.price;
            remainQuantity = totalQty;
            AverageInventories.insert(inventoryObj);
        }
        //var setModifier = {$set: {purchasePrice: lastPurchasePrice}};
        let setModifier = {$set: {}};
        setModifier.$set['qtyOnHand.' + stockLocationId] = remainQuantity;
        Item.direct.update(item.itemId, setModifier);
    }

    static averageInventoryInsertForBill(branchId, item, stockLocationId, type, refId) {
        let id = '';
        //let lastPurchasePrice = 0;
        let remainQuantity = 0;
        let prefix = stockLocationId + '-';
        let inventory = AverageInventories.findOne({
            branchId: branchId,
            itemId: item.itemId,
            stockLocationId: stockLocationId
        }, {sort: {createdAt: -1}});

        if (inventory) {
            let totalQty = inventory.remainQty + item.qty;
            let lastAmount = inventory.lastAmount + (item.qty * item.price);
            let averagePrice = lastAmount / totalQty;
            let nextInventory = {};
            nextInventory._id = idGenerator.genWithPrefix(AverageInventories, prefix, 13);
            nextInventory.branchId = branchId;
            nextInventory.stockLocationId = stockLocationId;
            nextInventory.itemId = item.itemId;
            nextInventory.qty = item.qty;
            nextInventory.price = item.price;
            nextInventory.remainQty = totalQty;
            nextInventory.type = type;
            nextInventory.amount = item.qty * item.price;
            nextInventory.coefficient = 1;
            nextInventory.refId = refId;
            nextInventory.lastAmount = lastAmount;
            nextInventory.averagePrice = averagePrice;
            //lastPurchasePrice = price;
            remainQuantity = totalQty;
            id = AverageInventories.insert(nextInventory);
        }
        else {
            //let thisItem = Item.findOne(item.itemId);
            let totalQty = item.qty;
            let lastAmount = item.qty * item.price;
            let averagePrice = lastAmount / totalQty;
            let inventoryObj = {};
            inventoryObj._id = idGenerator.genWithPrefix(AverageInventories, prefix, 13);
            inventoryObj.branchId = branchId;
            inventoryObj.stockLocationId = stockLocationId;
            inventoryObj.itemId = item.itemId;
            inventoryObj.qty = item.qty;
            inventoryObj.price = item.price;
            inventoryObj.amount = lastAmount;
            inventoryObj.lastAmount = lastAmount;
            inventoryObj.remainQty = totalQty;
            inventoryObj.averagePrice = averagePrice;
            inventoryObj.type = type;
            inventoryObj.coefficient = 1;
            inventoryObj.refId = refId;
            //lastPurchasePrice = item.price;
            remainQuantity = totalQty;
            id = AverageInventories.insert(inventoryObj);
        }
        var setModifier = {$set: {purchasePrice: item.price}};
        setModifier.$set['qtyOnHand.' + stockLocationId] = remainQuantity;
        Item.direct.update(item.itemId, setModifier);
        return id;
    }

    static minusAverageInventoryInsertForBill(branchId, item, stockLocationId, type, refId) {
        let id = '';
        let prefix = stockLocationId + '-';
        let inventory = AverageInventories.findOne({
            branchId: branchId,
            itemId: item.itemId,
            stockLocationId: stockLocationId
        }, {sort: {_id: -1}});
        if (inventory) {
            let totalQty = inventory.remainQty - item.qty;
            let lastAmount = 0;
            let averagePrice = 0;
            if (totalQty != 0) {
                lastAmount = inventory.lastAmount - (item.qty * item.price);
                averagePrice = lastAmount / totalQty;
            }
            let newInventory = {
                _id: idGenerator.genWithPrefix(AverageInventories, prefix, 13),
                branchId: branchId,
                stockLocationId: stockLocationId,
                itemId: item.itemId,
                qty: -item.qty,
                price: item.price,
                amount: -item.qty * item.price,
                remainQty: totalQty,
                lastAmount: lastAmount,
                averagePrice: averagePrice,
                coefficient: -1,
                type: type,
                refId: refId
            };
            id = AverageInventories.insert(newInventory);
        }
        else {
            throw new Meteor.Error('Not Found Inventory. @' + type + " refId:" + refId);
        }
        return id;
    }

    static minusAverageInventoryInsert(branchId, item, stockLocationId, type, refId) {
        let id = '';
        let prefix = stockLocationId + '-';
        let inventory = AverageInventories.findOne({
            branchId: branchId,
            itemId: item.itemId,
            stockLocationId: stockLocationId
        }, {sort: {_id: -1}});
        if (inventory) {
            let remainQty = inventory.remainQty - item.qty;
            let lastAmount = 0;
            let averagePrice = 0;
            if (remainQty != 0) {
                lastAmount = inventory.lastAmount - (inventory.averagePrice * item.qty);
                averagePrice = lastAmount / remainQty;
            }
            let newInventory = {
                _id: idGenerator.genWithPrefix(AverageInventories, prefix, 13),
                branchId: branchId,
                stockLocationId: stockLocationId,
                itemId: item.itemId,
                qty: -item.qty,
                price: inventory.averagePrice,
                amount: -item.qty * inventory.averagePrice,
                lastAmount: lastAmount,
                remainQty: remainQty,
                averagePrice: averagePrice,
                coefficient: -1,
                type: type,
                refId: refId
            };
            id = AverageInventories.insert(newInventory);
            let setModifier = {$set: {}};
            setModifier.$set['qtyOnHand.' + stockLocationId] = remainQty;
            Item.direct.update(item.itemId, setModifier);
        }
        else {
            throw new Meteor.Error('Not Found Inventory. @' + type + " refId:" + refId);
            /* let thisItem = Item.findOne(item.itemId);
             let newInventory = {
             _id: idGenerator.genWithPrefix(AverageInventories, prefix, 13),
             branchId: branchId,
             stockLocationId: stockLocationId,
             itemId: item.itemId,
             qty: item.qty,
             price: thisItem.purchasePrice,
             remainQty: 0 - item.qty,
             lastAmount: 0 - (item.qty * thisItem.purchasePrice),
             averagePrice: thisItem.purchasePrice,
             coefficient: -1,
             type: type,
             refId: refId
             };
             id = AverageInventories.insert(newInventory);*/
        }
        return id;
    }

    static reduceRingPullInventory(companyExchangeRingPull) {
        companyExchangeRingPull.items.forEach(function (item) {
            //---Reduce from Ring Pull Stock---
            let ringPullInventory = RingPullInventories.findOne({
                branchId: companyExchangeRingPull.branchId,
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
                    branchId: companyExchangeRingPull.branchId,
                    qty: 0 - item.qty
                })
            }
        });
    }

    static increaseRingPullInventory(companyExchangeRingPull) {
        //---insert to Ring Pull Stock---
        companyExchangeRingPull.items.forEach(function (item) {
            let ringPullInventory = RingPullInventories.findOne({
                branchId: companyExchangeRingPull.branchId,
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
                    branchId: companyExchangeRingPull.branchId,
                    qty: item.qty
                })
            }
        });
    }

    static increaseGratisInventory(item, branchId, stockLocationId) {
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
            GratisInventories.insert(gratisInventoryObj);
        }
        else {
            GratisInventories.update(
                gratisInventory._id,
                {
                    $inc: {qty: item.qty}
                });
        }
    }

    static reduceGratisInventory(item, branchId, stockLocationId) {
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
            );
        }
        else {
            let gratisInventoryObj = {};
            gratisInventoryObj._id = idGenerator.genWithPrefix(GratisInventories, prefix, 13);
            gratisInventoryObj.branchId = branchId;
            gratisInventoryObj.stockLocationId = stockLocationId;
            gratisInventoryObj.itemId = item.itemId;
            gratisInventoryObj.qty = -item.qty;
            GratisInventories.insert(gratisInventoryObj);
        }
    }

    static checkStockByLocation(stockLocationId, ArgItems) {
        let items=[];
        ArgItems.reduce(function (res, value) {
            if (!res[value.itemId]) {
                res[value.itemId] = {
                    price: value.price,
                    amount: value.amount,
                    qty: 0,
                    itemId: value.itemId
                };
                items.push(res[value.itemId])
            } else {
                res[value.itemId].amount += value.amount;
            }
            res[value.itemId].qty += value.qty;
            return res;
        }, {});



        let result = {isEnoughStock: true, message: ''};
        let i = 1;
        items.forEach(function (item) {
            let thisItem = Item.findOne(item.itemId);
            let inventoryQty = !thisItem.qtyOnHand || (thisItem && thisItem.qtyOnHand[stockLocationId]) == null ? 0 : thisItem.qtyOnHand[stockLocationId];
            if (item.qty > inventoryQty) {
                result.isEnoughStock = false;
                result.message = thisItem.name + " is not enough in stock. Qty on hand: " + inventoryQty;
                return false;
            }
        });
        return result;

    }

    static checkStockByLocationWhenUpdate(stockLocationId, ArgItems, doc) {
        let items=[];
        ArgItems.reduce(function (res, value) {
            if (!res[value.itemId]) {
                res[value.itemId] = {
                    price: value.price,
                    amount: value.amount,
                    qty: 0,
                    itemId: value.itemId
                };
                items.push(res[value.itemId])
            } else {
                res[value.itemId].amount += value.amount;
            }
            res[value.itemId].qty += value.qty;
            return res;
        }, {});

        let docItems=[];
        doc.items.reduce(function (res, value) {
            if (!res[value.itemId]) {
                res[value.itemId] = {
                    price: value.price,
                    amount: value.amount,
                    qty: 0,
                    itemId: value.itemId
                };
                docItems.push(res[value.itemId])
            } else {
                res[value.itemId].amount += value.amount;
            }
            res[value.itemId].qty += value.qty;
            return res;
        }, {});
        doc.items=docItems;

        /*   let items = [];
         if (doc.stockLocationId == stockLocationId) {
         newitems.forEach(function (item) {
         let oldItem = doc.items.find(x => x.itemId == item.itemId);
         item.qty -= oldItem == null || oldItem.qty == null ? 0 : oldItem.qty;
         items.push(item);
         });
         } else {
         items = newitems;
         }*/
        let result = {isEnoughStock: true, message: ''};
        items.forEach(function (item) {
            let qty = 0;
            if (doc.stockLocationId == stockLocationId) {
                let oldItem = doc.items.find(x => x.itemId == item.itemId);
                qty = oldItem == null || oldItem.qty == null ? 0 : oldItem.qty;
            }
            let thisItem = Item.findOne(item.itemId);
            let inventoryQty = thisItem.qtyOnHand[stockLocationId] == null ? 0 : thisItem.qtyOnHand[stockLocationId];
            if (item.qty > (inventoryQty + qty)) {
                result.isEnoughStock = false;
                result.message = thisItem.name + " is not enough in stock. Qty on hand: " + (inventoryQty + qty);
                return false;
            }
        });
        return result;
    }

    static checkRingPullByBranch(branchId, items) {
        console.log(items);
        let result = {isEnoughStock: true, message: ''};
        items.forEach(function (item) {
            let thisItem = Item.findOne(item.itemId);
            let ringPullStock = RingPullInventories.findOne({itemId: item.itemId, branchId: branchId});
            if (ringPullStock) {
                if (item.qty > ringPullStock.qty) {
                    result.isEnoughStock = false;
                    result.message = thisItem.name + " is not enough Ring Pull. Qty on hand: " + ringPullStock.qty;
                    return false;
                }
            } else {
                result.isEnoughStock = false;
                result.message = thisItem.name + " is not enough Ring Pull. Qty on hand: " + ringPullStock.qty;
                return false;
            }
        });
        return result;
    }

    static checkRingPullByBranchWhenUpdate(branchId, items, doc) {
        let result = {isEnoughStock: true, message: ''};
        items.forEach(function (item) {
            let qty = 0;
            let oldItem = doc.items.find(x => x.itemId == item.itemId);
            qty = oldItem == null || oldItem.qty == null ? 0 : oldItem.qty;

            let thisItem = Item.findOne(item.itemId);
            let ringPullStock = RingPullInventories.findOne({itemId: item.itemId, branchId: branchId});
            if (ringPullStock) {
                if (item.qty > (ringPullStock.qty + qty)) {
                    result.isEnoughStock = false;
                    result.message = thisItem.name + " is not enough Ring Pull. Qty on hand: " + ringPullStock.qty;
                    return false;
                }
            } else {
                result.isEnoughStock = false;
                result.message = thisItem.name + " is not enough Ring Pull. Qty on hand: " + ringPullStock.qty;
                return false;
            }
        });
        return result;
    }


}
import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {LocationTransfers} from '../../imports/api/collections/locationTransfer.js';
import {AverageInventories} from '../../imports/api/collections/inventory.js';
import {Item} from '../../imports/api/collections/item.js';

LocationTransfers.before.insert(function (userId, doc) {
    let todayDate = moment().format('YYYYMMDD');
    let prefix = doc.fromBranchId + "-" + todayDate;
    doc._id = idGenerator.genWithPrefix(LocationTransfers, prefix, 4);
});

LocationTransfers.after.insert(function (userId, doc) {
    Meteor.defer(function () {
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
        LocationTransfers.direct.update(doc._id, {$set: {items: doc.items, total: doc.total}});
    })

});

LocationTransfers.after.update(function (userId, doc) {
    Meteor.defer(function () {
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
        LocationTransfers.direct.update(doc._id, {$set: {items: doc.items, total: doc.total}});
    })

});


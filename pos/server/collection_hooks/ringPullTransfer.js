import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {RingPullTransfers} from '../../imports/api/collections/ringPullTransfer.js';
import {AverageInventories} from '../../imports/api/collections/inventory';
import {Item} from '../../imports/api/collections/item.js';

RingPullTransfers.before.insert(function (userId, doc) {
    let todayDate = moment().format('YYYYMMDD');
    let prefix = doc.fromBranchId + "-" + todayDate;
    doc._id = idGenerator.genWithPrefix(RingPullTransfers, prefix, 4);
});

RingPullTransfers.after.insert(function (userId, doc) {
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
        RingPullTransfers.direct.update(doc._id, {$set: {items: doc.items, total: doc.total}});
    })

});

RingPullTransfers.after.update(function (userId, doc) {
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
        RingPullTransfers.direct.update(doc._id, {$set: {items: doc.items, total: doc.total}});
    })

});


//When Accept: reduce RingPull Inventory from fromBranch and Increase RingPull Inventory to toBranch
//When Accept: 
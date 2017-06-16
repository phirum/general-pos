import {Item} from '../../imports/api/collections/item.js'
import {RingPullInventories} from '../../imports/api/collections/ringPullInventory.js'

Meteor.methods({
    findItems(ids){
        return Item.aggregate([
            {$match:{_id:{$in:ids}}},
            {
                $lookup: {
                    from: "units",
                    localField: "unitId",
                    foreignField: "_id",
                    as: "unitDoc"
                },

            }, {
                $unwind: {path: "$unitDoc", preserveNullAndEmptyArrays: true}
            }
            , {
                $lookup: {
                    from: "pos_categories",
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "categoryDoc"
                },

            }, {
                $unwind: {path: "$categoryDoc", preserveNullAndEmptyArrays: true}
            }
        ]);
    },
    findItem(code,type){
        let selector = type=="id" ? {_id: code} : {barcode: code};
        return Item.aggregate([
            {$match:selector},
            {
                $lookup: {
                    from: "units",
                    localField: "unitId",
                    foreignField: "_id",
                    as: "unitDoc"
                },

            }, {
                $unwind: {path: "$unitDoc", preserveNullAndEmptyArrays: true}
            }
            , {
                $lookup: {
                    from: "pos_categories",
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "categoryDoc"
                },

            }, {
                $unwind: {path: "$categoryDoc", preserveNullAndEmptyArrays: true}
            }
        ])[0];
    },
    checkStockByLocation(stockLocationId, items){
        let result = {isEnoughStock: true, message: ''};
        let i = 1;
        items.forEach(function (item) {
            let thisItem = Item.findOne(item.itemId);
            let inventoryQty = thisItem.qtyOnHand[stockLocationId] == null ? 0 : thisItem.qtyOnHand[stockLocationId];
            if (item.qty > inventoryQty) {
                result.isEnoughStock = false;
                result.message = thisItem.name + " is not enough in stock. Qty on hand: " + inventoryQty;
                return false;
            }
        });
        return result;

    },
    findStockRingPull(itemId, branchId){
        let ringPullStock = RingPullInventories.findOne({itemId: itemId, branchId: branchId});
        if (ringPullStock) {
            return ringPullStock.qty;
        } else {
            return 0;
        }
    }
});

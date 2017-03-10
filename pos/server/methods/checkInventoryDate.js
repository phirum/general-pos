import {AverageInventories} from '../../imports/api/collections/inventory.js'
Meteor.methods({
    checkInventoryDate(branchId, stockLocationId){
        return AverageInventories.findOne({
            branchId: branchId,
            stockLocationId: stockLocationId,
        });
    }
});
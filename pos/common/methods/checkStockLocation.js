import {Meteor} from 'meteor/meteor';
import {Accounts} from 'meteor/accounts-base';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';

// Collection
import {Item} from '../../imports/api/collections/item.js';
// Check user password
export const CheckStockByLocation = new ValidatedMethod({
    name: 'pos.checkStockByLocation',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        stockLocationId: {type: String},
        items:{type:[Object]}
    }).validator(),
    run({stockLocationId, items}) {
        if (!this.isSimulation) {
            let result = {isEnoughStock: true, message: ''};
            let i = 1;
            items.forEach(function (item) {
                let thisItem = Item.findOne(item.itemId);
                let inventoryQty = thisItem.qtyOnHand[stockLocationId] == null ? 0 : thisItem.qtyOnHand[stockLocationId];
                if (item.qty > inventoryQty) {
                    result.isEnoughStock = false;
                    result.message = thisItem.name + " is not enough in stock. Qty on hand: " + inventoryQty;
                    console.log(result);
                    return false;
                }
                console.log(i);
                i++;

            });
            return result;
        }
    }
});

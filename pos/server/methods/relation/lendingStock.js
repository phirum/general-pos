import {Meteor} from 'meteor/meteor';
import {ReceiveItems} from '../../../imports/api/collections/receiveItem.js';
Meteor.methods({
    isLendingStockHasRelation: function (id) {
        let receiveItem = ReceiveItems.findOne({lendingStockId: id});
        return receiveItem ? receiveItem._id : false;
    }
});

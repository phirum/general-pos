import {Meteor} from 'meteor/meteor';
import {ReceiveItems} from '../../../imports/api/collections/receiveItem.js';
Meteor.methods({
    isPrepaidOrderHasRelation: function (id) {
        let receiveItem = ReceiveItems.findOne({prepaidOrderId: id});
        return receiveItem ? receiveItem._id : false;
    }
});

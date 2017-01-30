import {Meteor} from 'meteor/meteor';
import {ReceiveItems} from '../../../imports/api/collections/receiveItem.js';
Meteor.methods({
    isExchangeGratisHasRelation: function (id) {
        let receiveItem = ReceiveItems.findOne({exchangeGratisId: id});
        return receiveItem ? receiveItem._id : false;
    }
});

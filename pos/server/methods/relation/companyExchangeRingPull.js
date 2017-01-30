import {Meteor} from 'meteor/meteor';
import {ReceiveItems} from '../../../imports/api/collections/receiveItem.js';
Meteor.methods({
    isCompanyExchangeRingPullHasRelation: function (id) {
        let receiveItem = ReceiveItems.findOne({companyExchangeRingPullId: id});
        return receiveItem ? receiveItem._id : false;
    }
});

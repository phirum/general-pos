import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Collection
import {MapUserAndAccount} from '../../imports/api/collections/mapUserAndAccount';
/**
 * Chart Account
 */
Meteor.publish('acc.mapUserAndAccount', function () {
    if (this.userId) {
        this.unblock();
        return MapUserAndAccount.find();
    }
});

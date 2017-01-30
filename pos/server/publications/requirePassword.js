//
import {Meteor} from 'meteor/meteor';
//collections
import {RequirePassword} from '../../imports/api/collections/requirePassword';

Meteor.publish('pos.requirePassword', function posrequirePassword(selector) {
    if(this.userId) {
        Meteor._sleepForMs(200);
        let requirePasswords = RequirePassword.find(selector);
        return requirePasswords;
    }
    return this.ready();
});
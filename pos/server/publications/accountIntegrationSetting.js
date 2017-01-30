import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';

// Collection
import {AccountIntegrationSetting} from '../../imports/api/collections/accountIntegrationSetting.js';

Meteor.publish('pos.accountIntegrationSetting', function posAccountIntegrationSetting() {
    this.unblock();
    if (this.userId) {
        return AccountIntegrationSetting.find();
    }

    return this.ready();
});


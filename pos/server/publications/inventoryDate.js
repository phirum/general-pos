import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';

// Collection
import {InventoryDates} from '../../imports/api/collections/inventoryDate.js';

Meteor.publish('pos_inventoryDate', function posInventoryDate() {
    this.unblock();
    if (this.userId) {
        return InventoryDates.find({});
    }
});

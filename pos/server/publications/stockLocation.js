import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';

// Collection
import {StockLocations} from '../../imports/api/collections/stockLocation.js';

Meteor.publish('pos.stockLocation', function posStockLocation(selector, options) {
    this.unblock();
    new SimpleSchema({
        selector: {type: Object, blackbox: true},
        options: {type: Object, blackbox: true}
    }).validate({selector, options});
    if (this.userId) {
        let data = StockLocations.find(selector, options);
        return data;
    }
    return this.ready();
});

// Reactive Table
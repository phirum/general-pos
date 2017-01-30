/*
import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';

// Collection
import {StockAndAccountMapping} from '../../imports/api/collections/stockAndAccountMapping.js';

Meteor.publish('pos.rep', function posStockAndAccountMapping(selector, options) {
    this.unblock();
    new SimpleSchema({
        selector: {type: Object, blackbox: true},
        options: {type: Object, blackbox: true}
    }).validate({selector, options});
    if (this.userId) {
        let data = StockAndAccountMapping.find(selector, options);
        return data;
    }
    return this.ready();
});

// Reactive Table
*/

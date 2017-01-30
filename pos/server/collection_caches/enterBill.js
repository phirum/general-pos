import 'meteor/theara:collection-cache';

// Collection
import {EnterBills} from '../../imports/api/collections/enterBill.js';
import {Vendors} from '../../imports/api/collections/vendor.js';
import {StockLocations} from '../../imports/api/collections/stockLocation.js';

EnterBills.cacheTimestamp();
EnterBills.cacheDoc('vendor', Vendors, ['name']);
// EnterBills.cacheDoc('staff', Meteor.users, ['username']);
EnterBills.cacheDoc('stockLocation',StockLocations,['name']);
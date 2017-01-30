import 'meteor/theara:collection-cache';

// Collection
import {PayBills} from '../../imports/api/collections/payBill.js';
import {Vendors} from '../../imports/api/collections/vendor.js';

PayBills.cacheTimestamp();
PayBills.cacheDoc('vendor', Vendors, ['name']);
// PayBills.cacheDoc('staff', Meteor.users, ['username']);


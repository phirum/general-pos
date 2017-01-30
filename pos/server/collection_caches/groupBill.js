import 'meteor/theara:collection-cache';

// Collection
import {GroupBill} from '../../imports/api/collections/groupBill.js';
import {Vendors} from '../../imports/api/collections/vendor.js';

GroupBill.cacheTimestamp();
GroupBill.cacheDoc('vendor', Vendors, ['name'], 'vendorOrCustomerId');
// GroupBill.cacheDoc('staff', Meteor.users, ['username']);


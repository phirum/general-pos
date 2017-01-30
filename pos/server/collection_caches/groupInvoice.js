import 'meteor/theara:collection-cache';

// Collection
import {GroupInvoice} from '../../imports/api/collections/groupInvoice.js';
import {Customers} from '../../imports/api/collections/customer.js';

GroupInvoice.cacheTimestamp();
GroupInvoice.cacheDoc('customer', Customers, ['name'], 'vendorOrCustomerId');
// GroupInvoice.cacheDoc('staff', Meteor.users, ['username']);


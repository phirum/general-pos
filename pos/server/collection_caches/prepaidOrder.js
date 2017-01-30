import 'meteor/theara:collection-cache';

// Collection
import {PrepaidOrders} from '../../imports/api/collections/prepaidOrder.js';
import {Vendors} from '../../imports/api/collections/vendor.js';

PrepaidOrders.cacheTimestamp();
PrepaidOrders.cacheDoc('vendor', Vendors, ['name']);

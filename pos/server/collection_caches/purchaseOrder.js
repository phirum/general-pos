import 'meteor/theara:collection-cache';

// Collection
import {PurchaseOrder} from '../../imports/api/collections/purchaseOrder.js';
import {Vendors} from '../../imports/api/collections/vendor.js';

PurchaseOrder.cacheTimestamp();
PurchaseOrder.cacheDoc('vendor', Vendors, ['name']);

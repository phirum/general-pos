import 'meteor/theara:collection-cache';

// Collection
import {Vendors} from '../../imports/api/collections/vendor.js';
import {Terms} from '../../imports/api/collections/terms.js';
import {PaymentGroups} from '../../imports/api/collections/paymentGroup.js';
Vendors.cacheTimestamp();
Vendors.cacheDoc('term',Terms,['name', 'discountPercentages', 'discountIfPaidWithin', 'netDueIn']);
Vendors.cacheDoc('paymentGroup',PaymentGroups,['name', 'numberOfDay']);

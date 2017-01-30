import 'meteor/theara:collection-cache';

// Collection
import {Customers} from '../../imports/api/collections/customer.js';
import {Terms} from '../../imports/api/collections/terms.js';
import {Reps} from '../../imports/api/collections/rep.js';
import {PaymentGroups} from '../../imports/api/collections/paymentGroup.js';
Customers.cacheTimestamp();
Customers.cacheDoc('term',Terms,['name', 'discountPercentages', 'discountIfPaidWithin', 'netDueIn']);
Customers.cacheDoc('paymentGroup',PaymentGroups,['name', 'numberOfDay']);

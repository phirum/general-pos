import 'meteor/theara:collection-cache';

// Collection
import {Order} from '../../imports/api/collections/order.js';
import {Customers} from '../../imports/api/collections/customer.js';

Order.cacheTimestamp();
Order.cacheDoc('customer', Customers, ['name', 'gender']);

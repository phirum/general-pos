import 'meteor/theara:collection-cache';

// Collection
import {ExchangeRingPulls} from '../../imports/api/collections/exchangeRingPull.js';
import {Customers} from '../../imports/api/collections/customer.js';

ExchangeRingPulls.cacheTimestamp();
ExchangeRingPulls.cacheDoc('customer', Customers, ['name']);

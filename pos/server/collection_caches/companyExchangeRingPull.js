import 'meteor/theara:collection-cache';

// Collection
import {CompanyExchangeRingPulls} from '../../imports/api/collections/companyExchangeRingPull.js';
import {Vendors} from '../../imports/api/collections/vendor.js';

CompanyExchangeRingPulls.cacheTimestamp();
CompanyExchangeRingPulls.cacheDoc('vendor', Vendors, ['name']);

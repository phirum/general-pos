import 'meteor/theara:collection-cache';

// Collection
import {LendingStocks} from '../../imports/api/collections/lendingStock.js';
import {Vendors} from '../../imports/api/collections/vendor.js';
import {StockLocations} from '../../imports/api/collections/stockLocation.js';

LendingStocks.cacheTimestamp();
LendingStocks.cacheDoc('vendor', Vendors, ['name']);
LendingStocks.cacheDoc('stockLocation',StockLocations,['name']);
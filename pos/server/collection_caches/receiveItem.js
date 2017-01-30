import 'meteor/theara:collection-cache';

// Collection
import {ReceiveItems} from '../../imports/api/collections/receiveItem.js';
import {Vendors} from '../../imports/api/collections/vendor.js';
import {StockLocations} from '../../imports/api/collections/stockLocation.js';

ReceiveItems.cacheTimestamp();
ReceiveItems.cacheDoc('vendor', Vendors, ['name']);
ReceiveItems.cacheDoc('stockLocation',StockLocations,['name']);
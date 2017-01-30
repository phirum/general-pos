import 'meteor/theara:collection-cache';

// Collection
import {StockLocations} from '../../imports/api/collections/stockLocation.js';
StockLocations.cacheTimestamp();

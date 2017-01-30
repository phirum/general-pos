import 'meteor/theara:collection-cache';

// Collection
import {AverageInventories} from '../../imports/api/collections/inventory.js';
AverageInventories.cacheTimestamp();
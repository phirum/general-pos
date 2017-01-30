import 'meteor/theara:collection-cache';

// Collection
import {QuantityRangeMapping} from '../../imports/api/collections/quantityRangeMapping.js';
import {Item} from '../../imports/api/collections/item.js';
QuantityRangeMapping.cacheDoc('item',Item,['name']);

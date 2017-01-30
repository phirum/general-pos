import 'meteor/theara:collection-cache';

// Collection
import {Item} from '../../imports/api/collections/item.js';
import {Units} from '../../imports/api/collections/units.js';
Item.cacheDoc('unit', Units, ['name']);

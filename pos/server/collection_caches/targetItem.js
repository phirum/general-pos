import 'meteor/theara:collection-cache';

// Collection
import {TargetItem} from '../../imports/api/collections/targetItem.js';
import {Item} from '../../imports/api/collections/item.js';
TargetItem.cacheDoc('item', Item, ['name']);

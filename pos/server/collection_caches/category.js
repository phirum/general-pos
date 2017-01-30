import 'meteor/theara:collection-cache';

// Collection
import {Categories} from '../../imports/api/collections/category.js';


Categories.cacheTimestamp();
Categories.cacheDoc('parent',Categories,['name','_parent']);

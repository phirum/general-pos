import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {QuantityRangeMapping} from '../../imports/api/collections/quantityRangeMapping.js';

QuantityRangeMapping.before.insert(function (userId, doc) {
    doc._id = idGenerator.gen(QuantityRangeMapping, 3);
});


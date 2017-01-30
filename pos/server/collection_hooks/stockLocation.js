import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {StockLocations} from '../../imports/api/collections/stockLocation.js';

StockLocations.before.insert(function (userId, doc) {
    let prefix = doc.branchId + '-';
    doc._id = idGenerator.genWithPrefix(StockLocations, prefix, 3);
});



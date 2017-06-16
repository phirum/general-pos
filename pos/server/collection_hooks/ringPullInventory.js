import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {RingPullInventories} from '../../imports/api/collections/ringPullInventory.js';

RingPullInventories.before.insert(function (userId, doc) {
    let prefix = doc.branchId + "-";
    doc._id = idGenerator.genWithPrefix(RingPullInventories, prefix, 13);
});

//When Accept: reduce RingPull Inventory from fromBranch and Increase RingPull Inventory to toBranch
//When Accept: 
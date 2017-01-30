import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {TransferMoney} from '../../imports/api/collections/transferMoney.js';

TransferMoney.before.insert(function (userId, doc) {
    doc._id = idGenerator.genWithPrefix(TransferMoney, `${doc.fromBranchId}-`, 9);
});


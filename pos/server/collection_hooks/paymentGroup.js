import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

import {PaymentGroups} from '../../imports/api/collections/paymentGroup.js';
PaymentGroups.before.insert(function (userId, doc) {
    doc._id = idGenerator.gen(PaymentGroups, 3);
});


import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {Penalty} from '../../imports/api/collections/penalty.js';

Penalty.before.insert(function (userId, doc) {
    doc._id = idGenerator.gen(Penalty, 3);
});


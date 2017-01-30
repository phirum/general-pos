import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {Terms} from '../../imports/api/collections/terms.js';
Terms.before.insert(function (userId, doc) {
    doc._id = idGenerator.gen(Terms,3);
});

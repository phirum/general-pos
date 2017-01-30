import 'meteor/matb33:collection-hooks';
import { idGenerator } from 'meteor/theara:id-generator';

// Collection
import { Item } from '../../imports/api/collections/item.js';

Item.before.insert(function (userId, doc) {
    doc._id = idGenerator.gen(Item, 7);
});

Item.after.update(function (userId, doc) {
    Meteor.defer(function () {
        if (doc.scheme && doc.scheme.length <= 0) {
            Item.direct.update(doc._id, { $unset: { scheme: '' } });
        }
    });
});

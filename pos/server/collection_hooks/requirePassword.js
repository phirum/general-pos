import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {RequirePassword} from '../../imports/api/collections/requirePassword.js';

RequirePassword.before.insert(function (userId, doc) {
    doc._id = idGenerator.gen(RequirePassword, 3);
});



import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {Units} from '../../imports/api/collections/units.js';
Units.before.insert(function (userId, doc) {
  doc._id = idGenerator.gen(Units, 3);
});

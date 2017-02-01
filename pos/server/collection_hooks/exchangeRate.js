import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {ExchangeRates} from '../../imports/api/collections/exchangeRate.js';
ExchangeRates.before.insert(function (userId, doc) {
  doc._id = idGenerator.gen(ExchangeRates, 3);
});

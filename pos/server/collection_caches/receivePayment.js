import 'meteor/theara:collection-cache';

// Collection
import {ReceivePayment} from '../../imports/api/collections/receivePayment.js';
import {Customers} from '../../imports/api/collections/customer.js';

ReceivePayment.cacheTimestamp();
ReceivePayment.cacheDoc('customer', Customers, ['name']);
// ReceivePayment.cacheDoc('staff', Meteor.users, ['username']);


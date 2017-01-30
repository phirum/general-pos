import 'meteor/theara:collection-cache';

// Collection
import {ItemPriceForCustomers} from '../../imports/api/collections/itemPriceForCustomer.js';
import {Customers} from '../../imports/api/collections/customer.js';
ItemPriceForCustomers.cacheDoc('customer',Customers,['name', 'telephone']);


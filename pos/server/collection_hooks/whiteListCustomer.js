import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {WhiteListCustomer} from '../../imports/api/collections/whiteListCustomer.js';
import {Customers} from '../../imports/api/collections/customer.js';
WhiteListCustomer.before.insert(function (userId, doc) {
    let currentCustomer = Customers.findOne(doc.customerId);
    doc.customerName = currentCustomer.name;
    doc._id = idGenerator.gen(WhiteListCustomer, 3);
});


WhiteListCustomer.before.update(function (userId, doc, fieldNames, modifier, options) {
    modifier.$set = modifier.$set || {}
   if(modifier.$set.customerId) {
       let currentCustomer = Customers.findOne(modifier.$set.customerId);
       console.log(currentCustomer);
       modifier.$set.customerName = currentCustomer.name;
   }
});

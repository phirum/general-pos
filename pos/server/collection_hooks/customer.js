import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {Customers} from '../../imports/api/collections/customer.js';

Customers.before.insert(function (userId, doc) {
    let prefix = doc.branchId + '-';
    doc._id = idGenerator.genWithPrefix(Customers, prefix, 6);
});

Customers.after.update(function(userId, doc){
  Meteor.defer(function(){
    Meteor._sleepForMs(200);
    let customer = Customers.findOne(doc._id);
    if(doc.paymentType == 'Group'){
      if(customer.termId){
        Meteor.call('unsetTerm', doc._id);
      }
    }else{
      if(customer.paymentGroupId){
        Meteor.call('unsetGroup', doc._id);
      }
    }
  })
});

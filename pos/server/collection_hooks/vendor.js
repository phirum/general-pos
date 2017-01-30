import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {Vendors} from '../../imports/api/collections/vendor';

Vendors.before.insert(function (userId, doc) {
    doc._id = idGenerator.gen(Vendors, 5);
});

Vendors.after.update(function(userId, doc){
    Meteor.defer(function(){
        Meteor._sleepForMs(200);
        let vendor = Vendors.findOne(doc._id);
        if(doc.paymentType == 'Group'){
            if(vendor.termId){
                Vendors.direct.update(doc._id, {$unset: {termId: '', _term: ''}});
            }
        }else{
            if(vendor.paymentGroupId){
                Vendors.direct.update(doc._id, {$unset: {paymentGroupId: '', _paymentGroup: ''}});
            }
        }
    })
});

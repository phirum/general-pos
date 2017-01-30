import {Vendors} from '../../../imports/api/collections/vendor';
import {Customers} from '../../../imports/api/collections/customer';

Meteor.methods({
    getCustomerOrVendorInfo({obj}){
        if (obj.customerId) {
            obj.customerOrVendorObj = Customers.findOne(obj.customerId);
        } else if (obj.vendorId) {
            obj.customerOrVendorObj = Vendors.findOne(obj.vendorId);
        } else {
            obj.customerOrVendorObj = Vendors.findOne(obj.vendorId) || Customers.findOne(obj.customerId);
        }
        return obj;
    }
});
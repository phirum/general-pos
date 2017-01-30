import {WhiteListCustomer} from '../../imports/api/collections/whiteListCustomer';
Meteor.methods({
    reduceWhiteListCustomerLimitTimeByOne({whiteListCustomer}){
        console.log("White list customer is working now ");
        WhiteListCustomer.direct.update(whiteListCustomer._id, {$inc: {limitTimes: -1}});
    }
});
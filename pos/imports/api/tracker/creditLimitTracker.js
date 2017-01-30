import {checkCreditLimit} from '../../../common/methods/validations/creditLimit.js';
//collection
import {RequirePassword} from '../collections/requirePassword';
import {nullCollection} from '../collections/tmpCollection';
var itemsCollection = nullCollection;
Tracker.autorun(function () {
    if (Session.get('creditLimitAmount') || Session.get('getCustomerId') || Session.get('saleOrderCustomerId')) {
        let customerId = Session.get('getCustomerId') || Session.get('saleOrderCustomerId');
        let info = Session.get('customerInfo');
        if (info && Session.get('creditLimitAmount')) {
            checkCreditLimit.callPromise({
                customerId: customerId,
                customerInfo: info ? info.customerInfo : {},
                creditLimitAmount: Session.get('creditLimitAmount')
            })
                .then(function (result) {
                    let {customerInfo} = Session.get('customerInfo');
                    let requirePassword = RequirePassword.findOne({}, {sort: {_id: -1}});
                    if (_.includes(requirePassword.branchId, Session.get('currentBranch')) && requirePassword && customerInfo.creditLimit && result.limitAmount > customerInfo.creditLimit) {
                        if ((Session.get('getCustomerId') ? requirePassword.invoiceForm : requirePassword.saleOrderForm) && (!result.whiteListCustomer || (result.whiteListCustomer && result.whiteListCustomer.limitTimes == 0))) {
                            swal({
                                title: "Password Required!",
                                text: `Balance Amount(${result.limitAmount}) > Credit Limit(${customerInfo.creditLimit}), Ask your Admin for password!`,
                                input: "password",
                                showCancelButton: true,
                                closeOnConfirm: false,
                                inputPlaceholder: "Type Password",
                                preConfirm: function (inputValue) {
                                    return new Promise(function (resolve, reject) {
                                        if (inputValue === "") {
                                            reject("You need to input password!");
                                            return false
                                        } else if (inputValue !== "") {
                                            let inputPassword = inputValue.trim();
                                            if (inputPassword == requirePassword.password) {
                                                swal("Message!", "Successfully", "success");
                                                Session.set("creditLimitAmount", undefined);
                                                resolve();

                                            } else {
                                                // $('.reset-button').trigger('click'); //reset from when wrong
                                                // swal("Message!", "Incorrect Password!", "error");
                                                reject("Wrong password!");
                                            }
                                        }
                                    });
                                },
                                allowOutsideClick: false
                            })
                                .then(function (inputValue) {

                                }).catch(function (err) {
                                if (err == 'cancel') {
                                    itemsCollection.remove({});
                                    Session.set("creditLimitAmount", undefined);
                                }
                            });
                        } else if (result.whiteListCustomer && result.whiteListCustomer.limitTimes > 0) {
                            Meteor.call('reduceWhiteListCustomerLimitTimeByOne', {whiteListCustomer: result.whiteListCustomer});
                        }
                    }
                })
                .catch(function (err) {
                    console.log(err);
                });
        }
    }

});
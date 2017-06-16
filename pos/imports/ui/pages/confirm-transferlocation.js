//page
import './confirm-transferlocation.html';
//lib
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify';
import {renderTemplate} from '../../../../core/client/libs/render-template';
//collection
import {InventoryDates} from '../../api/collections/inventoryDate.js';
import {LocationTransfers} from '../../api/collections/locationTransfer';
import {AcceptTransfer_schema} from '../../api/collections/acceptTransfer.js'
//methods
let indexTmpl = Template.Pos_confirmTransferLocation,
    transferInfo = Template.transferInfo;
let transferState = new ReactiveVar(true);
let statusState = new ReactiveVar('active');
let loadMore = new ReactiveVar(0);
let sumLoadMore = new ReactiveVar(10);
let acceptFrom = Template.acceptForm;
indexTmpl.onCreated(function () {
    createNewAlertify('locationTransfer', {size: 'lg'});
    createNewAlertify('acceptLocationTransfer');
    this.autorun(function () {
        if (Session.get('currentBranch') || transferState.get() || statusState.get()) {
            let subscription = Meteor.subscribe('pos.activeLocationTransfers',
                {
                    toBranchId: Session.get('currentBranch'),
                    pending: transferState.get() == undefined ? true : transferState.get(),
                    status: statusState.get() || 'active'
                }, {sort: {_id: -1}, limit: sumLoadMore.get()});
            if (!subscription.ready()) {
                swal({
                    title: "Please Wait",
                    text: "Fetching Data....", showConfirmButton: false
                });
            } else {
                setTimeout(function () {
                    swal.close()
                }, 200);

            }
        }
        if (sumLoadMore.get() || transferState.get() || statusState.get()) {
            Meteor.call('loadMoreTransfer', {
                branchId: Session.get('currentBranch'),
                pending: transferState.get(),
                status: statusState.get()
            }, function (err, result) {
                loadMore.set(result);
            });
        }
    });
});

indexTmpl.helpers({
    transferRequest(){
        let locationTransfers = LocationTransfers.find({
            toBranchId: Session.get('currentBranch'),
            pending: transferState.get(),
            status: statusState.get()
        });
        return locationTransfers;
    },
    isNotEmpty(){
        let locationTransfers = LocationTransfers.find({toBranchId: Session.get('currentBranch')});
        return locationTransfers.count() > 0;
    },
    accepted(){
        if (!this.pending && this.status == 'closed') {
            return true;
        }
    },
    declined(){
        if (!this.pending && this.status == 'declined') {
            return true;
        }
    },
    isHasMore(){
        let locationTransfers = LocationTransfers.find({
            toBranchId: Session.get('currentBranch'),
            pending: transferState.get(),
            status: statusState.get()
        }).count();
        if (locationTransfers < loadMore.get()) {
            return true;
        }
        return false;
    }
});
indexTmpl.events({
    'click [data-toggle]'(event, instance){
        toggle = $(event.currentTarget).addClass('active').attr('data-toggle');
        $(event.currentTarget).siblings('[data-toggle]').removeClass('active');
    },
    'click .pending'(event, instance){
        transferState.set(true);
        statusState.set('active');
        loadMore.set(0);
        sumLoadMore.set(10);

    },
    'click .accepted'(event, instance){
        transferState.set(false);
        statusState.set('closed');
        loadMore.set(0);
        sumLoadMore.set(10);
    },
    'click .declined'(event, instance){
        transferState.set(false);
        statusState.set('declined')
        loadMore.set(0);
        sumLoadMore.set(10);
    },
    'click .show-detail'(event, instance){
        Meteor.call('pos.locationTransferInfo', {_id: this._id}, function (err, result) {
            if (result) {
                alertify.locationTransfer(fa('eye', 'Showing Transfer'), renderTemplate(transferInfo, result));
            }
            if (err) {
                console.log(err);
            }
        });
    },
    'click .accept'(){
        let doc = {id: this._id};
        Session.set('locationTransferDoc', this);

        alertify.acceptLocationTransfer(fa('eye', 'Accept Transfer'), renderTemplate(acceptFrom, doc));
        /*swal({
         title: "Are you sure?",
         text: "",
         type: "warning",
         showCancelButton: true,
         confirmButtonText: "Yes, accept it!",
         closeOnConfirm: false
         }).then(function () {
         Meteor.call('locationTransferManageStock', id, function (er, re) {
         if (er) {
         alertify.error(er.message);
         } else {
         swal({
         title: "Accepted!",
         text: "Successfully",
         type: "success",
         showConfirmButton: false,
         timer: 2000
         });
         }
         })
         });*/
    },
    'click .decline'(){
        let id = this._id;
        swal({
            title: "Are you sure?",
            text: "",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Yes, decline it!",
            closeOnConfirm: false
        }).then(function () {
            Meteor.call('declineTransfer', id, function (er, re) {
                if (er) {
                    alertify.error(er.message);
                } else {
                    swal({
                        title: "Declined!",
                        text: "successfully",
                        type: "success",
                        showConfirmButton: false,
                        timer: 2000
                    });
                }
            });
        });
    },
    'click .load-more'(event, instance){
        let more = sumLoadMore.get();
        sumLoadMore.set(more + 10);
    }
});
indexTmpl.onDestroyed(function () {
    transferState.set(true);
    statusState.set('active');
    loadMore.set(0);
    sumLoadMore.set(10);
});
transferInfo.helpers({
    capitalize(name){
        return _.capitalize(name);
    },
    accepted(){
        if (!this.pending && this.status == 'closed') {
            return true;
        }
    },
    declined(){
        if (!this.pending && this.status == 'declined') {
            return true;
        }
    },
    company(){
        let doc = Session.get('currentUserStockAndAccountMappingDoc');
        return doc.company;
    },
});
transferInfo.events({
    'click .printTransfer'(event, instance){
        $('#to-print').printThis();
    }
});
acceptFrom.events({
    'click .accept-transfer'(event, instance){
        debugger;
        let locationTransferDoc = Session.get('locationTransferDoc');
        let date = AutoForm.getFieldValue('date', 'accept_form');
        date = moment(date).startOf('days').toDate();

        let inventoryDate1 = InventoryDates.findOne({
            branchId: locationTransferDoc.fromBranchId,
            stockLocationId: locationTransferDoc.fromStockLocationId
        });
        let inventoryDate2 = InventoryDates.findOne({
            branchId: locationTransferDoc.toBranchId,
            stockLocationId: locationTransferDoc.toStockLocationId
        });

        if (inventoryDate1 && (date > inventoryDate1.inventoryDate)) {
            swal({
                title: "Date is greater then current Date!",
                text: "Do You want to continue to process to " + moment(date).format('DD-MM-YYYY') +
                "?\n" + "Current Transaction Date in stock location'"+locationTransferDoc.fromStockLocationId +"' is: '" + moment(inventoryDate1.inventoryDate).format("DD-MM-YYYY") + "'",
                type: "warning", showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, Do it!",
                closeOnConfirm: false
            }).then(function () {
                swal.close();
                if (inventoryDate2 && (date > inventoryDate2.inventoryDate)) {
                    swal({
                        title: "Date is greater then current Date!",
                        text: "Do You want to continue to process to " + moment(date).format('DD-MM-YYYY') +
                        "?\n" + "Current Transaction Date in stock location'"+locationTransferDoc.toStockLocationId +"' is: '" + moment(inventoryDate2.inventoryDate).format("DD-MM-YYYY") + "'",
                        type: "warning", showCancelButton: true,
                        confirmButtonColor: "#DD6B55",
                        confirmButtonText: "Yes, Do it!",
                        closeOnConfirm: false
                    }).then(function () {
                        $('#accept_form').submit();
                        swal.close();
                    }, function (dismiss) {
                        if (dismiss === 'cancel') {
                            return false;
                        }
                    });
                } else if (inventoryDate2 && (date < inventoryDate2.inventoryDate)) {
                    displayError("Date cannot be less than current Transaction Date: " + moment(inventoryDate2.inventoryDate).format("DD-MM-YYYY")+ "in stock location'"+locationTransferDoc.toStockLocationId);
                    return false;
                } else {
                    $('#accept_form').submit();
                }
                return false;
            }, function (dismiss) {
                if (dismiss === 'cancel') {
                    return false;
                }
            });
        } else if (inventoryDate1 && (date < inventoryDate1.inventoryDate)) {
            displayError("Date cannot be less than current Transaction Date: " + moment(inventoryDate1.inventoryDate).format("DD-MM-YYYY")+ "in stock location'"+locationTransferDoc.fromStockLocationId);
            return false;
        } else {
            if (inventoryDate2 && (date > inventoryDate2.inventoryDate)) {
                swal({
                    title: "Date is greater then current Date!",
                    text: "Do You want to continue to process to " + moment(date).format('DD-MM-YYYY') +
                    "?\n" + "Current Transaction Date in stock location'"+locationTransferDoc.toStockLocationId +"' is: '" + moment(inventoryDate2.inventoryDate).format("DD-MM-YYYY") + "'",
                    type: "warning", showCancelButton: true,
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: "Yes, Do it!",
                    closeOnConfirm: false
                }).then(function () {
                    $('#accept_form').submit();
                    swal.close();
                }, function (dismiss) {
                    if (dismiss === 'cancel') {
                        return false;
                    }
                });
            } else if (inventoryDate2 && (date < inventoryDate2.inventoryDate)) {
                displayError("Date cannot be less than current Transaction Date: " + moment(inventoryDate2.inventoryDate).format("DD-MM-YYYY"));
                return false;
            } else {
                $('#accept_form').submit();
            }
            return false;
        }
        return false;
    }

});
acceptFrom.helpers({
    schemaName(){
        return AcceptTransfer_schema;
    }
});


let hooksObject = {
    onSuccess (formType, result) {
        alertify.acceptLocationTransfer().close();
        displaySuccess();
    },
    onError (formType, error) {
        alertify.error(error.message);
    }
};

AutoForm.addHooks([
    'accept_form',
], hooksObject);

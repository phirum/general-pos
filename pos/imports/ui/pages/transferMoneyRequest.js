//page
import './transferMoneyRequest.html';
//lib
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify';
import {renderTemplate} from '../../../../core/client/libs/render-template';
//collection
import {TransferMoney} from '../../api/collections/transferMoney';
//methods
let indexTmpl = Template.Pos_transferMoneyRequest,
    transferInfo = Template.transferMoneyRequestInfo;
let transferState = new ReactiveVar(true);
let statusState = new ReactiveVar('active');
let loadMore = new ReactiveVar(0);
let sumLoadMore = new ReactiveVar(10);
let transferMoneyTmpCollection = new Mongo.Collection(null);
indexTmpl.onCreated(function () {
    createNewAlertify('transferMoneyRequest', {size: 'lg'});
    this.autorun(() => {
        if (Session.get('currentBranch') || transferState.get() || statusState.get()) {
            let subscription = Meteor.subscribe('pos.activeTransferMoney',
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
                transferMoneyTmpCollection.remove({});
                TransferMoney.find({
                    toBranchId: Session.get('currentBranch'),
                    pending: transferState.get() == undefined ? true : transferState.get(),
                    status: statusState.get() || 'active'
                }, {sort: {_id: -1}})
                    .forEach(function (transferMoney) {
                        Meteor.call('transferMoneyLookup', {doc: transferMoney}, function (err, result) {
                            transferMoneyTmpCollection.insert(result);
                        });
                    });
                setTimeout(function () {
                    swal.close()
                }, 200);
            }
        }
        if (sumLoadMore.get() || transferState.get() || statusState.get()) {
            Meteor.call('loadMoreTransferMoney', {
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
        return transferMoneyTmpCollection.find({}, {_id: -1});
    },
    isNotEmpty(){
        let transferMoneys = TransferMoney.find({toBranchId: Session.get('currentBranch')});
        return transferMoneys.count() > 0;
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
        let transferMoneys = TransferMoney.find({
            toBranchId: Session.get('currentBranch'),
            pending: transferState.get(),
            status: statusState.get()
        }).count();
        if (transferMoneys < loadMore.get()) {
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
        statusState.set('declined');
        loadMore.set(0);
        sumLoadMore.set(10);
    },
    'click .show-detail'(event, instance){
        alertify.transferMoneyRequest(fa('eye', 'Transfer Money'), renderTemplate(transferInfo, this));
    },
    'click .accept'(){
        let id = this._id;
        swal({
            title: "Are you sure?",
            text: "",
            type: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, accept it!",
            closeOnConfirm: false
        }).then(function () {
            Meteor.call('transferMoney', id, function (er, re) {
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
        });
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
            Meteor.call('declineTransferMoney', id, function (er, re) {
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
    transferMoneyTmpCollection.remove({});
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

//page
import './ringPullRequest.html';
//lib
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify';
import {renderTemplate} from '../../../../core/client/libs/render-template';
//collection
import {RingPullTransfers} from '../../api/collections/ringPullTransfer';
//methods
let indexTmpl = Template.Pos_ringPullRequest,
    transferInfo = Template.ringPullRequestInfo;
let transferState = new ReactiveVar(true);
let statusState = new ReactiveVar('active');
let loadMore = new ReactiveVar(0);
let sumLoadMore = new ReactiveVar(10);
let ringPullTmpCollection = new Mongo.Collection(null);
indexTmpl.onCreated(function () {
    createNewAlertify('ringPullRequest', {size: 'lg'});
    this.autorun(function () {
        if (Session.get('currentBranch') || transferState.get() || statusState.get()) {
            ringPullTmpCollection.remove({});
            let subscription = Meteor.subscribe('pos.activeRingPullTransfers',
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
                let ringPullTransfers = RingPullTransfers.find({
                    toBranchId: Session.get('currentBranch'),
                    pending: transferState.get(),
                    status: statusState.get()
                });
                if(ringPullTransfers.count() > 0) {
                    ringPullTransfers.forEach(function (doc) {
                        Meteor.call('lookupRingPull', {doc}, function (err, result) {
                            ringPullTmpCollection.insert(result);
                        });
                    });
                }
                setTimeout(function () {
                    swal.close()
                }, 200);
            }
        }
        if (sumLoadMore.get() || transferState.get() || statusState.get()) {
            Meteor.call('loadMoreRingPull', {
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
        return ringPullTmpCollection.find({}, {_id: -1});
    },
    isNotEmpty(){
        let ringPullTransfers = RingPullTransfers.find({toBranchId: Session.get('currentBranch')});
        return ringPullTransfers.count() > 0;
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
        let ringPullTransfers = RingPullTransfers.find({
            toBranchId: Session.get('currentBranch'),
            pending: transferState.get(),
            status: statusState.get()
        }).count();
        if (ringPullTransfers < loadMore.get()) {
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
        Meteor.call('pos.ringPullTransfersInfo', {_id: this._id}, function (err, result) {
            if (result) {
                console.log(result);
                alertify.ringPullRequest(fa('eye', 'Showing Transfer'), renderTemplate(transferInfo, result));
            }
            if (err) {
                console.log(err);
            }
        });
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
            Meteor.call('ringPullTransferManageStock', id, function (er, re) {
                if (er) {
                    alertify.warning(er.message);
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
            Meteor.call('declineRingPullTransfer', id, function (er, re) {
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
    ringPullTmpCollection.remove({});
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
    }
});
transferInfo.events({
    'click .printTransfer'(event, instance){
        $('#to-print').printThis();
    }
});

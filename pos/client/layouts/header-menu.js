import './header-menu.html';
import {ReactiveVar} from 'meteor/reactive-var';
//collection
import {LocationTransfers} from '../../imports/api/collections/locationTransfer';
import {RingPullTransfers} from '../../imports/api/collections/ringPullTransfer';
import {TransferMoney} from '../../imports/api/collections/transferMoney';
import {Branch} from '../../../core/imports/api/collections/branch';
let indexTmpl = Template.Pos_headerMenu;
indexTmpl.onCreated(function () {
    this.autorun(function () {
        if (Session.get('currentBranch')) {
            let branch = Meteor.subscribe('core.branch');
            let locationTransferSubscription = Meteor.subscribe('pos.activeLocationTransfers',
                {
                    toBranchId: Session.get('currentBranch'),
                    pending: true,
                    status: 'active'
                });
            let ringPullTransferSubscription = Meteor.subscribe('pos.activeRingPullTransfers', {
                toBranchId: Session.get('currentBranch'),
                pending: true,
                status: 'active'
            });
            let TransferMoneySubscription = Meteor.subscribe('pos.activeTransferMoney', {
                toBranchId: Session.get('currentBranch'),
                pending: true,
                status: 'active'
            });

        }
    });
});

indexTmpl.helpers({
    locationTransferCount(){
        return locationTransfers = LocationTransfers.find({
            toBranchId: Session.get('currentBranch'),
            pending: true
        }).count();
    },
    transferRequest(){
        let locationTransfers = LocationTransfers.find({
            toBranchId: Session.get('currentBranch'),
            pending: true
        });
        return locationTransfers;
    },
    ringPullTransferRequest(){
        let arr = [];
        let ringPullTransfer = RingPullTransfers.find({
            toBranchId: Session.get('currentBranch'),
            pending: true
        });
        ringPullTransfer.fetch().forEach(function (ringPull) {
            ringPull._fromBranch = Branch.findOne(ringPull.fromBranchId);
            arr.push(ringPull);
        });
        return arr;
    },
    ringPullCount(){
        return ringPullTransfer = RingPullTransfers.find({
            toBranchId: Session.get('currentBranch'),
            pending: true
        }).count();
    },
    transferMoneyRequest(){
        let transferMoneys = TransferMoney.find({
            toBranchId: Session.get('currentBranch'),
            pending: true
        });
        return transferMoneys;
    },
    transferMoneyRequestCount(){
        return transferMoneyRequestCount = TransferMoney.find({
            toBranchId: Session.get('currentBranch'),
            pending: true
        }).count();
    },
});
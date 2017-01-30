import  {TransferMoney} from '../../imports/api/collections/transferMoney';
Meteor.publish('pos.activeTransferMoney', function activeRingPullTransfers(selector, options = {}) {
    this.unblock();
    new SimpleSchema({
        selector: {type: Object, blackbox: true}
    }).validate({selector});
    if (this.userId) {
        Meteor._sleepForMs(200);
        let data = TransferMoney.find(selector, options);
        return data;
    }
    return this.ready();
});
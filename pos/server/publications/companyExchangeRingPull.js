import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';

// Collection
import {CompanyExchangeRingPulls} from '../../imports/api/collections/companyExchangeRingPull.js';

Meteor.publish('pos.companyExchangeRingPull', function posExchangeRingPull(selector) {
    this.unblock();
    new SimpleSchema({
        selector: {type: Object, blackbox: true}
    }).validate({selector});
    if (this.userId) {
        if(_.isEmpty(selector)){
            return this.ready();
        }
        return CompanyExchangeRingPulls.find(selector);

    }

    return this.ready();
});

Meteor.publish('pos.activeCompanyExchangeRingPull', function activeCompanyExchangeRingPulls(selector) {
    this.unblock();
    new SimpleSchema({
        selector: {type: Object, blackbox: true}
    }).validate({selector});
    if (this.userId) {
        Meteor._sleepForMs(200);
        let data = CompanyExchangeRingPulls.find(selector);
        console.log(data.fetch());
        return data;
    }
    return this.ready();
});
// Reactive Table
// ReactiveTable.publish("pos.reactiveTable.companyExchangeRingPull", ExchangeRingPulls);
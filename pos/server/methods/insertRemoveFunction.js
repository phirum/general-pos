import {RemoveCompanyExchangeRingPull, RemoveExchangeGratis,RemoveExchangeRingPulls} from '../../imports/api/collections/removedCollection';
Meteor.methods({
    insertRemovedCompanyExchangeRingPull(doc){
        doc.id = doc._id;
        doc.status = 'removed';
        doc.removeDate = new Date();
        doc._id = `${doc._id}R${moment().format('YYYY-MMM-DD-HH:mm')}`;
        RemoveCompanyExchangeRingPull.insert(doc);
    },
    insertRemoveExchangeGratis(doc){
        doc.id = doc._id;
        doc.status = 'removed';
        doc.removeDate = new Date();
        doc._id = `${doc._id}R${moment().format('YYYY-MMM-DD-HH:mm')}`;
        RemoveExchangeGratis.insert(doc);
    }  ,
    insertRemoveExchangeRingPulls(doc){
        doc.id = doc._id;
        doc.status = 'removed';
        doc.removeDate = new Date();
        doc._id = `${doc._id}R${moment().format('YYYY-MMM-DD-HH:mm')}`;
        RemoveExchangeRingPulls.insert(doc);
    }

});
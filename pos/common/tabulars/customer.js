import {Meteor} from 'meteor/meteor';
import {Session} from 'meteor/session';
import {Template} from 'meteor/templating';
import {Tabular} from 'meteor/aldeed:tabular';
import {EJSON} from 'meteor/ejson';
import {moment} from 'meteor/momentjs:moment';
import {_} from 'meteor/erasaur:meteor-lodash';
import {numeral} from 'meteor/numeral:numeral';
import {lightbox} from 'meteor/theara:lightbox-helpers';
//tmp collection
import {balanceTmpCollection} from '../../imports/api/collections/tmpCollection';
// Lib
import {tabularOpts} from '../../../core/common/libs/tabular-opts.js';

// Collection
import {Customers} from '../../imports/api/collections/customer.js';

// Page
Meteor.isClient && require('../../imports/ui/pages/customer.html');

tabularOpts.name = 'pos.customer';
tabularOpts.collection = Customers;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_customerAction},
    {data: "_id", title: "ID"},
    {data: "name", title: "Name"},
    {data: "gender", title: "Gender"},
    {data: "telephone", title: "Telephone"},
    {data: "email", title: "Email"},
    {
        data: "_id",
        title: "Amount Due",
        render: function (val) {
            try {
                Meteor.call('getCustomerBalance', {customerId: val}, function (err, result) {
                    let balanceAmount = balanceTmpCollection.findOne(val);
                    if (!balanceAmount) {
                        balanceTmpCollection.insert({_id: val, balanceAmount: result});
                    }
                });
                let balanceAmount = balanceTmpCollection.findOne(val).balanceAmount;
                return numeral(balanceAmount).format('0,0.00');
            }catch(e){};
        }
    },
    {title: '', tmpl: Meteor.isClient && Template.Pos_customerButtonAction}
];
export const CustomerTabular = new Tabular.Table(tabularOpts);

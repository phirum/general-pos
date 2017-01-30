import {Meteor} from 'meteor/meteor';
import {Session} from 'meteor/session';
import {Template} from 'meteor/templating';
import {Tabular} from 'meteor/aldeed:tabular';
import {EJSON} from 'meteor/ejson';
import {moment} from 'meteor/momentjs:moment';
import {_} from 'meteor/erasaur:meteor-lodash';
import {numeral} from 'meteor/numeral:numeral';
import {lightbox} from 'meteor/theara:lightbox-helpers';

// Lib
import {tabularOpts} from '../../../core/common/libs/tabular-opts.js';

// Collection
import {WhiteListCustomer} from '../../imports/api/collections/whiteListCustomer.js';

// Page
Meteor.isClient && require('../../imports/ui/pages/whiteListCustomer.html');

tabularOpts.name = 'pos.whiteListCustomer';
tabularOpts.collection = WhiteListCustomer;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_whiteListCustomerAction},
    {data: "customerId", title: "CustomerId"},
    {data: "customerName", title: "Customer"},
    {data: "limitTimes", title: "Limit"}

    // {data: "description", title: "Description"}
];
export const WhiteListCustomerTabular = new Tabular.Table(tabularOpts);

import {Meteor} from 'meteor/meteor';
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
import {ExchangeGratis} from '../../imports/api/collections/exchangeGratis.js';

// Page
Meteor.isClient && require('../../imports/ui/pages/exchangeGratis.html');

tabularOpts.name = 'pos.exchangeGratis';
tabularOpts.collection = ExchangeGratis;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_exchangeGratisAction},
    {data: "_id", title: "ID"},
    {
        data: "exchangeGratisDate",
        title: "Date",
        render: function (val, type, doc) {
            return moment(val).format('YYYY-MM-DD');
        }
    },
    {data: "total", title: "Total"},
    {data: "sumRemainQty", title: "Remain QTY"},
    {data: "des", title: "Description"},
    {data: "vendorId", title: "Vendor ID"}
    //{
    //    data: "_vendor",
    //    title: "Vendor Info",
    //    render: function (val, type, doc) {
    //        return JSON.stringify(val, null, ' ');
    //    }
    //}
];
tabularOpts.extraFields = ['items'];
export const ExchangeGratisTabular = new Tabular.Table(tabularOpts);

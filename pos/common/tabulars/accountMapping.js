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
import {AccountMapping} from '../../imports/api/collections/accountMapping.js';

// Page
Meteor.isClient && require('../../imports/ui/pages/accountMapping.html');

tabularOpts.name = 'pos.accountMapping';
tabularOpts.collection = AccountMapping;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_accountMappingAction},
    {data: "_id", title: "ID"},
    {data: "name", title: "Name"},
    {data: "account", title: "Account"},
    {
        data: "isUsed",
        title: "Used",
        render: function (val) {
            if (val) {
                return `<span class="label label-success"><i class="fa fa-check"></i></span>`
            }
            return `<span class="label label-danger"><i class="fa fa-remove"></i></span>`
        }
    },
];
export const AccountMappingTabular = new Tabular.Table(tabularOpts);

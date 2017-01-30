import {Meteor} from 'meteor/meteor';
import {Templet} from 'meteor/templating';
import {Tabular} from 'meteor/aldeed:tabular';
import {EJSON} from 'meteor/ejson';
import {moment} from 'meteor/momentjs:moment';
import {_} from 'meteor/erasaur:meteor-lodash';
import {numeral} from 'meteor/numeral:numeral';
import {lightbox} from 'meteor/theara:lightbox-helpers';

// Lib
import {tabularOpts} from '../../../core/common/libs/tabular-opts.js';

// Collection
import {MapUserAndAccount} from '../../imports/api/collections/mapUserAndAccount';


// Page
Meteor.isClient && require('../../imports/ui/pages/mapUserAndAccount/mapUserAndAccount.html');

tabularOpts.name = 'acc.mapUserAndAccount';
tabularOpts.collection = MapUserAndAccount;
tabularOpts.extraFields = ['userId'],

    tabularOpts.columns = [
        {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.acc_mapUserAndAccountAction},
        {
            data: "_id", title: "Id"
        }, {
            data: "userName", title: "User Name"
        }
        ,
        {
            data: "transaction", title: "Chart Account",
            render: function (val, type, doc) {
                var str = "";
                val.forEach(function (obj) {
                    if (obj) {
                        str += obj.chartAccount + "<br>";
                    }
                });
                return str;
            }
        }

    ];
export const MapUserAndAccountTabular = new Tabular.Table(tabularOpts);


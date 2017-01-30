import {PaymentGroups} from '../../imports/api/collections/paymentGroup.js';

// Lib
import './_init.js';

PaymentGroups.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
PaymentGroups.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
PaymentGroups.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();

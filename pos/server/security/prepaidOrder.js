import {PrepaidOrders} from '../../imports/api/collections/prepaidOrder.js';

// Lib
import './_init.js';

PrepaidOrders.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
PrepaidOrders.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
PrepaidOrders.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();

import {Order} from '../../imports/api/collections/order.js';

// Lib
import './_init.js';

Order.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
Order.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
Order.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();

import {Customers} from '../../imports/api/collections/customer.js';

// Lib
import './_init.js';

Customers.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
Customers.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
Customers.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();

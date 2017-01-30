import {Invoices} from '../../imports/api/collections/invoice.js';

// Lib
import './_init.js';

Invoices.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
Invoices.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
Invoices.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();

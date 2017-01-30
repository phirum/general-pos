import {PurchaseOrder} from '../../imports/api/collections/purchaseOrder.js';

// Lib
import './_init.js';

PurchaseOrder.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
PurchaseOrder.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
PurchaseOrder.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();

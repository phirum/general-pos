import {ReceivePayment} from '../../imports/api/collections/receivePayment.js';

// Lib
import './_init.js';

ReceivePayment.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
ReceivePayment.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
ReceivePayment.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();

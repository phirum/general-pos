import {ReceiveItems} from '../../imports/api/collections/receiveItem.js';

// Lib
import './_init.js';

ReceiveItems.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
ReceiveItems.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
ReceiveItems.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();

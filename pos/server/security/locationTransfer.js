import {LocationTransfers} from '../../imports/api/collections/locationTransfer.js';

// Lib
import './_init.js';

LocationTransfers.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
LocationTransfers.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
LocationTransfers.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();

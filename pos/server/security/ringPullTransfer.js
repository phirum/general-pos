import {RingPullTransfers} from '../../imports/api/collections/ringPullTransfer.js';

// Lib
import './_init.js';

RingPullTransfers.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
RingPullTransfers.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
RingPullTransfers.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();
